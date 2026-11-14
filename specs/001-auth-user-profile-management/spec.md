# Feature Specification: Authentication and User Profile Management

**Feature Branch**: `feature/user-profile-management`  
**Created**: 2026-11-04 | **Consolidated**: 2026-11-06  
**Status**: Implemented & Verified  
**Performed by**: Trịnh Văn Thành (Backend & DB), Phan Thị Thanh Huyền (Frontend)  
**Input**: User description: "End-to-end implementation of the Authentication and User Profile Management functional group, covering customer registration with email OTP verification, JWT session lifecycle and refresh rotation, Google OAuth2 integration, personal profile management with direct-to-S3 avatar upload, customer address book CRUD with default designation, and security settings."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Register and Verify Mailbox Ownership via OTP (Priority: P1) 🎯 MVP

As a new customer visiting the electronics store, I want to create an account by verifying my email address with a 6-digit one-time passcode (OTP), so that my account is securely linked to a mailbox I actually own before access is granted.

**Why this priority**: Core identity requirement; prevents unauthorized email squatting, fake accounts, and spam while ensuring delivery of transaction notifications and receipts.

**Independent Test**: Complete signup form on frontend -> receive 6-digit verification code in Mailpit SMTP -> confirm with code and password -> new verified customer account is created and auto-logged in with issued access and refresh tokens.

**Acceptance Scenarios**:
1. **Given** valid registration details (email and initial password), **When** registration is submitted, **Then** the system creates only a temporary pending registration and sends a 6-digit verification code via SMTP (Mailpit); no unverified user record is yet inserted into the primary `users` table.
2. **Given** a valid pending registration credential and the matching 6-digit code, **When** the customer submits confirmation with their authoritative password, **Then** the user account is created atomically in PostgreSQL with `email_verified = true`, `role = ROLE_CUSTOMER`, `status = ACTIVE`, and JWT authentication credentials (access + refresh token) are returned.
3. **Given** an invalid, expired (past 15 minutes), or replayed OTP code, **When** confirmation is attempted, **Then** registration fails with an explicit error message (`400 BAD_REQUEST`), and no account is created.
4. **Given** an existing pending registration, **When** the customer clicks "Resend Code", **Then** a new 6-digit OTP is generated and dispatched to the mailbox, while the previous code generation is immediately invalidated.

---

### User Story 2 - Customer Sign-In and Session Lifecycle Management (Priority: P1)

As a registered customer, I want to securely log in using my email and password, maintain an active session across pages, and safely log out when done.

**Why this priority**: Required for accessing protected customer resources, managing personal profile details, placing orders, and syncing cart state across sessions.

**Independent Test**: Authenticate via `/api/auth/login`, receive short-lived JWT access token (15 mins) and opaque refresh token (7 days). Access protected `/api/me` endpoint. Test token rotation when access token expires. Test logout, verifying that the refresh token is revoked in PostgreSQL and client storage is wiped.

**Acceptance Scenarios**:
1. **Given** registered and verified credentials, **When** valid email and password are submitted to `/api/auth/login`, **Then** the system returns HTTP 200 with a Bearer access token in the `Authorization` header and response body, along with a refresh token.
2. **Given** an expired access token, **When** the frontend API client makes a request, **Then** the client automatically intercepts HTTP 401, calls `/api/auth/refresh` using the active refresh token, receives a new token pair (refresh token rotation), and transparently replays the original request.
3. **Given** a stolen or replayed refresh token that has already been consumed, **When** refresh is requested, **Then** the server detects reuse, invalidates the entire token lineage, and forces re-authentication.
4. **Given** an active customer session, **When** the user clicks "Log Out" and confirms, **Then** `/api/auth/logout` revokes the refresh token in the database, removes tokens from `localStorage`/`sessionStorage`, and notifies all other open browser tabs to log out via `BroadcastChannel` or `StorageEvent`.

---

### User Story 3 - Sign in with Google (OAuth2 / OIDC) (Priority: P1)

As a customer, I want to quickly sign in using my existing Google account without manually creating a separate password.

**Why this priority**: Reduces onboarding friction, offering modern one-click authentication backed by Google's secure OAuth2 infrastructure.

**Independent Test**: Click "Sign in with Google", initiate PKCE flow with backend `/api/auth/oauth/google/initiate`, authenticate via Google identity provider, receive redirect callback, exchange authorization code for application JWT tokens, and verify user profile displays Google-linked identity.

