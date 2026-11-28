---

description: "Task list template for feature implementation"
---

# Tasks: Cart API Integration

**Input**: Design documents from `/specs/003-cart-api-integration/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included because the user requested component tests with mocked API responses for each user story, and `plan.md`, `spec.md`, and `quickstart.md` require pure-helper tests.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths below use the single-project structure from `plan.md`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add dev-only component-test tooling, mocked API fixtures, the shared client option, cart files, hooks, components, and test suites.

- [X] T001 Add devDependencies `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, and `jsdom` to `package.json` and update `package-lock.json`
- [X] T002 Add `test` script running `node --test tests/*.test.js && vitest run` and `test:watch` script running `vitest` in `package.json`
- [X] T003 Create `vitest.config.js` with jsdom environment, React plugin, and `setupFiles: ['tests/setup.js']` while preserving existing `vite.config.js` behavior
- [X] T004 Create `tests/setup.js` importing `@testing-library/jest-dom/vitest` and registering automatic cleanup after each test
- [X] T005 [P] Create exact-money cart response fixtures in `tests/mocks/cartFixtures.js`
- [X] T006 [P] Create mocked `cartApi` response helpers in `tests/mocks/cartApiMocks.js`
- [X] T007 [P] Create authenticated and guest router fixtures in `tests/mocks/authFixtures.js`
- [X] T008 [P] Create `tests/mocks/renderWithProviders.jsx` wrapping components with `QueryClientProvider`, `MemoryRouter`, and auth fixtures
- [X] T009 Add opt-in `responseType: 'text'` handling that parses success bodies as text and keeps error responses as JSON in `src/api/client.js`
- [X] T010 [P] Create cart helper files `src/features/customer/cart/cartApi.js`, `src/features/customer/cart/cartIntent.js`, `src/features/customer/cart/cartMappers.js`, `src/features/customer/cart/cartReasons.js`, `src/features/customer/cart/cartValidation.js`, and `src/features/customer/cart/exactMoneyJson.js`
- [X] T011 [P] Create cart hooks `src/features/customer/cart/useCart.js`, `src/features/customer/cart/useCartCount.js`, and `src/features/customer/cart/useVoucherWallet.js`
- [X] T012 [P] Create cart components and matching CSS files `src/features/customer/cart/CartPage.jsx`, `src/features/customer/cart/CartPage.css`, `src/features/customer/cart/CartItems.jsx`, `src/features/customer/cart/CartItems.css`, `src/features/customer/cart/CartItem.jsx`, `src/features/customer/cart/CartItem.css`, `src/features/customer/cart/CartSummary.jsx`, `src/features/customer/cart/CartSummary.css`, `src/features/customer/cart/VariantPicker.jsx`, `src/features/customer/cart/VariantPicker.css`, `src/features/customer/cart/VoucherPicker.jsx`, `src/features/customer/cart/VoucherPicker.css`, `src/features/customer/cart/CartNotice.jsx`, and `src/features/customer/cart/CartNotice.css`
- [X] T013 [P] Create `node:test` suites `tests/cartApi.test.js`, `tests/cartIntent.test.js`, `tests/cartMappers.test.js`, `tests/cartValidation.test.js`, and `tests/exactMoneyJson.test.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement the shared API, exact-money, mapping, reason, query, and header-count infrastructure that every story depends on.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T014 [P] Implement `parseExactMoneyJson(text)` and `formatExactVnd(amountDigits)` in `src/features/customer/cart/exactMoneyJson.js`, quoting only integer money keys and using `BigInt` only for formatting
- [X] T015 [P] Implement `mapAvailabilityReason`, `mapVoucherReason`, and `mapApiError` Vietnamese messages in `src/features/customer/cart/cartReasons.js`
- [X] T016 [P] Implement `toCartView`, `toCartItemView`, and `toVoucherView` in `src/features/customer/cart/cartMappers.js`, mapping `variants[].id` as `variantId` and preserving all supplied money strings
- [X] T017 [P] Implement safe return-URL intent helpers in `src/features/customer/cart/cartIntent.js` and quantity bound helpers for whole numbers 1–999 in `src/features/customer/cart/cartValidation.js`
- [X] T018 Implement all exports from `contracts/frontend-module.md` in `src/features/customer/cart/cartApi.js` using `expectedStatus`, encoded IDs, `signal`, and raw text only for exact-money responses
- [X] T019 Implement the cart query key `['cart', user.id, generation]`, `staleTime: 0`, `retry: false`, auth gating, mutation scope `cart:${user.id}:${generation}`, and shared settle routine that refetches the cart and invalidates the wallet prefix in `src/features/customer/cart/useCart.js`
- [X] T020 [P] Implement `useCartCount()` subscribing to the shared cart cache and initializing the authoritative `totalItemCount` in `src/features/customer/cart/useCartCount.js`
- [X] T021 [P] Implement `useVoucherWallet()` with `useInfiniteQuery`, key `['cart', 'voucherWallet', user.id, generation, 20]`, `size: 20`, and `retry: false` in `src/features/customer/cart/useVoucherWallet.js`
- [X] T022 Wire `useCartCount()` into `src/App.jsx`, forward `cartCount` through `src/components/CustomerLayout.jsx`, and render the optional presentational badge in `src/components/Header.jsx` and `src/components/Header.css`
- [X] T023 Run `npm test` from `package.json` and fix foundational pure-helper failures in `tests/`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - View my cart (Priority: P1) MVP

**Goal**: Replace mock rows with the signed-in shopper's authoritative cart while preserving the existing design.

**Independent Test**: Sign in, arrange known items in the cart, open `/cart`, and verify every row and total matches the authoritative response; empty the cart and verify the friendly empty state and shopping link.

### Tests for User Story 1

> **NOTE: Write these tests FIRST; ensure they FAIL before implementation.**

- [X] T024 [P] [US1] Create `tests/components/CartPage.test.jsx` with mocked cart/wallet responses for authoritative rows, totals, unavailability reason, and update dispatch
- [X] T025 [P] [US1] Add node:test cases for authoritative cart totals, item mapping, and same-product variant filtering in `tests/cartMappers.test.js`

### Implementation for User Story 1

- [X] T026 [US1] Remove mock state and local financial arithmetic from `src/features/customer/cart/CartPage.jsx`, replacing them with `useCart()` and loading, empty, error-with-retry, and reconciled states
- [X] T027 [P] [US1] Render mapped image, name, options, unit price, quantity, subtotal, availability reason, and exact money in `src/features/customer/cart/CartItem.jsx` and `src/features/customer/cart/CartItem.css`
- [X] T028 [P] [US1] Render authoritative rows, item count, select-all toolbar, and busy states in `src/features/customer/cart/CartItems.jsx` and `src/features/customer/cart/CartItems.css`
- [X] T029 [P] [US1] Render supplied subtotal, discount, final total, and a documented TODO placeholder shipping note in `src/features/customer/cart/CartSummary.jsx` and `src/features/customer/cart/CartSummary.css`
- [X] T030 [P] [US1] Render info and error messages through `src/features/customer/cart/CartNotice.jsx` and `src/features/customer/cart/CartNotice.css`
- [X] T031 [P] [US1] Preserve the existing page layout and add loading, empty, and error styles in `src/features/customer/cart/CartPage.css`

**Checkpoint**: User Story 1 is fully functional and independently testable.

---

## Phase 4: User Story 2 - Sign-in required for cart access and add-to-cart (Priority: P1)

**Goal**: Send visitors to sign-in and return them to the interrupted destination, including after session expiry.

**Independent Test**: As a visitor, open `/cart` and attempt an add from product detail; verify both redirect and return. Then expire the session during a cart action and verify sign-in with no stale private data.

### Tests for User Story 2

> **NOTE: Write these tests FIRST; ensure they FAIL before implementation.**

- [X] T032 [P] [US2] Create `tests/components/CartAccess.test.jsx` verifying guest redirect without cart requests using mocked cart API responses

### Implementation for User Story 2

- [X] T033 [US2] Wrap `/cart` with `ProtectedRoute` and preserve the intended return destination in `src/App.jsx`
- [X] T034 [US2] Clear private cart cache entries and navigate to sign-in with `state.from` on session expiry in `src/features/customer/auth/AuthProvider.jsx`
- [X] T035 [US2] Ensure no guest-only badge or previous shopper data renders after redirect in `src/features/customer/cart/CartPage.jsx`
- [X] T036 [US2] Verify and update the guest cart, guest add, and session-expiry scenarios in `specs/003-cart-api-integration/quickstart.md`

**Checkpoint**: User Stories 1 and 2 are independently functional.

---

## Phase 5: User Story 3 - Add a variant from product detail (Priority: P1)

**Goal**: Add the chosen variant and quantity, merge duplicate variants authoritatively, and refresh the header count.

**Independent Test**: Add a chosen variant twice from product detail; verify one row with the combined quantity and a header badge equal to `totalItemCount`.

### Tests for User Story 3

> **NOTE: Write these tests FIRST; ensure they FAIL before implementation.**

- [X] T037 [P] [US3] Create `tests/components/ProductHeroAddToCart.test.jsx` with mocked `POST /api/me/cart/items` responses, return-intent restoration, and guest add intent
- [X] T038 [P] [US3] Add node:test cases for building and parsing safe add-intent URLs in `tests/cartIntent.test.js`

### Implementation for User Story 3

- [X] T039 [P] [US3] Expose product variants with `variants[].id` mapped to `variantId` from `src/features/customer/product-detail/productDetailApi.js`
- [X] T040 [US3] Implement the `addItem` mutation in `src/features/customer/cart/useCart.js` with shared scope, pending guard, Vietnamese error notice, and authoritative settle
- [X] T041 [US3] Wire the add button to `addItem`, send `productVariantId` and quantity, and disable rapid repeat clicks in `src/features/customer/product-detail/ProductHero.jsx`
- [X] T042 [US3] Redirect unauthenticated add attempts to sign-in with a safe return path plus `add`, `variant`, and `quantity` intent in `src/features/customer/product-detail/ProductHero.jsx`
- [X] T043 [US3] Restore the chosen variant and quantity from return URL intent after sign-in without auto-submitting in `src/features/customer/product-detail/ProductHero.jsx`

**Checkpoint**: User Story 3 is independently functional and does not break US1/US2.

---

## Phase 6: User Story 4 - Change quantity (Priority: P2)

**Goal**: Change quantity within 1–999 and keep last confirmed values on rejection or failure.

**Independent Test**: Change to a valid value, then request more than stock; verify the message and unchanged quantity/totals, plus boundaries 1 and 999.

### Tests for User Story 4

> **NOTE: Write these tests FIRST; ensure they FAIL before implementation.**

- [X] T044 [P] [US4] Create `tests/components/CartItemQuantity.test.jsx` with mocked cart data for quantity dispatch and lower-bound disabling
- [X] T045 [P] [US4] Add node:test cases rejecting 0, negative, fractional, and values above 999 in `tests/cartValidation.test.js`

### Implementation for User Story 4

- [X] T046 [US4] Implement the `updateQuantity` mutation in `src/features/customer/cart/useCart.js` with shared scope, `retry: false`, no optimistic writes, and authoritative settle
- [X] T047 [US4] Wire the stepper/input to `updateQuantity`, disable decrement at 1 and increment at 999, and preserve confirmed values on failure in `src/features/customer/cart/CartItem.jsx`
- [X] T048 [US4] Show Vietnamese stock, validation, and retry messages through `src/features/customer/cart/CartPage.jsx` using `src/features/customer/cart/CartNotice.jsx`

**Checkpoint**: User Story 4 is independently functional.

---

## Phase 7: User Story 5 - Switch a product variant (Priority: P2)

**Goal**: Switch an item to another variant of the same product and merge authoritatively when it already exists.

**Independent Test**: Put two variants of one product in the cart, switch one to the other, and verify a single merged row with authoritative totals.

### Tests for User Story 5

> **NOTE: Write these tests FIRST; ensure they FAIL before implementation.**

- [X] T049 [P] [US5] Create `tests/components/CartItemVariant.test.jsx` with mocked product-variant data for variant loading and authoritative variant-id dispatch
- [X] T050 [P] [US5] Add node:test cases for same-product variant filtering in `tests/cartMappers.test.js`

### Implementation for User Story 5

- [X] T051 [US5] Implement the `changeVariant` mutation in `src/features/customer/cart/useCart.js` with shared scope, no optimistic writes, and authoritative settle
- [X] T052 [P] [US5] Build the variant picker from `getProductVariants` in `src/features/customer/product-detail/productDetailApi.js` with same-product-only options in `src/features/customer/cart/VariantPicker.jsx` and `src/features/customer/cart/VariantPicker.css`
- [X] T053 [US5] Integrate the picker with `changeVariant` in `src/features/customer/cart/CartItem.jsx`, showing merged rows and rejected-switch messages without changing confirmed values

**Checkpoint**: User Story 5 is independently functional.

---

## Phase 8: User Story 6 - Select items and understand unavailable items (Priority: P2)

**Goal**: Select or deselect purchasable rows and make unavailable rows visibly non-selectable and excluded from totals.

**Independent Test**: With selected, unselected, out-of-stock, and unavailable rows, toggle single/all controls and verify unavailable rows stay unselected and out of every total.

### Tests for User Story 6

> **NOTE: Write these tests FIRST; ensure they FAIL before implementation.**

- [X] T054 [P] [US6] Create `tests/components/CartSelection.test.jsx` with mocked cart data for row and select-all selection dispatch
- [X] T055 [P] [US6] Add node:test cases for availability reason mapping in `tests/cartMappers.test.js`

### Implementation for User Story 6

- [X] T056 [US6] Implement `selectItem` and `selectAll` mutations in `src/features/customer/cart/useCart.js` with shared scope and authoritative settle
- [X] T057 [US6] Disable selection and render mapped unavailability text for non-purchasable rows in `src/features/customer/cart/CartItem.jsx`
- [X] T058 [US6] Wire select-all and deselect-all controls with busy state in `src/features/customer/cart/CartItems.jsx`

**Checkpoint**: User Story 6 is independently functional.

---

## Phase 9: User Story 7 - Remove items (Priority: P2)

**Goal**: Remove one row or the selected rows and settle on authoritative count and totals.

**Independent Test**: Remove one item, then remove selected items, checking rows, count, and totals against the authoritative cart each time.

### Tests for User Story 7

> **NOTE: Write these tests FIRST; ensure they FAIL before implementation.**

- [X] T059 [P] [US7] Create `tests/components/CartRemove.test.jsx` with mocked cart data for single and selected-item removal dispatch
- [X] T060 [P] [US7] Add node:test cases for treating `404` removal as already removed while surfacing other errors in `tests/cartApi.test.js`

### Implementation for User Story 7

- [X] T061 [US7] Implement `removeItem` and `removeSelected` mutations in `src/features/customer/cart/useCart.js`, snapshotting selected IDs, deleting sequentially, and refetching after settle
- [X] T062 [US7] Wire single-row removal and busy state in `src/features/customer/cart/CartItem.jsx`
- [X] T063 [US7] Wire remove-selected with disabled state when no items are selected in `src/features/customer/cart/CartItems.jsx`

**Checkpoint**: User Story 7 is independently functional.

---

## Phase 10: User Story 8 - Apply, replace and remove a voucher (Priority: P2)

**Goal**: Apply one voucher at a time, show inapplicable reasons, remove it, and explain authoritative clearing.

**Independent Test**: With applicable and inapplicable vouchers, apply one, verify discount/final total, remove it, then change selection so it clears and verify the reason and updated totals.

### Tests for User Story 8

> **NOTE: Write these tests FIRST; ensure they FAIL before implementation.**

- [X] T064 [P] [US8] Create `tests/components/VoucherPicker.test.jsx` with mocked wallet responses for applicability, apply, and remove actions
- [X] T065 [P] [US8] Add node:test cases for voucher applicability and clearing reason mapping in `tests/cartMappers.test.js`

### Implementation for User Story 8

- [X] T066 [US8] Implement apply and remove voucher mutations plus `voucherSelectionClearedReason` state in `src/features/customer/cart/useCart.js`
- [X] T067 [US8] Wire infinite wallet paging, applicability status, inapplicable reasons, apply, and remove actions in `src/features/customer/cart/VoucherPicker.jsx` and `src/features/customer/cart/VoucherPicker.css`
- [X] T068 [US8] Render applied voucher, discount, final total, and clearing reason in `src/features/customer/cart/CartSummary.jsx` using `src/features/customer/cart/CartNotice.jsx`

**Checkpoint**: All user stories are independently functional.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Validate all quality gates, edge cases, and scope boundaries.

- [X] T069 [P] Run `npm test` from `package.json` and fix all pure-helper and component-test failures in `tests/`
- [X] T070 [P] Run `npm run lint` from `package.json` and fix all warnings in `src/` and `tests/`
- [X] T071 [P] Run `npm run build` from `package.json` and fix all build errors in `src/`
- [X] T072 [P] Verify one CSS file per component and no `console.log` or unused imports in `src/features/customer/cart/`
- [X] T073 [P] Confirm no checkout or order placement call exists and the CTA remains visual-only in `src/features/customer/cart/CartSummary.jsx`
- [X] T074 [P] Verify no direct `fetch`, no new runtime dependency, no new environment variable, and all requests pass through `src/api/client.js` from `src/features/customer/cart/`, `package.json`, and `vitest.config.js`
- [ ] T075 Complete and record the twelve manual validation scenarios in `specs/003-cart-api-integration/quickstart.md`
- [X] T076 Review the final diff for lead-reviewed changes and no secrets in `src/App.jsx`, `src/api/client.js`, `src/features/customer/auth/AuthProvider.jsx`, and `src/components/Header.jsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 - BLOCKS all user stories
- **User Stories (Phases 3-10)**: All depend on Phase 2 completion; proceed in priority order US1 → US2 → US3 → US4 → US5 → US6 → US7 → US8
- **Polish (Phase 11)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Phase 2; no dependencies on other stories
- **User Story 2 (P1)**: Starts after Phase 2; integrates with US1 page and US3 add intent but is independently testable
- **User Story 3 (P1)**: Starts after Phase 2 and US2 redirect behavior; depends on US1 cart rendering for visual verification
- **User Story 4 (P2)**: Starts after Phase 2; depends on US1 row rendering
- **User Story 5 (P2)**: Starts after Phase 2; depends on US1 row rendering and T039 variant exposure
- **User Story 6 (P2)**: Starts after Phase 2; depends on US1 row rendering
- **User Story 7 (P2)**: Starts after Phase 2; depends on US1 row rendering
- **User Story 8 (P2)**: Starts after Phase 2; depends on US1 summary rendering and US6 selection behavior for clearing verification

