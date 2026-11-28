---
description: "Task list for product detail API integration"
---

# Tasks: Product Detail API Integration

**Input**: Design documents from `/specs/002-product-detail-api/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: `node:test` unit tests for exported pure mappers are explicitly requested by the user and required by FR-009/SC-005. Manual UI scenarios are in `quickstart.md`. There is no `npm test` script; use `node --test tests/productDetailApi.test.js`.

**Organization**: Foundational API/hook tasks come first to satisfy the required execution order; component wiring and UI states are grouped by user story.

**Authority note**: Where older artifacts conflict with `spec.md`/`plan.md`, `spec.md` and `plan.md` win: empty `technicalSpecifications` uses an empty state (not mock specs), and `similarProducts` are rendered in a new section using the existing card design.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label, required only in user-story phases
- Include exact file paths in descriptions

## Path Conventions

- Single project: `src/` and `tests/` at repository root
- Source changes are limited to `src/features/customer/product-detail/` (plus thin `src/pages/Customer/ProductPage.jsx` only if needed) and `tests/productDetailApi.test.js`
- Do not modify `src/api/`, `src/components/`, `src/hooks/`, or component CSS other than minimal state styles in `src/features/customer/product-detail/ProductDetailPage.css`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the existing project already provides everything needed; no initialization or dependencies are added.

- [X] T001 [P] Confirm `src/api/client.js` already exports `api.get(path, params, options)` with `auth: false` and `signal` support, and that `BASE_URL` reads `import.meta.env.VITE_API_URL`; do not modify `src/api/client.js`.
- [X] T002 [P] Confirm `src/App.jsx` already maps `/products/:id` to `src/pages/Customer/ProductPage.jsx` and that the page is a thin wrapper; plan for `ProductDetailPage.jsx` to read the ID via `useParams()` instead of changing `src/pages/Customer/ProductPage.jsx`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build mapper functions, their tests, the API helper and the hook. No user story work can begin until this phase is complete.

**⚠️ CRITICAL**: Follow the required order: tests → mappers → endpoint functions → hook.

### Tests for pure mappers (write FIRST; they must fail before T004)

- [X] T003 [P] Create `tests/productDetailApi.test.js` with `node:test` and `node:assert/strict`, covering null price (`displayPrice: null` / missing `sellingPrice`), empty `technicalSpecifications`, zero reviews with `averageRating: null`, out-of-stock (`status: OUT_OF_STOCK` or `INVENTORY_UNAVAILABLE`, or `availableQuantity: 0`), and missing `options` (empty object or absent). Quote these constraints in the test fixtures: "`variants` | `VariantSummary[]` | Yes | `minItems: 1`", "`options` ... keys are not guaranteed", "`price` uses `Number(amount)` only for display formatting; the raw amount may exceed safe integer precision, so no arithmetic is performed on it", "`averageRating` | number 1..5 or `null` | Yes | Two decimals; null when no reviews", "A product is purchasable only when the selected variant has `status === \"IN_STOCK\"` and `availableQuantity > 0`", "`items[].rating` | integer 1..5", "`items[].images` ... Max 10; null URLs filtered out", and "`price` is formatted with `Intl.NumberFormat(\"vi-VN\")` + `₫`; null `displayPrice` yields \"Liên hệ\"".

### Pure mappers

