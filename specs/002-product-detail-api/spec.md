# Feature Specification: Product Detail API Integration

**Feature Branch**: `feature/search-and-browse`

**Created**: 2026-11-25

**Status**: Draft

**Input**: User description: "Frontend only, React + Vite. The product detail UI already exists in src/features/customer/product-detail/ with mock data; keep its visual design. Create productDetailApi.js and useProductDetail.js in that folder, using the shared client in src/api/client.js (auth: false) and following CONVENTIONS.md. The API contract is docs/api/openapi.json: use GET /api/products/{id}, /reviews, /rating-summary and /similar. Where an endpoint does not exist (original price, star distribution), keep the mock value and mark it with a TODO. Map API responses to the props the existing components expect. Cover loading, 404, out-of-stock and error states."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View a real product detail page (Priority: P1)

A shopper opens a product detail page for a specific product ID and sees the existing visual design populated with backend data: product information, price, images, highlights, specifications, reviews, rating summary and a similar-products section. Fields the backend does not expose continue to show the current mock values; fields with no backend value use an explicit empty state instead of fabricated data.

**Why this priority**: Replacing mock data is the core value; without it the page cannot be used in the real storefront.

**Independent Test**: Set `VITE_API_URL` to the backend, open the product route with a known product ID and confirm the page renders API values in the existing components, including the similar-products section, without redesigning existing sections.

**Acceptance Scenarios**:

1. **Given** a valid product ID and a reachable backend, **When** the page loads, **Then** each of the four endpoints is called exactly once with `auth: false`, and the responses are mapped into the existing components plus a similar-products section that uses the existing card design.
2. **Given** the backend omits a field that the plan marks as a mock fallback, **When** the page renders, **Then** that value comes from the existing mock and is marked with a TODO in the source.
3. **Given** `technicalSpecifications` is empty, **When** the page renders, **Then** the specifications area shows an explicit empty state instead of mock specifications.
4. **Given** `averageRating` is `null`, **When** the page renders, **Then** the reviews summary shows "Chưa có đánh giá" instead of `0` or `NaN`.
5. **Given** signed image URLs expire after at most five minutes, **When** the user retries or a cached URL is known to be stale, **Then** fresh URLs are fetched and failed image loads degrade to an alt/placeholder without breaking the layout.

### User Story 2 - Loading and missing product (Priority: P1)

A shopper sees a clear state while data is loading and when the requested product does not exist.

**Why this priority**: Prevents a blank/broken page and makes broken links understandable.

**Independent Test**: Delay/stub the product request, then return 404 for an unknown ID and observe the two states.

**Acceptance Scenarios**:

1. **Given** requests are pending, **When** the page is opened, **Then** a loading state is shown and no stale product is presented as current.
2. **Given** `GET /api/products/{id}` returns 404, **When** the response arrives, **Then** a not-found state is shown instead of the product sections.

### User Story 3 - Out-of-stock and failures (Priority: P2)

A shopper sees a non-purchasable state when inventory is zero and a recoverable error state when requests fail.

**Why this priority**: Protects users from attempting to buy unavailable products and makes transient failures recoverable.

**Independent Test**: Stub a product with zero inventory and then a 500/network failure, and verify the UI states and retry affordance.

**Acceptance Scenarios**:

1. **Given** a product with zero inventory, **When** the page renders, **Then** purchase controls are disabled or replaced by an out-of-stock message.
2. **Given** a non-404 API error or network failure, **When** the hook reports the error, **Then** an error state with a retry action is shown.

---

### Edge Cases