### Within Each User Story

- Component tests with mocked API responses are written first and fail before implementation
- Pure helper tests are written before their helpers where applicable
- Mappers and helpers precede hooks
- Hooks precede component wiring
- Core implementation precedes manual verification
- Story checkpoint must pass before moving to the next priority

### Parallel Opportunities

- T005, T006, T007, T008, T010, T011, T012, and T013 can run in parallel after T004
- T014, T015, T016, T017, T020, and T021 can run in parallel after T013
- Within each story, component tests, pure tests, and independent component/CSS tasks marked [P] can run in parallel
- Different stories can proceed in parallel if separate developers own them, but US3 depends on US2 redirect behavior and US8 depends on US6 selection behavior

---

## Parallel Example: User Story 1

```bash
Task: "Create tests/components/CartPage.test.jsx with mocked GET /api/me/cart responses for authoritative rows, unselected totals, empty cart, loading, error, and retry"
Task: "Add node:test cases for empty, unselected, discounted, and reconciled cart fixtures in tests/cartMappers.test.js"
Task: "Render mapped image, name, options, unit price, quantity, subtotal, availability reason, and exact money in src/features/customer/cart/CartItem.jsx and src/features/customer/cart/CartItem.css"
Task: "Render authoritative rows, item count, select-all toolbar, and busy states in src/features/customer/cart/CartItems.jsx and src/features/customer/cart/CartItems.css"
Task: "Render supplied subtotal, discount, final total, and a documented TODO placeholder shipping note in src/features/customer/cart/CartSummary.jsx and src/features/customer/cart/CartSummary.css"
Task: "Render info and error messages through src/features/customer/cart/CartNotice.jsx and src/features/customer/cart/CartNotice.css"
```