- [X] T004 Create `src/features/customer/product-detail/productDetailApi.js` with exported pure mappers only (no endpoint calls yet): `toProductHeroView`, `toHighlightsView`, `toSpecificationsView`, `toReviewsView`, `toSimilarProductView`, `toSimilarProductViews`, and `toProductDetailViewModel`. Honor these verbatim constraints from `data-model.md`: "`variants` ... `minItems: 1`", "`sku` | string | Yes | `minLength: 1`", "`options` ... keys are not guaranteed", "`sellingPrice` ... Whole VND, possibly beyond JS safe integer", "`technicalSpecifications` ... May be empty", "`items[].comment` ... Max 2000 chars", "`items[].images` ... null URLs filtered out", "`averageRating` ... Two decimals; null when no reviews", "`items` ... Max 20", "`items[].displayPrice` ... Paired with `representativeVariantId`", "`initials` derives from the first characters of up to two words in `displayName`; \"Former customer\" is allowed", "`time` formats `createdAt` relative to now (`x giờ trước`, `x ngày trước`) with an absolute-date fallback", "`title` uses the first sentence/line of `comment`; if `comment` is null, uses a localized placeholder — **TODO: no review title field**", "`originalPrice` is taken from `src/mocks/product-detail.js` matched by storage (fallback to the corresponding mock index) — **TODO: backend has no original/list price field**", and "`color` reads known keys (`color`, `Color`, `colour`, `Colour`) from `variant.options`; falls back to the mock value with a TODO". Empty `technicalSpecifications` MUST return `[]` for an explicit empty state, never mock specs; `null averageRating` MUST produce "Chưa có đánh giá", never `0`/`NaN`; out-of-stock MUST produce `inStock: false`; missing options MUST still produce at least one safe option. Every mock fallback (`originalPrice`, `highlights`, `color` fallback, derived review `title`, `summary.purchased`, `summary.withPhotos`, star distribution) MUST carry a `TODO` comment and MUST NOT be represented as an API field.

### API helper

- [X] T005 Add endpoint functions to `src/features/customer/product-detail/productDetailApi.js`: `getProductDetail(id, options)`, `getProductReviews(id, options)`, `getRatingSummary(id, options)`, `getSimilarProducts(id, options)` and `getProductDetailData(id, options)`. Use `api.get` from `src/api/client.js` with `{ auth: false, signal }`, `encodeURIComponent(id)`, reviews params `page: 0, size: 20, sort: "createdAt,desc"`, similar params `limit: 10`, and `Promise.allSettled` with product rejection rethrown and supplementary rejections returned as `sectionErrors: { reviews, rating, similar }`. No direct `fetch`, no hardcoded URLs, and exactly one call per endpoint per product ID load.

### Hook

- [X] T006 Create `src/features/customer/product-detail/useProductDetail.js` returning `{ data, loading, notFound, error, sectionErrors, retry }`. Honor these contract guarantees verbatim: "`loading` is `true` immediately after mount, ID change, or `retry()`", "`data` is `null` while loading or on failure; no stale product is shown for a new ID", "`notFound` is `true` only for product `404`; `error` is set for all other product failures", "`sectionErrors` only reports supplementary failures and never replaces `data`", "`AbortController` cancels in-flight requests on cleanup; `AbortError` is ignored", and "`retry()` re-runs the effect with a new nonce; no automatic retry loop is introduced". `retry()` must refresh signed URLs; use plain `useState`/`useEffect`, not React Query.

**Checkpoint**: Foundation ready — mappers pass their node:test tests; user story implementation can now begin.

---

## Phase 3: User Story 1 - View a real product detail page (Priority: P1) 🎯 MVP

**Goal**: Render API-backed product data, mapped component props, an explicit empty state for missing specs, a no-rating state for `null averageRating`, and a similar-products section using the existing card design.

**Independent Test**: Set `VITE_API_URL`, open `/products/<valid-uuid>`, confirm one call to each of the four endpoints with `auth: false`, and confirm API values render in the existing components plus the similar-products section without redesigning existing sections.

### Tests for User Story 1

- [X] T007 [P] [US1] Extend `tests/productDetailApi.test.js` with a success-path mapper test asserting the full `ProductDetailViewModel` shape from `contracts/frontend-module.md`: `product`, `highlights`, `specifications`, `reviews`, `summary`, `distribution`, `similarProducts`, `reviewCount`, `averageRating`, `inStock`, including ProductCard-compatible similar items (`id`, `name`, `image`, `price`, `oldPrice: null`, `status`, `colors: []`, `colorName: ""`, `specs: [category.name]`, `variantId`).

### Implementation for User Story 1

