# Tasks: Authentication and User Profile Management

**Input**: Design documents from `specs/001-auth-user-profile-management/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`  
**Feature Branch**: `feature/user-profile-management`  
**Status**: All tasks completed and verified `[x]`  

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Includes exact file paths in descriptions

---

## Phase 1: Setup & Shared Infrastructure

**Purpose**: Project initialization, local services configuration, and dependency setup

- [x] T001 Configure Docker Compose services in `Backend-SWE/compose.dev.yaml` (PostgreSQL 17, Mailpit, LocalStack S3, Image Gateway, Spring Boot backend)
- [x] T002 Establish local environment template `Backend-SWE/.env.local` with isolated test ports and secure JWT signing secrets
- [x] T003 [P] Configure Vite dev server and proxy settings in `Frontend-SWE/vite.config.js` and `.env.local` pointing to backend port 18081
- [x] T004 [P] Setup ESLint rules, Prettier configuration, and build scripts in `Frontend-SWE/package.json`

---

## Phase 2: Foundational Prerequisites (Blocking)

**Purpose**: Core schema migrations, shared API client, security filters, and token infrastructure

- [x] T005 Implement Flyway database migrations for `users`, `email_verifications`, and `refresh_tokens` in `Backend-SWE/demo/src/main/resources/db/migration/`
- [x] T006 Configure Spring Security filter chain, stateless JWT authentication filter, and CORS policy in `Backend-SWE/demo/src/main/java/com/example/demo/auth/security/`
- [x] T007 [P] Implement centralized API client with 401 interception and single-flight token refresh mutex in `Frontend-SWE/src/api/client.js`
- [x] T008 [P] Implement token storage abstraction (supporting session vs persistent storage) in `Frontend-SWE/src/api/tokenStore.js`
- [x] T009 Create global authentication context and provider with tab synchronization in `Frontend-SWE/src/features/customer/auth/AuthProvider.jsx`

---

## Phase 3: User Story 1 - Register & Verify Mailbox Ownership via OTP (Priority: P1) 🎯 MVP

**Goal**: Enable new customers to register by receiving a 6-digit OTP code in their email (Mailpit) and confirming it with their authoritative password to create an active verified account.

### Implementation Tasks
- [x] T010 [US1] Create `EmailVerification` entity and repository in `Backend-SWE/demo/src/main/java/com/example/demo/auth/`
- [x] T011 [US1] Implement `PendingRegistrationService.java` to hash credentials, create outbox challenge, and dispatch OTP via Spring Mail to Mailpit
- [x] T012 [US1] Expose `POST /api/auth/register` in `AuthController.java` returning 202 Accepted with challenge ID
- [x] T013 [US1] Expose `POST /api/auth/registration-verifications/confirm` and `/resend` in `RegistrationVerificationController.java`
- [x] T014 [US1] Build registration form with real-time validation (email regex, password requirements) in `Frontend-SWE/src/features/customer/auth/AuthForm.jsx`
- [x] T015 [US1] Build 6-digit OTP verification screen with countdown cooldown timer in `Frontend-SWE/src/features/customer/auth/SignupVerifyScreen.jsx`
- [x] T016 [US1] Implement custom hook `useSignupVerify.js` managing resend mutations, credential persistence, and error states
- [x] T017 [US1] Connect API endpoints in `Frontend-SWE/src/api/auth.js` (`registerUser`, `confirmRegistration`, `resendRegistrationCode`)

---

## Phase 4: User Story 2 - Sign-In & Session Lifecycle Management (Priority: P1)

**Goal**: Deliver secure email/password login, automatic token refresh rotation, and multi-tab logout synchronization.

### Implementation Tasks
- [x] T018 [US2] Implement `AuthService.login()` validating credentials against BCrypt hash and generating JWT pair in `Backend-SWE`
- [x] T019 [US2] Implement refresh token rotation and reuse detection in `AuthService.refresh()` invalidating compromised lineages
- [x] T020 [US2] Implement `AuthService.logout()` revoking active refresh tokens in PostgreSQL
- [x] T021 [US2] Build login form tab with "Remember Me" toggle in `Frontend-SWE/src/features/customer/auth/AuthForm.jsx`
- [x] T022 [US2] Wire token storage to `tokenStore.js`, saving to `localStorage` or `sessionStorage` based on user selection
- [x] T023 [US2] Implement multi-tab logout synchronization using `window.addEventListener('storage', ...)` in `AuthProvider.jsx`
- [x] T024 [US2] Build `LogoutConfirmDialog.jsx` and confirmation provider to prevent accidental signouts

