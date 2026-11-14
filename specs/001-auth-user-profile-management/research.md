# Technical Research & Architectural Decisions: Auth & User Profile Management

**Feature**: `001-auth-user-profile-management`  
**Date**: 2026-11-04  
**Authors**: Trịnh Văn Thành, Phan Thị Thanh Huyền  

---

## 1. Registration & Email Verification (OTP) Architecture

### Problem Statement
How should the system register new users while guaranteeing mailbox ownership, preventing email squatting, and stopping spam accounts without leaving unverified ghost records in the primary database?

### Evaluated Alternatives
1. **Immediate User Creation with `is_verified=false`**:
   - *Pros*: Simple, standard pattern in older applications.
   - *Cons*: Pollutes the `users` table with unverified emails; prevents legitimate users from registering if an attacker initiates with their email; requires periodic cleanup cron jobs; makes authentication guards error-prone.
2. **Two-Stage Verification with Ephemeral Outbox (Selected)**:
   - *Pros*: The `users` table only ever contains verified, legitimate customers. An unverified attempt expires after 15 minutes. Uniqueness conflicts are checked at initiation, but official reservation occurs only upon presenting the valid OTP code along with the authoritative password.
   - *Cons*: Requires managing a separate `email_verifications` entity and cryptographic proof tokens.

### Decision
Adopt the **Two-Stage Ephemeral Outbox Pattern**:
- `POST /api/auth/register` creates an ephemeral record in `email_verifications` with a BCrypt-hashed OTP code, a 15-minute TTL, and returns a client-side `registrationCredential` + `challengeId`.
- Mailpit receives the 6-digit code over SMTP.
- `POST /api/auth/registration-verifications/confirm` receives the OTP code, credential, and password, verifies the hash, creates the user atomically in `users`, and signs JWT tokens in a single transaction.

---

## 2. Token Lifecycle, Session Management, and Tab Sync

### Problem Statement
How should client authentication tokens be managed across browser reloads and multiple tabs while minimizing security vulnerabilities (XSS, token replay)?

### Evaluated Alternatives
1. **Long-lived Access Token in localStorage**:
   - *Pros*: Extremely simple to implement.
   - *Cons*: High security risk: if stolen, the attacker has prolonged access. Cannot be revoked easily without server-side blacklisting.
2. **Dual-Token with Refresh Token Rotation (Selected)**:
   - *Pros*: Access token is short-lived (15 minutes). Refresh token is long-lived (7 days) and single-use. Every refresh request issues a new refresh token and invalidates the old one. If an invalidated refresh token is ever presented again, the backend detects reuse and immediately terminates all sessions for that user.
   - *Cons*: Requires handling race conditions in concurrent client requests during token expiration.

### Decision & Client Interceptor Architecture
- Implement a single-flight refresh mutex in `src/api/client.js`. If multiple API calls fail with 401 simultaneously, only the first triggers `/api/auth/refresh`; subsequent calls queue and wait for the new token before replaying.
- Store tokens in `tokenStore.js` with support for both session persistence (remember me) and tab-scoped storage.
- Synchronize logout events across all open browser tabs using `window.addEventListener('storage', ...)` and `BroadcastChannel`, immediately flushing authentication state and redirecting to the login screen.

---

## 3. Avatar Upload Strategy: Direct-to-Storage (S3 Presigned URLs)

### Problem Statement
Customers need to upload avatar images up to 2MB. Should uploads flow through the Spring Boot backend server or directly to object storage?

### Evaluated Alternatives
1. **Multipart Upload through Spring Boot (`/api/me/avatar`)**:
   - *Pros*: Everything is handled within the application server.
   - *Cons*: Consumes JVM memory, holds backend HTTP worker threads during slow mobile uploads, increases latency, and couples application scaling with binary file I/O.
2. **Direct-to-S3 Upload via Pre-Signed PUT URL (Selected)**:
   - *Pros*: High performance. The frontend requests permission from the backend, receiving a time-limited pre-signed AWS S3 URL. The frontend uploads the raw binary file directly to LocalStack/AWS S3 via standard HTTP PUT. The backend never handles the image bytes directly.
   - *Cons*: Requires a two-step flow (request URL -> upload to S3 -> notify backend of completion).

### Decision
Implement the **Pre-Signed URL Flow**:
1. Frontend validates file size (<= 2MB) and MIME type (`image/jpeg`, `image/png`, `image/webp`).
2. Frontend calls `POST /api/image-uploads` with `byteSize` and `contentType`.
3. Backend generates a UUID storage key, constructs a pre-signed S3 PUT URL valid for 5 minutes, and responds with `uploadUrl` and `imageId`.
4. Frontend executes `PUT <uploadUrl>` directly to LocalStack S3 with the binary payload.
5. Frontend calls `POST /api/image-uploads/{imageId}/complete`. Backend verifies object presence in S3 and updates `user.profile_image_url`.

---

## 4. Shipping Address Book: Default Address Integrity

### Problem Statement
A customer can have multiple delivery addresses, but at most ONE address may be designated as the default shipping address. How to ensure this invariant under concurrent updates?

### Decision
- In PostgreSQL, manage addresses in `user_addresses` linked by `user_id`.
- In `AddressService.java`, execute default updates within an `@Transactional` boundary:
  ```java
  if (request.isDefault()) {
      addressRepository.clearDefaultByUserId(userId);
  }
  address.setDefault(request.isDefault());
  addressRepository.save(address);
  ```
- If a customer deletes their current default address and has other remaining addresses, the UI and service cleanly update without leaving dangling references.

---

## 5. Technology Stack Summary & Justification

| Layer | Chosen Technology | Justification |
|---|---|---|
| **Frontend Framework** | React 18 + Vite | Blazing fast build tooling, reactive state management, modular components, wide ecosystem. |
| **Routing & State** | React Router v6 + Context API | Declarative nested routing with layout routes (`CustomerLayout`, `AccountLayout`), centralized `AuthContext`. |
| **Backend Framework** | Java 25 + Spring Boot 3.x | Enterprise-grade security, robust JPA/Hibernate ORM, rich ecosystem for JWT and OAuth2. |
| **Security Engine** | Spring Security 6 + Nimbus JOSE | Industry standard for stateless Bearer JWT parsing, BCrypt password hashing, and OAuth2 Client flows. |
| **Database** | PostgreSQL 17 + Flyway | ACID compliance, robust indexing, declarative migration version control (V1..V14). |
| **Object Storage** | LocalStack S3 (AWS S3 compatible) | Zero cloud vendor cost during development, accurate S3 pre-signed URL emulation. |
| **Email SMTP Testing** | Mailpit | Lightweight SMTP server catching all outgoing OTP emails with instant REST and web UI inspection. |