## Parallel Example: User Story 2

```bash
Task: "Create tests/components/CartAccess.test.jsx with mocked 401 cart/add responses for guest redirect, post-login return, and session-expiry return without stale data"
Task: "Wrap /cart with ProtectedRoute and preserve the intended return destination in src/App.jsx"
Task: "Verify and update the guest cart, guest add, and session-expiry scenarios in specs/003-cart-api-integration/quickstart.md"
```

## Parallel Example: User Story 3

```bash
Task: "Create tests/components/ProductHeroAddToCart.test.jsx with mocked product-detail and POST /api/me/cart/items responses for duplicate merge, combined quantity, header count, stock rejection, rapid clicks, and guest add intent"
Task: "Add node:test cases for building and parsing safe add-intent URLs in tests/cartIntent.test.js"
Task: "Expose product variants with variants[].id mapped to variantId from src/features/customer/product-detail/productDetailApi.js"
```

## Parallel Example: User Story 4

```bash
Task: "Create tests/components/CartItemQuantity.test.jsx with mocked PUT /api/me/cart/items/{itemId}/quantity success, insufficient-stock, network-error, and out-of-order responses"
Task: "Add node:test cases rejecting 0, negative, fractional, and values above 999 in tests/cartValidation.test.js"
Task: "Show Vietnamese stock, validation, and retry messages through src/features/customer/cart/CartPage.jsx using src/features/customer/cart/CartNotice.jsx"
```

