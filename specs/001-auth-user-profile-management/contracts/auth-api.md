# API Contract: Authentication

**Base Path**: `/api/auth`  
**Protocol**: HTTPS / REST  
**Authentication**: Bearer JWT (Nimbus JOSE) in `Authorization` header  

---

## 1. Endpoints

### 1.1 Initiate Registration with Email
- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Public**: Yes
- **Headers**: `Content-Type: application/json`

**Request Body**:
```json
{
  "email": "customer@example.com",
  "password": "Password123!"
}
```

**Responses**:
- `202 Accepted`: Ephemeral challenge created; OTP dispatched to mailbox.
```json
{
  "challengeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "registrationCredential": "sec_cred_a98f7bc290...",
  "expiresAt": "2026-11-04T12:15:00Z"
}
```
- `400 Bad Request`: Validation failure (invalid email format, password under 8 characters).
- `409 Conflict`: An active user account with this email already exists.

---

### 1.2 Confirm Registration & Consume OTP
- **Method**: `POST`
- **Path**: `/api/auth/registration-verifications/confirm`
- **Public**: Yes
- **Headers**: `Content-Type: application/json`

**Request Body**:
```json
{
  "challengeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "registrationCredential": "sec_cred_a98f7bc290...",
  "code": "491823",
  "password": "Password123!"
}
```

**Responses**:
- `201 Created`: User created in PostgreSQL; session and credentials issued.
  - **Headers**: `Authorization: Bearer <accessToken>`, `Cache-Control: no-store`
```json
{
  "tokenType": "Bearer",
  "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
  "refreshToken": "rf_920af812c7...",
  "expiresIn": 900
}
```
- `400 Bad Request`: Wrong code, code expired, or credential tampered with.

---

### 1.3 Resend Registration Code
- **Method**: `POST`
- **Path**: `/api/auth/registration-verifications/resend`
- **Public**: Yes
- **Headers**: `Content-Type: application/json`

**Request Body**:
```json
{
  "challengeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "registrationCredential": "sec_cred_a98f7bc290..."
}
```

**Responses**:
- `202 Accepted`: Old code invalidated; new 6-digit OTP sent.
```json
{
  "challengeId": "e12a4564-9988-4122-b3fc-2c963f66bbb2",
  "registrationCredential": "sec_cred_b77d290111...",
  "expiresAt": "2026-11-04T12:20:00Z"
}
```

---

### 1.4 Customer Login
- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Public**: Yes
- **Headers**: `Content-Type: application/json`

**Request Body**:
```json
{
  "identifier": "customer@example.com",
  "password": "Password123!"
}
```

**Responses**:
- `200 OK`: Successful authentication.
  - **Headers**: `Authorization: Bearer <accessToken>`, `Cache-Control: no-store`
```json
{
  "tokenType": "Bearer",
  "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
  "refreshToken": "rf_12345abcdef...",
  "expiresIn": 900
}
```
- `401 Unauthorized`: Invalid credentials.

---

### 1.5 Rotate Refresh Token
- **Method**: `POST`
- **Path**: `/api/auth/refresh`
- **Public**: Yes
- **Headers**: `Content-Type: application/json`

**Request Body**:
```json
{
  "refreshToken": "rf_12345abcdef..."
}
```

**Responses**:
- `200 OK`: New access & refresh token pair returned.
  - **Headers**: `Authorization: Bearer <newAccessToken>`, `Cache-Control: no-store`
```json
{
  "tokenType": "Bearer",
  "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
  "refreshToken": "rf_new_98765fedcba...",
  "expiresIn": 900
}
```
- `401 Unauthorized`: Refresh token expired, revoked, or reuse detected.

---

### 1.6 Customer Logout
- **Method**: `POST`
- **Path**: `/api/auth/logout`
- **Protected**: Bearer Token
- **Headers**: `Content-Type: application/json`, `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "refreshToken": "rf_current..."
}
```

**Responses**:
- `204 No Content`: Refresh token revoked in database.

---

### 1.7 Change Password
- **Method**: `PUT`
- **Path**: `/api/auth/password`
- **Protected**: Bearer Token
- **Headers**: `Content-Type: application/json`, `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "currentPassword": "Password123!",
  "newPassword": "NewSecurePassword456!"
}
```

**Responses**:
- `204 No Content`: Password changed; all active refresh tokens revoked.
- `400 Bad Request`: Incorrect current password or new password invalid.