**Acceptance Scenarios**:
1. **Given** a visitor on the login page, **When** "Sign in with Google" is clicked, **Then** frontend initiates Google OAuth2 PKCE flow with state verification cookie and redirects to Google Consent.
2. **Given** a new Google account with a verified email, **When** authentication callback is successfully exchanged at `/api/auth/oauth/google/callback`, **Then** a new customer user is created with `email_verified = true`, `hasLocalPassword = false`, linked in `user_identities`, and logged into the application.
3. **Given** a returning customer whose Google identity is already linked, **When** sign-in callback completes, **Then** the customer is authenticated directly into their existing account.
4. **Given** an existing local account with the same email, **When** Google login is attempted without pre-linking, **Then** the system directs the user to sign in with their password and connect Google inside Account Settings to prevent account hijacking.

---

### User Story 4 - View and Update Profile Info & Avatar (Priority: P1)

As an authenticated customer, I want to view my profile details, update my display name and phone number, and upload an avatar photo stored in cloud storage.

**Why this priority**: Essential customer identity customization, contact data accuracy for deliveries, and visual personalization.

**Independent Test**: Navigate to `/account/profile`, fetch current user profile (`/api/me`). Edit display name and phone number and submit. Select an image file (PNG/JPEG/WebP < 2MB), obtain presigned upload URL from `/api/image-uploads`, upload directly to LocalStack S3, complete upload, and verify the new avatar displays across header and profile views.

**Acceptance Scenarios**:
1. **Given** an authenticated customer on `/account/profile`, **When** the page loads, **Then** it fetches and displays full name, verified email (read-only), phone number, and current avatar from `GET /api/me`.
2. **Given** valid profile edits, **When** the customer saves changes, **Then** `PUT /api/me` updates PostgreSQL, and the frontend updates global user context and header display immediately.
3. **Given** a user selecting an avatar image file, **When** the file is chosen, **Then** the client validates size (max 2MB) and MIME type (`image/png`, `image/jpeg`, `image/webp`), requests a presigned upload URL via `POST /api/image-uploads`, uploads the binary directly to S3 storage via HTTP PUT, calls `/api/image-uploads/{id}/complete`, and associates the new image URL with the user's profile.
4. **Given** an invalid file (exceeding 2MB or invalid MIME type like `.exe`), **When** upload is attempted, **Then** the UI shows an inline error message and halts upload before network transmission.

---

### User Story 5 - Manage Shipping Addresses (Address Book CRUD) (Priority: P2)

As an authenticated customer, I want to maintain a list of delivery addresses and designate a default address, so that checkout is fast and effortless.

**Why this priority**: Core prerequisite for the upcoming e-commerce checkout and delivery functional groups.

**Independent Test**: Navigate to `/account/addresses`, list existing addresses (`GET /api/me/addresses`). Add a new address with recipient name, phone, street, city, postal code. Edit an existing address. Set an address as default. Delete a non-default address.

**Acceptance Scenarios**:
1. **Given** an authenticated user on `/account/addresses`, **When** the screen renders, **Then** all saved addresses for the current user are listed with badges indicating the default shipping destination.
2. **Given** valid address input, **When** the customer submits "Add Address", **Then** `POST /api/me/addresses` validates required fields, persists the record to `user_addresses`, and appends it to the UI list.
3. **Given** an address marked as default, **When** saved or updated, **Then** the backend atomically sets `is_default = true` on the target address and clears `is_default` on all other addresses owned by the user.
4. **Given** an existing address, **When** the user clicks "Delete" and confirms in the confirmation dialog, **Then** `DELETE /api/me/addresses/{id}` removes the address from PostgreSQL.

---

### User Story 6 - Account Security & Password Management (Priority: P2)

As a customer with a password, I want to change my current password to a new secure password and know that all existing sessions are invalidated.

**Why this priority**: Safeguards user accounts against compromised credentials and satisfies security compliance.

**Independent Test**: On `/account/security` or profile modal, enter current password and new password (minimum 8 characters with complexity requirements). Submit `PUT /api/auth/password`. Verify password change succeeds and previous sessions are revoked.

**Acceptance Scenarios**:
1. **Given** a customer with a local password, **When** changing password, **Then** the system requires verification of the current password before accepting the new password.
2. **Given** matching new password meeting complexity criteria (>= 8 chars, mixed case, number/special char), **When** submitted, **Then** the backend updates the BCrypt hash in PostgreSQL, revokes all active refresh tokens for the user, and requires fresh login.
3. **Given** an incorrect current password, **When** submitted, **Then** the server responds with `400 BAD_REQUEST / INVALID_CREDENTIALS` and leaves the existing password unchanged.

---

## Edge Cases