## Parallel Example: User Story 5

```bash
Task: "Create tests/components/CartItemVariant.test.jsx with mocked product-variant and PUT /api/me/cart/items/{itemId}/variant responses for merge, cross-product rejection, stock rejection, and failed-switch retention"
Task: "Add node:test cases for same-product variant filtering in tests/cartMappers.test.js"
Task: "Build the variant picker from getProductVariants in src/features/customer/product-detail/productDetailApi.js with same-product-only options in src/features/customer/cart/VariantPicker.jsx and src/features/customer/cart/VariantPicker.css"
```

## Parallel Example: User Story 6

```bash
Task: "Create tests/components/CartSelection.test.jsx with mocked PUT /api/me/cart/items/{itemId}/selection and PUT /api/me/cart/selection responses for purchasable, unavailable, select-all, and deselect-all behavior"
Task: "Add node:test cases for availability reason mapping in tests/cartMappers.test.js"
Task: "Wire select-all and deselect-all controls with busy state in src/features/customer/cart/CartItems.jsx"
```

## Parallel Example: User Story 7

```bash
Task: "Create tests/components/CartRemove.test.jsx with mocked DELETE /api/me/cart/items/{itemId} responses for single remove, bulk snapshot, 404 already-removed, failed remove, and disabled bulk action"
Task: "Add node:test cases for treating 404 removal as already removed while surfacing other errors in tests/cartApi.test.js"
Task: "Wire single-row removal and busy state in src/features/customer/cart/CartItem.jsx"
Task: "Wire remove-selected with disabled state when no items are selected in src/features/customer/cart/CartItems.jsx"
```