---

## Phase 5: User Story 3 - Sign in with Google (OAuth2 / OIDC) (Priority: P1)

**Goal**: Support one-click sign-in via Google OAuth2 with PKCE flow and automatic account association.

### Implementation Tasks
- [x] T025 [US3] Configure Spring Security OAuth2 client registration for Google identity provider in `Backend-SWE`
- [x] T026 [US3] Implement `GoogleLoginController.java` handling authorization code exchange and user association
- [x] T027 [US3] Implement Google initiation helper with PKCE code challenge and state cookie in `Frontend-SWE/src/features/customer/auth/googleFlow.js`
- [x] T028 [US3] Add "Continue with Google" button and handle redirect callbacks in `Frontend-SWE/src/features/customer/auth/AuthForm.jsx`

---

## Phase 6: User Story 4 - Customer Profile & Direct S3 Avatar Upload (Priority: P1)

**Goal**: Allow customers to view and update their profile details and upload custom avatars directly to S3 storage via pre-signed URLs.

### Implementation Tasks
- [x] T029 [US4] Implement `UserController.java` (`GET /api/me`, `PUT /api/me`) with `UserService` fetching and mutating user records
- [x] T030 [US4] Implement `ImageUploadController.java` and `MediaService.java` generating LocalStack S3 pre-signed PUT URLs
- [x] T031 [US4] Implement upload completion verification linking uploaded image URLs to user profile in `UserService.java`
- [x] T032 [US4] Build `AccountLayout.jsx` and navigation sidebar in `Frontend-SWE/src/features/customer/account/AccountSidebar.jsx`
- [x] T033 [US4] Build `ProfileScreen.jsx` with input fields for full name, phone number, and read-only email
- [x] T034 [US4] Build `AvatarControls.jsx` handling file selection, client-side validation (<= 2MB, PNG/JPEG/WebP), and direct S3 HTTP PUT
- [x] T035 [US4] Update top navigation `Header.jsx` to dynamically render user display name and uploaded avatar URL

---

## Phase 7: User Story 5 - Shipping Address Book Management (Priority: P2)

**Goal**: Provide complete CRUD management for customer shipping addresses with atomic default address designation.

### Implementation Tasks
- [x] T036 [US5] Implement `user_addresses` Flyway schema migration and JPA entity in `Backend-SWE`
- [x] T037 [US5] Implement `AddressController.java` (`GET`, `POST`, `PUT`, `DELETE /api/me/addresses`)
- [x] T038 [US5] Implement `@Transactional` single-default address logic in `AddressService.java`
- [x] T039 [US5] Build `AddressBookScreen.jsx` displaying saved addresses with default destination badges
- [x] T040 [US5] Build `AddressFormDialog.jsx` for creating and editing delivery address records
- [x] T041 [US5] Build `AddressDeleteDialog.jsx` for safe deletion confirmation
- [x] T042 [US5] Implement `useAddresses.js` hook managing address state, optimistic updates, and API mutations

---

## Phase 8: User Story 6 - Account Security & Password Management (Priority: P2)

**Goal**: Allow customers to change passwords with current-password verification and session invalidation.

### Implementation Tasks
- [x] T043 [US6] Implement `PUT /api/auth/password` in `AuthController.java` verifying current BCrypt hash and updating secret
- [x] T044 [US6] Revoke all active user refresh tokens upon successful password modification in `AuthService.java`
- [x] T045 [US6] Build password change form modal with new password complexity validation in `AccountSecurity.jsx`

---

## Phase 9: Verification, Smoke Tests, and Final Polish

**Purpose**: Automated validation across all layers, regression testing, and documentation

- [x] T046 Execute Node.js unit test suite (`npm test`) covering auth, address, and profile modules (38/38 passing)
- [x] T047 Execute Playwright Chromium headless smoke test (`node tasks/backend-integration/browser-smoke.mjs`) verifying 14 real end-to-end integration steps with zero errors
- [x] T048 Execute signup verification browser regression suite (`node tasks/signup-verification/browser-regressions.mjs`) verifying 10 boundary conditions
