# Implementation Plan: Cart API Integration

**Branch**: `003-cart-api-integration` | **Date**: 2026-11-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-cart-api-integration/spec.md`

## Summary

Replace the mock cart state with the signed-in shopper's authoritative cart data from `docs/openapi.json`, preserving the existing cart design. Add a feature-owned API helper, exact-integer money parsing, React Query hooks keyed by user and session generation, serialized mutations that re-read the cart after every change, a header count badge, add-to-cart wiring from product detail, sign-in return handling, and voucher selection with applicability reasons. Checkout and order placement remain untouched.

## Technical Context

**Language/Version**: JavaScript ES modules, Node.js LTS 22+, React 19.2.8, Vite 8.3.4

**Primary Dependencies**: `@tanstack/react-query` 5.104.5, `react-router-dom` 7.18.4, `eslint` 10.10.0; no new runtime dependency

**Storage**: React Query in-memory cache keyed by `['cart', user.id, generation]` and `['cart', 'voucherWallet', user.id, generation, size]`; existing refresh-token storage in `localStorage`/`sessionStorage`; no new persistence or environment variable

**Testing**: `npm test` runs `node --test tests/*.test.js` for pure helpers and Vitest component tests with mocked API responses; `npm run lint`; `npm run build`; manual UI verification documented in the PR for visual regression

**Target Platform**: Modern browsers in the Vite default baseline (Chrome/Edge 111+, Firefox 114+, Safari 16.4+); customer storefront single-page app

**Project Type**: Frontend-only React SPA integrated with an existing JSON API

**Performance Goals**: Cart's first visible state within 2 seconds at p95 on a normal connection; all mutation results settle on authoritative data without client-side financial calculation

**Constraints**: All requests through `src/api/client.js` with base URL from `import.meta.env.VITE_API_URL`; no direct `fetch` in components; bearer auth with existing refresh-token rotation; 401/session expiry returns the shopper to the originating page; exact VND integers must not pass through `Number()` or arithmetic; existing visual design preserved; no checkout/order placement; new code belongs in `src/features/customer/cart/`; one CSS file per component; pages stay thin; Vitest, React Testing Library, `user-event`, `jest-dom`, and `jsdom` are dev-only test tooling with no new runtime dependency or environment variable

**Scale/Scope**: One cart per signed-in customer; quantity 1–999 per row; voucher wallet pages of 1–100 entries; eight user stories and the documented edge cases; no backend changes

**Unresolved clarifications**: None. Initial unknowns (OpenAPI path, exact-money preservation, bulk removal, variant identity, header count ownership, session-expiry navigation, mutation ordering, voucher pagination and reason mapping) were resolved in [research.md](research.md).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Result | Evidence |
|---|---|---|
| I. API Contract First | PASS | `docs/openapi.json` is used as the contract because `docs/api/openapi.json` does not exist. All cart and wallet requests go through `cartApi.js` → `src/api/client.js`; base URL remains `VITE_API_URL`. The opt-in raw-text option keeps error handling in the shared client. |
| II. Feature-Domain Structure | PASS | `cartApi.js`, hooks, mappers, reason dictionaries and cart UI live under `src/features/customer/cart/`. `src/pages/Customer/CartPage.jsx` remains a thin wrapper. Shared files only receive props or add generic options. |
| III. Quality Gates | PASS | Plan includes `node --test tests/*.test.js`, `npm run lint`, `npm run build`, and documented manual verification. No warnings, unused code, or `console.log` are accepted. |
| IV. Component and Naming Discipline | PASS | Components use `PascalCase.jsx` with matching CSS; hooks use `use*.js`; pure helpers use `camelCase.js`; pages end in `Page`. |
| V. Small, Reviewed Changes | PASS | Lead-reviewed changes are limited to a client parse option, route/prop plumbing, and session-expiry navigation; they must be small and announced. No new dependency or environment variable is introduced. |

## Project Structure

### Documentation (this feature)

```text
specs/003-cart-api-integration/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── cart-api.md
│   └── frontend-module.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── api/
│   └── client.js                     # opt-in responseType: 'text' for exact money
├── components/
│   ├── CustomerLayout.jsx            # receives cartCount prop only
│   ├── Header.jsx                    # presentational optional badge
│   └── Header.css                    # badge styles
├── features/
│   └── customer/
│       ├── auth/
│       │   └── AuthProvider.jsx      # session-expiry redirect with return path
│       ├── cart/
│       │   ├── cartApi.js
│       │   ├── cartIntent.js
│       │   ├── cartMappers.js
│       │   ├── cartReasons.js
│       │   ├── cartValidation.js
│       │   ├── exactMoneyJson.js
│       │   ├── useCart.js
│       │   ├── useCartCount.js
│       │   ├── useVoucherWallet.js
│       │   ├── CartPage.jsx
│       │   ├── CartPage.css
│       │   ├── CartItems.jsx
│       │   ├── CartItems.css
│       │   ├── CartItem.jsx
│       │   ├── CartItem.css
│       │   ├── CartSummary.jsx
│       │   ├── CartSummary.css
│       │   ├── VariantPicker.jsx
│       │   ├── VariantPicker.css
│       │   ├── VoucherPicker.jsx
│       │   ├── VoucherPicker.css
│       │   ├── CartNotice.jsx
│       │   └── CartNotice.css
│       └── product-detail/
│           ├── productDetailApi.js   # exposes variants for switch picker
│           └── ProductHero.jsx       # variantId + add-to-cart intent
├── pages/
│   └── Customer/
│       └── CartPage.jsx              # thin wrapper only
└── App.jsx                           # protect /cart, pass cartCount to CustomerLayout

tests/
├── setup.js                          # jest-dom matchers and cleanup
├── mocks/
│   ├── authFixtures.js
│   ├── cartApiMocks.js
│   ├── cartFixtures.js
│   └── renderWithProviders.jsx
├── components/
│   ├── CartPage.test.jsx
│   ├── CartAccess.test.jsx
│   ├── ProductHeroAddToCart.test.jsx
│   ├── CartItemQuantity.test.jsx
│   ├── CartItemVariant.test.jsx
│   ├── CartSelection.test.jsx
│   ├── CartRemove.test.jsx
│   └── VoucherPicker.test.jsx
├── cartApi.test.js
├── cartIntent.test.js
├── cartMappers.test.js
├── cartValidation.test.js
└── exactMoneyJson.test.js
vitest.config.js                      # jsdom environment and component-test setup
```

**Structure Decision**: Cart domain code stays under `src/features/customer/cart/`. `App.jsx` reads the count through the feature hook and passes it into `CustomerLayout`; `Header` only renders the supplied number. `ProtectedRoute` wraps `/cart`, and `AuthProvider` navigates to sign-in on session expiry with the current location as the return destination. Only dev-only test tooling is added; no new runtime dependency or environment variable is added.

## Complexity Tracking

No constitution violations; no complexity exceptions required.
