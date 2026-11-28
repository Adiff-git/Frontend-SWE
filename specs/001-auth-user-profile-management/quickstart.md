# Quickstart & Verification Guide: Auth and User Profile Management

**Feature**: `001-auth-user-profile-management`  
**Date**: 2026-11-05  
**Performed by**: Trịnh Văn Thành (Backend), Phan Thị Thanh Huyền (Frontend)  

This guide provides end-to-end instructions for running the complete full-stack environment, executing all user scenarios, and validating the implementation using automated tests and manual walkthroughs.

---

## 1. Prerequisites

- **Docker Desktop** (v24+ with Docker Compose v2)
- **Node.js** (v18.x or v20.x+) and `npm`
- **Modern Web Browser** (Chrome / Chromium recommended for automated tests)
- **Git**

---

## 2. Environment Configuration

### Sibling Repository Layout
Ensure the repositories are located side-by-side:
```text
swe-project/
├── Backend-SWE/     # Spring Boot backend, Docker Compose, Flyway migrations
└── Frontend-SWE/    # React frontend, Vite, Playwright test scripts
```

### Backend Configuration
Verify that `../Backend-SWE/.env.local` contains appropriate local development secrets:
```dotenv
LOCAL_DB_PORT=55433
LOCAL_DB_NAME=backend
LOCAL_DB_USER=backend
LOCAL_DB_PASSWORD=local_dev_password_123
JWT_SECRET=super_secret_jwt_key_that_is_at_least_32_bytes_long!
JWT_ISSUER=urn:backend-swe:local
SERVER_PORT=18081
LOCAL_STORAGE_PORT=14567
LOCAL_STORAGE_BUCKET=backend-images
EMAIL_VERIFICATION_ENABLED=true
GOOGLE_ENABLED=false
```

### Frontend Configuration
Verify that `Frontend-SWE/.env.local` points to the local backend port:
```dotenv
VITE_API_URL=http://localhost:18081
```

---

## 3. Starting the Full Stack

### Step 1: Start Backend Services with Docker Compose
From the `Backend-SWE` directory:
```bash
docker compose --env-file .env.local -f compose.dev.yaml up -d --build --wait
```

Verify that all five container services report healthy:
- **`postgres`**: Relational database (Port 55433)
- **`mailpit`**: SMTP server and Web Mailbox UI (Web UI: `http://localhost:8025`, SMTP: 1025)
- **`localstack`**: AWS S3 emulator (Port 4567 / 14567)
- **`image-storage`**: Direct S3 proxy gateway
- **`backend`**: Spring Boot 3 REST API (Port 18081)

### Step 2: Start the Frontend Application
From the `Frontend-SWE` directory:
```bash
npm install
npm run dev:api
```
The React single-page application is now accessible at `http://localhost:5173`.

---

## 4. End-to-End Walkthrough Scenarios

### Scenario A: Register & Verify Account (User Story 1)
1. Open `http://localhost:5173` in your browser.
2. Click **"Sign In"** in the top navigation, then switch to the **"Sign Up"** tab.
3. Enter an email (e.g. `testuser@example.com`) and password (e.g. `Password123!`), then click **"Create Account"**.
4. The screen transitions to the **Signup Verification** screen (`/auth/verify-signup`).
5. Open the Mailpit web interface in a new tab: `http://localhost:8025`.
6. Click the newest email received with subject *"Your Verification Code"*. Note the 6-digit OTP (e.g., `491823`).
7. Return to the application, enter the 6-digit code, and click **"Confirm Verification"**.
8. The system creates the user in PostgreSQL, authenticates the session, and redirects to the store with your name and avatar displayed in the top right header.

### Scenario B: Customer Login & Multi-Tab Logout (User Story 2)
1. Open an incognito window or log out from the header menu.
2. Navigate to `/auth` and log in with `testuser@example.com` and `Password123!`.
3. Open a second browser tab pointing to `http://localhost:5173/account/profile`.
4. In Tab 1, click your avatar and select **"Log Out"**, then confirm the modal.
5. Notice that Tab 2 immediately synchronizes, revoking the session and redirecting to the login screen.

### Scenario C: Customer Profile & S3 Avatar Upload (User Story 4)
1. Log in and navigate to **"My Account"** -> **"Profile Information"** (`/account/profile`).
2. Update **Full Name** to `Nguyen Van A` and **Phone Number** to `+84 987 654 321`.
3. Click **"Save Changes"**; verify the notification confirms success and the header name updates.
4. Click **"Upload Avatar"**, choose a PNG or JPEG photo under 2MB.
5. The frontend requests a pre-signed URL, uploads directly to LocalStack S3, and notifies the backend.
6. The avatar image renders immediately in the profile preview and the top navigation header.

### Scenario D: Shipping Address Book CRUD (User Story 5)
1. In the account sidebar, click **"Addresses"** (`/account/addresses`).
2. Click **"Add New Address"**. Fill in:
   - Recipient Name: `Nguyen Van A`
   - Phone Number: `0987654321`
   - Address Line: `123 Nguyen Hue Street`
   - City: `Ho Chi Minh City`
   - Postal Code: `700000`
   - Check **"Set as default shipping address"**.
3. Click **"Save Address"**. The address appears in the list with a **"Default"** badge.
4. Add a second address without checking default.
5. Click **"Set Default"** on the second address; observe that default status switches atomically.
6. Click **"Delete"** on an address and confirm in the dialog; verify it is removed from the database.

---

## 5. Automated Verification Test Suite

Run the full automated test suite to confirm complete verification:

### 1. Frontend Unit Tests (38/38 passing)
```bash
npm test
```
Executes focused unit tests for `auth.test.js`, `profile.test.js`, `address.test.js`, `signupVerify.test.js`, and `navigation.test.js`.

### 2. Browser Smoke Suite (Real Backend & Services)
```bash
node tasks/backend-integration/browser-smoke.mjs
```
Runs a 14-step automated Playwright Chromium test covering:
- Real registration and OTP code fetching via Mailpit API
- Session persistence and auto-refresh
- Profile persistence in PostgreSQL
- Direct avatar upload to LocalStack S3
- Address book CRUD
- Multi-tab session synchronization and logout

### 3. Verification Race-Condition & Boundary Regression Suite
```bash
node tasks/signup-verification/browser-regressions.mjs
```
Validates 10 edge-case scenarios including rapid double-clicks, expired tokens, invalid OTP entries, and cooldown timers.

---

## 6. Clean Shutdown

To stop all background Docker services cleanly:
```bash
docker compose --env-file ../Backend-SWE/.env.local -f ../Backend-SWE/compose.dev.yaml stop
```
To stop and remove containers (preserving database volume):
```bash
docker compose --env-file ../Backend-SWE/.env.local -f ../Backend-SWE/compose.dev.yaml down
```
