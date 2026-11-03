# Login and signup UI

## Scope

- `/login` and `/signup` now use the Figma auth screens, Vietnamese UI copy, local Figma assets and shared CSS tokens.
- Route pages compose `features/customer/auth/AuthScreen`; domain behavior lives in that feature. `Button` and `FormField` are shared controls.
- Forms use TanStack Query mutations and the existing `src/api/auth.js` helpers. They handle client validation, structured field errors, submission locking, pending state, password visibility and recoverable errors without clearing input.
- Successful authentication shows a confirmation with an explicit continue link. A safe internal destination from router `state.from` or the `redirect` query parameter is preserved when switching forms. External redirects are rejected.

## Design references and adaptations

File: `lJYIFsi9VAc0FyNDOjdyCh`. Login: `77:19853`; signup: `77:19930`; error state: `77:21344` and its notice `77:21362`.

- Desktop spacing, typography, colors, logo crop, product-image crop and icon dimensions follow those frames. Original assets are stored in `src/assets/auth/`; no temporary Figma URLs are used at runtime.
- The Figma sample cart count and assertion that a cart was preserved are omitted because no cart source or merge API has been integrated. A link to the cart replaces the context-panel message.
- No mobile auth frame was supplied. Below 700px the form comes first, the context panel follows it, navigation simplifies, and the footer stacks. At intermediate widths spacing contracts. These breakpoints are implementation choices.
- The username hint reflects the UI's 4–50 character policy and the backend's prohibition on `@`. The login field also accepts an email identifier, as supported by the existing endpoint.
- Hover and focus styling follow the existing tokens and accessibility conventions; exact interaction states were not supplied for every control.

## Confirmed backend contracts

Checked `RegisterRequest`, `LoginRequest`, `PasswordPolicyValidator`, `UpdateUserRequest`, `PrivateUserResponse`, `AuthController` and token-generation source in `../Backend-SWE`.

- Register: `POST /api/auth/register`, `{ username, password }`. Login: `POST /api/auth/login`, `{ identifier, password }`.
- Registration rejects unknown fields. Optional display name is saved separately using `PUT /api/me`, `{ displayName }`, after the account/session has been created. If that update fails, the success screen offers a profile-only retry; it never repeats registration.
- Passwords are not trimmed or normalized. Registration requires at least eight Unicode code points and at most 72 UTF-8 bytes. Username is trimmed; the backend caps it at 50 code points. The four-character minimum comes from the UI design/user flow.
- The access token comes from the response `Authorization` header. Refresh data comes from JSON; the existing client handles those responses.
- Checking “Ghi nhớ” stores the refresh token in `localStorage`. Otherwise it uses `sessionStorage`, including signup. Access tokens remain in memory. Refresh rotation preserves the selected storage; logout clears both stores. Session storage survives reloads within the tab and is governed by browser tab/session restoration behavior.
- `/api/me` and the current JWT do not expose a role contract suitable for selecting an Admin redirect. This implementation does not infer role or authorization from usernames or guessed claims.

## Remaining work

- App-wide session bootstrap/provider, account header, logout UI, role-aware navigation and protected routes.
- Guest-cart merge, cart count and checkout continuation after a confirmed merge.
- Password recovery remains outside this UI task; the existing recovery route placeholders are unchanged.
- Verify against a configured live backend, including CORS exposure of `Authorization`. Mocked browser checks do not establish live integration or authorization correctness.

## Verification

- `npm run lint`
- `npm run build`
- `node --test tests/auth.test.js` checks Unicode validation and refresh-token persistence/rotation/logout.
- Browser checks with mocked API responses covered desktop 1280px, widths 320/390/768px, local asset loading, overflow, password toggles, validation, 401/409/network errors, loading/disabled state, login/signup success, remember preference, return links and profile-only retries. Desktop screenshots were compared with Figma; mobile layout was inspected as an implementation adaptation.

Local browser checks and screenshots are retained under the ignored `agents/qa/` folder. No real accounts were created during verification.