- **OTP Race Conditions & Rapid Submissions**: Concurrent OTP verification requests must be idempotent; once consumed, duplicate submissions within milliseconds fail cleanly with `ALREADY_VERIFIED` or `EXPIRED_CHALLENGE`.
- **Mailbox Delivery Delays**: Verification screen includes a 60-second cooldown timer before permitting another OTP resend to prevent email server throttling and outbox exhaustion.
- **Direct S3 Upload Failures**: If presigned URL upload to S3 fails (network interruption, storage quota), client does not call completion endpoint, leaving the previous avatar intact without corrupting database state.
- **Multiple Browser Tabs Synchronization**: When a user logs out in Tab A, Tab B automatically catches the session termination via `BroadcastChannel` or `storage` listener and redirects to the login screen without throwing unhandled 401 exceptions.
- **Single Default Address Invariant**: When an address is marked default, database transaction must ensure exactly one address per user has `is_default = true`, even under concurrent updates.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support email/password registration with 6-digit OTP mailbox verification delivered via SMTP.
- **FR-002**: System MUST NOT create persistent user records or credentials until mailbox verification code is validated.
- **FR-003**: System MUST expire verification OTP codes after 15 minutes and limit failed verification attempts to 5.
- **FR-004**: System MUST issue stateless JWT access tokens (15-minute expiration) and rotating refresh tokens (7-day expiration).
- **FR-005**: System MUST detect refresh token reuse and revoke all sessions associated with that token lineage upon detection.
- **FR-006**: System MUST provide a secure logout mechanism that invalidates the refresh token server-side in PostgreSQL.
- **FR-007**: System MUST support Google OAuth2/OIDC authentication using the Authorization Code Flow with PKCE.
- **FR-008**: System MUST support fetching the authenticated customer's profile via `GET /api/me`.
- **FR-009**: System MUST allow customers to update their full name and phone number via `PUT /api/me`.
- **FR-010**: System MUST reject direct email modifications via `PUT /api/me` to protect verified email integrity.
- **FR-011**: System MUST provide pre-signed S3 upload URLs for direct client-to-storage avatar uploads (`POST /api/image-uploads`).
- **FR-012**: System MUST validate avatar upload file size (<= 2MB) and permitted MIME types (`image/jpeg`, `image/png`, `image/webp`).
- **FR-013**: System MUST support full CRUD operations on customer shipping addresses (`/api/me/addresses`).
- **FR-014**: System MUST maintain at most one default address per customer in the database.
- **FR-015**: System MUST allow customers to change passwords with current-password verification via `PUT /api/auth/password`.
- **FR-016**: System MUST hash all passwords using BCrypt (cost factor >= 10) before storage in PostgreSQL.
- **FR-017**: Frontend MUST synchronize authentication status and token expiration across open browser tabs.
- **FR-018**: Frontend MUST provide clear validation feedback on forms (email regex, password length, phone format).

---

### Key Entities

- **User**: Core entity representing a registered customer (`id`, `email`, `password_hash`, `full_name`, `phone_number`, `profile_image_url`, `role`, `status`, `email_verified`, `created_at`, `updated_at`).
- **UserIdentity**: Third-party OAuth provider associations (`id`, `user_id`, `provider`, `provider_subject`, `email`, `created_at`).
- **EmailVerification**: Temporary registration & verification proofs (`id`, `email`, `code_hash`, `registration_credential`, `expires_at`, `attempts`, `status`).
- **RefreshToken**: Active refresh session records (`id`, `user_id`, `token_hash`, `session_id`, `expires_at`, `revoked`, `replaced_by_token`, `created_at`).
- **UserAddress**: Customer delivery addresses (`id`, `user_id`, `recipient_name`, `phone_number`, `address_line1`, `address_line2`, `city`, `state`, `postal_code`, `is_default`, `created_at`).
- **ImageUpload**: Metadata tracking presigned S3 media uploads (`id`, `user_id`, `storage_key`, `content_type`, `byte_size`, `status`, `created_at`).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: New users can complete registration, receive OTP via Mailpit, verify, and arrive at an authenticated session in under 60 seconds.
- **SC-002**: Token refresh operation completes in under 100ms without perceptible flicker or interruption to ongoing user browsing.
- **SC-003**: Direct avatar upload to S3 completes reliably for images up to 2MB, with instant visual update across the application UI.
- **SC-004**: 100% of addresses and profile updates persist durably in PostgreSQL across container restarts.
- **SC-005**: 100% of unit and integration test suites pass in CI/CD pipeline (Node.js test suite 38/38, Playwright browser smoke 14/14, Java Spring Boot unit/integration suite).
- **SC-006**: Zero hardcoded secrets, private keys, or API tokens committed to frontend or client-side assets.

---

## Assumptions

- Users access the application using modern standard web browsers supporting ES6+, `fetch`, and Web Storage APIs.
- Mailpit is running locally on port 1025 (SMTP) / 8025 (HTTP web UI) for development and evaluation.
- LocalStack S3 is available on port 4567/14567 for pre-signed avatar image uploads.
- PostgreSQL 17 is the primary relational database with Flyway schema versioning enabled.
