# Security & Data Integrity Checklist: Auth & User Profile Management

**Purpose**: Review security postures, cryptographic controls, token lifecycles, and data protection requirements.  
**Created**: 2026-11-04  
**Feature**: [spec.md](../spec.md)  
**Review Ownership**: Trịnh Văn Thành (Backend Lead), Phan Thị Thanh Huyền (Frontend)  

---

## 1. Authentication & Password Security

- [x] CHK013 Passwords are never stored in plaintext; BCrypt hashing with cost factor >= 10 is enforced.
- [x] CHK014 Password complexity rules (min 8 characters, letters and numbers/symbols) are validated on both frontend and backend.
- [x] CHK015 Direct password reset/update requires current-password reauthentication before updating.
- [x] CHK016 Password changes automatically revoke all active refresh tokens for the user account.

---

## 2. OTP Mailbox Verification Security

- [x] CHK017 Registration initiation generates a random 6-digit numeric OTP with cryptographic randomness.
- [x] CHK018 OTP codes expire automatically after 15 minutes.
- [x] CHK019 Resending an OTP rotates the active challenge and invalidates previous code generations.
- [x] CHK020 Outbox code payloads are encrypted at rest; failed verification attempts are capped at 5 to prevent brute force.

---

## 3. Token Security & Session Management

- [x] CHK021 JWT access tokens have a short expiration lifespan (15 minutes).
- [x] CHK022 Refresh tokens are single-use; rotating refresh token flow replaces tokens upon each consumption.
- [x] CHK023 Token reuse detection is enabled; presenting a previously used token revokes the entire token family.
- [x] CHK024 Logging out actively revokes the refresh token server-side in PostgreSQL.
- [x] CHK025 Frontend synchronizes logout across open browser tabs via storage events, immediately purging client tokens.

---

## 4. Media & Data Protection

- [x] CHK026 S3 presigned URLs expire within 5 minutes and restrict upload size to <= 2MB.
- [x] CHK027 Client-side and server-side validation restricts avatar MIME types to `image/jpeg`, `image/png`, and `image/webp`.
- [x] CHK028 Verified email cannot be modified arbitrarily via `PUT /api/me`.
- [x] CHK029 Zero secrets, private keys, or admin credentials are exposed in client-side bundles or `VITE_` variables.
