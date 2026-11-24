# Data Model: Authentication & User Profile Management

**Feature**: `001-auth-user-profile-management`  
**Database**: PostgreSQL 17  
**Schema Versioning**: Flyway Migrations (V1..V14)  
**Date**: 2026-11-04  

---

## 1. Entity-Relationship Diagram

```mermaid
erDiagram
    users ||--o{ user_identities : "has third-party logins"
    users ||--o{ refresh_tokens : "owns active sessions"
    users ||--o{ user_addresses : "maintains shipping addresses"
    users ||--o{ image_uploads : "uploads media assets"
    
    users {
        bigint id PK
        varchar email UK "RFC 5322 formatted, unique"
        varchar password_hash "BCrypt hashed password (cost 10+)"
        varchar full_name "Customer display name"
        varchar phone_number "E.164 or national phone format"
        varchar profile_image_url "S3 CDN public URL"
        varchar role "ROLE_CUSTOMER, ROLE_ADMIN"
        varchar status "ACTIVE, SUSPENDED, DELETED"
        boolean email_verified "True once verified via OTP"
        boolean has_local_password "True if password is set"
        timestamp created_at "UTC timestamp"
        timestamp updated_at "UTC timestamp"
    }

    user_identities {
        bigint id PK
        bigint user_id FK "References users(id)"
        varchar provider "e.g. GOOGLE"
        varchar provider_subject "Google sub claim ID"
        varchar email "Email reported by provider"
        timestamp created_at "UTC timestamp"
    }

    email_verifications {
        uuid id PK
        varchar email "Target email address"
        varchar code_hash "BCrypt or HMAC hash of 6-digit OTP"
        varchar registration_credential "Secret client token for confirm step"
        varchar operation "REGISTRATION, EMAIL_CHANGE, PASSWORD_RESET"
        int attempt_count "Max 5 attempts allowed"
        timestamp expires_at "15 minutes expiration"
        varchar status "PENDING, CONSUMED, EXPIRED"
        timestamp created_at "UTC timestamp"
    }

    refresh_tokens {
        bigint id PK
        bigint user_id FK "References users(id)"
        uuid session_id "Browser session identifier"
        varchar token_hash UK "SHA-256 hash of refresh secret"
        varchar replaced_by_token "Pointer to successor token (rotation)"
        boolean revoked "True if invalidated or reused"
        timestamp expires_at "7 days expiration"
        timestamp created_at "UTC timestamp"
    }

    user_addresses {
        bigint id PK
        bigint user_id FK "References users(id)"
        varchar recipient_name "Name of delivery recipient"
        varchar phone_number "Contact number for courier"
        varchar address_line1 "Street number and name"
        varchar address_line2 "Apartment, suite, unit (optional)"
        varchar city "City or district"
        varchar state "Province or state"
        varchar postal_code "ZIP or postal code"
        boolean is_default "At most one true per user"
        timestamp created_at "UTC timestamp"
        timestamp updated_at "UTC timestamp"
    }

    image_uploads {
        uuid id PK
        bigint user_id FK "References users(id)"
        varchar storage_key "S3 object key (e.g. avatars/{uuid}.webp)"
        varchar content_type "MIME type (image/png, image/jpeg, image/webp)"
        bigint byte_size "File size in bytes (max 2097152)"
        varchar status "PENDING, COMPLETED, ABANDONED"
        timestamp created_at "UTC timestamp"
    }
```

---

## 2. Table Specifications & DDL Definitions

### 2.1 `users` Table
Stores primary user accounts and core profile information.

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    full_name VARCHAR(150),
    phone_number VARCHAR(30),
    profile_image_url VARCHAR(500),
    role VARCHAR(50) NOT NULL DEFAULT 'ROLE_CUSTOMER',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    has_local_password BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
```

### 2.2 `email_verifications` Table
Holds ephemeral one-time passcode challenges for registrations and email changes.

```sql
CREATE TABLE email_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    registration_credential VARCHAR(255) NOT NULL,
    operation VARCHAR(50) NOT NULL DEFAULT 'REGISTRATION',
    attempt_count INT NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_verifications_email_status ON email_verifications(email, status);
CREATE INDEX idx_verifications_credential ON email_verifications(registration_credential);
CREATE INDEX idx_verifications_expires_at ON email_verifications(expires_at);
```

### 2.3 `refresh_tokens` Table
Tracks active refresh tokens, supporting token rotation and theft detection.

```sql
CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    replaced_by_token VARCHAR(255),
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_session ON refresh_tokens(session_id);
```

### 2.4 `user_addresses` Table
Stores customer delivery addresses. Enforces maximum of one default address per customer.

```sql
CREATE TABLE user_addresses (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(30) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(30) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_addresses_user ON user_addresses(user_id);
```

---

## 3. Lifecycle & State Machines

### 3.1 Registration State Flow
```mermaid
stateDiagram-v2
    [*] --> FormSubmitted: POST /api/auth/register
    FormSubmitted --> VerificationPending: Outbox OTP sent & 202 Accepted
    VerificationPending --> CodeExpired: Time > 15 minutes
    VerificationPending --> MaxAttemptsExceeded: Failed code checks > 5
    VerificationPending --> ResendRequested: Customer clicks Resend
    ResendRequested --> VerificationPending: Old code invalidated, new code issued
    VerificationPending --> UserCreated: Valid code + Authoritative Password
    UserCreated --> ActiveSession: JWT & Refresh Tokens Issued
    CodeExpired --> [*]: Purged by background cleaner
    MaxAttemptsExceeded --> [*]: Invalidated
    ActiveSession --> [*]
```

### 3.2 Refresh Token Rotation & Theft Detection
```mermaid
stateDiagram-v2
    [*] --> TokenActive: Initial Login
    TokenActive --> TokenRotated: POST /api/auth/refresh
    TokenRotated --> TokenActive: New token pair issued
    TokenRotated --> TokenTheftDetected: Old token re-submitted (replay attack)
    TokenTheftDetected --> AllSessionsRevoked: Complete session lineage killed in DB
    AllSessionsRevoked --> [*]: User forced to re-login
```