## Parallel Example: User Story 8

```bash
Task: "Create tests/components/VoucherPicker.test.jsx with mocked GET /api/me/vouchers, PUT /api/me/cart/voucher, and DELETE /api/me/cart/voucher responses for applicability reasons, apply, replace, remove, and cleared-voucher totals"
Task: "Add node:test cases for voucher applicability and clearing reason mapping in tests/cartMappers.test.js"
Task: "Wire infinite wallet paging, applicability status, inapplicable reasons, apply, and remove actions in src/features/customer/cart/VoucherPicker.jsx and src/features/customer/cart/VoucherPicker.css"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup, including Vitest component-test tooling and mocked API fixtures
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. Add the minimal `/cart` guard from T033 if the demo starts unauthenticated
5. **STOP and VALIDATE**: Run US1 component tests and test US1 independently
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Run mocked component tests → Test independently → Deploy/Demo (MVP!)
3. Add User Stories 2 and 3 → Run mocked component tests → Test independently → Deploy/Demo
4. Add User Stories 4-7 → Run mocked component tests → Test independently → Deploy/Demo
5. Add User Story 8 → Run mocked component tests → Test independently → Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Stories 1 and 2
   - Developer B: User Stories 3, 4, and 5
   - Developer C: User Stories 6, 7, and 8
3. Stories complete and integrate independently at their checkpoints

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps a task to a specific user story for traceability
- Each user story has a component test with mocked API responses and can be independently completed and tested
- Verify tests fail before implementing
- Do not commit unless explicitly asked
- Stop at each checkpoint to validate the story independently
- Avoid vague tasks, same-file parallel conflicts, and cross-story dependencies that break independence