- [X] T008 [P] [US1] Refactor `src/features/customer/product-detail/ProductHighlights.jsx` to accept a `highlights` prop from the mapped view model and remove its direct mock import; keep the icon map, JSX, and CSS unchanged, leaving the mock source and TODO in `productDetailApi.js`.
- [X] T009 [P] [US1] Refactor `src/features/customer/product-detail/ProductSpecifications.jsx` to accept a `specifications` prop, render an explicit empty message when the array is empty, and remove its direct mock import; preserve `<details>` markup and CSS, and never fall back to mock specs.
- [X] T010 [P] [US1] Refactor `src/features/customer/product-detail/ProductReviews.jsx` to accept `reviews`, `summary`, `distribution` and optional `sectionErrors`; render "Chưa có đánh giá" when `summary.score` is the no-rating value, never `0`/`NaN`; keep the mock distribution source and TODO in `productDetailApi.js`; omit null review image URLs and use `rating` for star labels.
- [X] T011 [P] [US1] Create `src/features/customer/product-detail/SimilarProducts.jsx` to render mapped `similarProducts` with the existing product-card markup/classes and no new shared component; handle null images and broken image loads with alt/placeholder text.
- [X] T012 [US1] Wire `src/features/customer/product-detail/ProductDetailPage.jsx` to call `useParams()` and `useProductDetail(id)`, passing mapped slices to `ProductHero`, `ProductHighlights`, `ProductSpecifications`, `ProductReviews` and `SimilarProducts`; preserve breadcrumb, section order and visual design.
- [X] T013 [US1] Manually verify scenario A plus empty-specifications, no-rating and signed-URL degradation behavior using `specs/002-product-detail-api/quickstart.md`, and record observed network calls and screenshots in the PR description.

**Checkpoint**: User Story 1 is fully functional and independently testable.

---

## Phase 4: User Story 2 - Loading and missing product (Priority: P1)

**Goal**: Show a clear loading state and a product-level 404 state instead of a blank or global-not-found page.

**Independent Test**: Delay/stub the product request to observe `role="status"`, then return 404 for an unknown UUID to observe `role="alert"` with a link back to `/products`.

- [X] T014 [US2] Add loading markup to `src/features/customer/product-detail/ProductDetailPage.jsx` using `role="status"` and "Đang tải sản phẩm…", suppress all product sections while `loading` is true, and add only minimal `.product-detail__state` styles to `src/features/customer/product-detail/ProductDetailPage.css`.
- [X] T015 [US2] Add 404 markup to `src/features/customer/product-detail/ProductDetailPage.jsx` using `role="alert"`, a not-found message and a link to `/products`, with minimal shared state styles in `src/features/customer/product-detail/ProductDetailPage.css`; do not navigate to the global `NotFoundPage`.
- [X] T016 [US2] Manually verify scenarios B and C in `specs/002-product-detail-api/quickstart.md` and record loading and not-found screenshots in the PR description.

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Out-of-stock and failures (Priority: P2)

**Goal**: Prevent purchase when inventory is zero and provide recoverable product/section error states.

**Independent Test**: Stub a product with zero inventory, then a 500/network failure, and verify the disabled controls, error message, and retry affordance.

### Implementation for User Story 3

- [X] T017 [P] [US3] Update `src/features/customer/product-detail/ProductHero.jsx` to accept `inStock`, show "Hết hàng", and disable the stepper, "MUA NGAY" and "Thêm vào giỏ hàng" when false, using the data-model rule verbatim: "A product is purchasable only when the selected variant has `status === \"IN_STOCK\"` and `availableQuantity > 0`"; preserve the existing hero markup and CSS.
- [X] T018 [US3] Add generic product-error markup to `src/features/customer/product-detail/ProductDetailPage.jsx` with `role="alert"`, no stale product content, and a "Thử lại" button calling `retry()`, plus minimal state styles in `src/features/customer/product-detail/ProductDetailPage.css`.
- [X] T019 [P] [US3] Add inline section-error messages to `src/features/customer/product-detail/ProductReviews.jsx` and `src/features/customer/product-detail/SimilarProducts.jsx` driven by `sectionErrors.reviews`, `sectionErrors.rating` and `sectionErrors.similar`, keeping the product visible as required by `contracts/frontend-module.md`.
- [X] T020 [US3] Manually verify scenarios D, E, F and G in `specs/002-product-detail-api/quickstart.md`, including retry refresh of signed URLs, and record out-of-stock, error and section-error screenshots in the PR description.