- Missing fields in API responses should fall back safely to the documented mock values, explicit empty states, or empty collections without crashing.
- Empty `technicalSpecifications` must render an empty state, never the mock specifications.
- A `null` `averageRating` must render a no-rating message; it must not be coerced to `0` or formatted as `NaN`.
- Signed image URLs must be treated as short-lived (at most five minutes): refreshes go through `retry()`, and broken images degrade gracefully.
- Concurrent requests should not overwrite newer data when the product ID changes or the page unmounts, and re-renders must not re-call endpoints; only a new product ID or explicit retry may trigger a new load.
- Reviews or similar products failing should not necessarily hide the product that loaded successfully.
- Aborted requests must not produce error states when the component unmounts.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The product detail feature MUST expose an API helper `productDetailApi.js` that calls `GET /api/products/{id}`, `GET /api/products/{id}/reviews`, `GET /api/products/{id}/rating-summary` and `GET /api/products/{id}/similar` through the shared client with `auth: false`.
- **FR-002**: The feature MUST expose `useProductDetail.js` that loads all four resources for a product ID and returns data, loading, error and not-found state plus a retry function.
- **FR-003**: API responses MUST be mapped to the prop shapes currently consumed by `ProductHero`, `ProductHighlights`, `ProductSpecifications` and `ProductReviews`, plus the card props used for the similar-products section.
- **FR-004**: Every mocked field listed in the plan MUST keep its existing mock value with an explicit TODO noting the missing backend contract: `originalPrice`, `highlights`, the `color` fallback when no color option is returned, the derived review `title`, `summary.purchased`, `summary.withPhotos` and the star distribution.
- **FR-005**: The visual design, CSS and component structure of the existing sections MUST be preserved; any new similar-products section MUST reuse the existing card design rather than introduce a new visual language.
- **FR-006**: The page MUST cover loading, 404, out-of-stock, empty-specifications, no-rating and generic error states.
- **FR-007**: All requests MUST use the shared client and MUST NOT hardcode URLs or call `fetch` directly.
- **FR-008**: The implementation MUST follow `docs/CONVENTIONS.md` naming, folder and code-style rules and pass `npm run lint` and `npm run build`.
- **FR-009**: Exported mapper functions in `productDetailApi.js` MUST have unit tests written with Node's built-in `node:test` runner; no new test dependency or component-test framework is introduced.
- **FR-010**: The page MUST render a similar-products section from `GET /api/products/{id}/similar` using the existing card design.
- **FR-011**: When `technicalSpecifications` is empty, the specifications area MUST render an explicit empty state instead of the mock specifications.
- **FR-012**: A `null` `averageRating` MUST render a no-rating message, and signed image URLs MUST be treated as short-lived: retries fetch fresh URLs and failed image loads degrade gracefully.

### Key Entities *(include if feature involves data)*

- **Product detail**: Product identity, name, SKU, color, inventory, images and purchasable options.
- **Review**: Author, timestamp, rating, title, body and optional photos.
- **Rating summary**: Average score, total review count and related counts.
- **Similar product**: Minimal card data used by the similar-product section.
- **View model**: Mapped props for each existing component plus page-level state (`loading`, `notFound`, `error`, `retry`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For each product ID load, each of the four endpoints is called exactly once with `auth: false`; a new call occurs only on an ID change or an explicit retry.
- **SC-002**: A valid product ID renders the existing design with API data, the similar-products section, and no direct mock imports for covered fields.
- **SC-003**: Loading, 404, out-of-stock, empty-specifications, no-rating and error states are reachable and distinguishable in the UI.
- **SC-004**: `npm run lint` and `npm run build` pass with no new warnings.
- **SC-005**: All exported mapper functions in `productDetailApi.js` have passing `node:test` unit tests.
- **SC-006**: A `null` average rating never renders as `0`/`NaN`, and expired or failed signed image URLs are refreshed via retry or degraded without a broken layout.

## Assumptions

- The backend contract is defined by `docs/api/openapi.json` (also referenced as `docs/openapi.json` in this repo).
- The product ID comes from the route; how the route passes it is existing application behavior.
- No new runtime dependencies or environment variables are needed; `VITE_API_URL` already exists.
- Node's built-in `node:test` runner is used for unit tests of the exported mapper functions in `productDetailApi.js`, following the existing `tests/*.js` pattern; no component-test framework is added. UI flows remain manually verified plus lint/build.
- Signed image URLs expire after at most five minutes, so the UI must obtain fresh URLs through `retry()` rather than caching them indefinitely.