**Checkpoint**: All user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Audit mock annotations, run unit tests, and execute the final quality gates.

- [X] T021 [P] Audit `src/features/customer/product-detail/productDetailApi.js`, `src/features/customer/product-detail/ProductReviews.jsx` and `src/features/customer/product-detail/ProductHighlights.jsx` to confirm every mock fallback — `originalPrice`, `highlights`, `color` fallback, derived review `title`, `summary.purchased`, `summary.withPhotos`, star distribution — is labeled as a mock with a `TODO` and no mock value is represented as a real API call; confirm no changes were made to `src/api/`, `src/components/` or `src/hooks/`.
- [X] T022 Run `node --test tests/productDetailApi.test.js` from the repository root and fix any failing mapper tests before continuing.
- [X] T023 Run `npm run lint` and `npm run build` from the repository root and fix all warnings/errors without disabling ESLint rules.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; verification only
- **Foundational (Phase 2)**: Depends on Setup; BLOCKS all user stories
  - T003 tests must be written before T004 mappers
  - T004 mappers before T005 endpoint functions
  - T005 API helper before T006 hook
- **User Stories (Phases 3–5)**: Depend on Foundational completion
  - US1 (P1) before US2/US3 for MVP delivery
  - US2 (P1) and US3 (P2) can proceed in parallel after US1 if staffed, but US3 depends on US1's `ProductDetailPage` wiring
- **Polish (Phase 6)**: Depends on all user stories being complete; T023 is the final task

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2; no dependency on other stories
- **User Story 2 (P1)**: Can start after Phase 2; integrates with US1 page wiring, independently testable via delayed/404 responses
- **User Story 3 (P2)**: Can start after Phase 2; integrates with US1 page wiring and US2 state styles, independently testable via zero-stock/error stubs

### Within Each User Story

- Tests (if included) are written before implementation
- API mappers → helper → hook → component props → page wiring → UI states
- Each story ends with an independent manual verification task

### Parallel Opportunities

- T001 and T002 can run in parallel
- T003 can be written in parallel with T001/T002 once the test file path is known
- T008, T009, T010 and T011 can run in parallel (different files)
- T017 and T019 can run in parallel with each other after US1 wiring
- T021 can run in parallel with T022 once all component/API edits are complete

---

## Parallel Example: User Story 1

```bash
# Launch mapper shape test and independent component refactors together:
Task: "T007 Extend tests/productDetailApi.test.js with success-path view-model assertions"
Task: "T008 Refactor ProductHighlights.jsx to accept highlights prop"
Task: "T009 Refactor ProductSpecifications.jsx to accept specifications prop and empty state"
Task: "T010 Refactor ProductReviews.jsx to accept reviews/summary/distribution/sectionErrors"
Task: "T011 Create SimilarProducts.jsx using existing card design"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Run T007/T022 mapper tests, verify scenario A, empty specs, no rating and signed-URL degradation
5. Demo the API-backed product page with similar-products section

### Incremental Delivery

1. Setup + Foundational → mappers, tests, API helper and hook ready
2. Add US1 → API-backed page + similar section → test independently → MVP
3. Add US2 → loading/404 → test independently
4. Add US3 → out-of-stock/errors/section errors → test independently
5. Polish → audit TODO mocks, run unit tests, lint/build

### Parallel Team Strategy

With multiple developers after Phase 2:

- Developer A: US1 component wiring and similar-products section
- Developer B: US2 loading/404 states (after US1 page wiring exists)
- Developer C: US3 out-of-stock and error states (after US1 page wiring exists)

---

## Notes

- [P] tasks involve different files and no incomplete-task dependencies
- [Story] labels map tasks to spec.md user stories for traceability
- Tests must fail before T004 and pass before T023
- Commit after each task or logical group
- Stop at each checkpoint to validate the story independently
- Do not add dependencies or modify shared folders; `tests/productDetailApi.test.js` is the only file outside the feature folder
