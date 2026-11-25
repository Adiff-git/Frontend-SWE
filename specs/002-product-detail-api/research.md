# Technical Research: Product Detail API Integration

**Feature**: `002-product-detail-api`  
**Branch**: `feature/search-and-browse`  
**Date**: 2026-11-25  

---

## 1. OpenAPI Contract Location and Endpoint Shape

### Decision
Use `docs/openapi.json` (OpenAPI 3.1.0, Backend-SWE API v1.3.0) as the contract. The path `docs/api/openapi.json` referenced in the request does not exist in this repository.

### Rationale
It is the only OpenAPI document present, and it contains all four requested operations with matching schemas.

### Alternatives considered
- Guessing routes from mock data — rejected by Constitution Principle I.
- Creating `docs/api/openapi.json` as a copy — rejected; it would duplicate a source of truth.

### Confirmed operations

| Operation | Method + path | Response schema | Notes |
|---|---|---|---|
| `getProduct` | `GET /api/products/{id}` | `ProductDetail` | Public (`security: []`), 404 when missing/DRAFT/ARCHIVED |
| `listProductReviews` | `GET /api/products/{productId}/reviews` | `ReviewPage` | Public, paginated, default `page=0`, `size=20` |
| `getProductRatingSummary` | `GET /api/products/{productId}/rating-summary` | `ProductRatingSummary` | Public, `reviewCount` + nullable `averageRating` |
| `getSimilarProducts` | `GET /api/products/{productId}/similar` | `Recommendations` | Public, optional `limit` (1..20, default 10) |

All four override the root bearer security with `"security": []`, so the feature must pass `auth: false` to the shared client even if a token is present.

---

## 2. Shared Client Usage and Error Semantics

### Decision
Call `api.get(path, params, { auth: false, signal })` from `productDetailApi.js`. Encode the product ID with `encodeURIComponent`. Treat `ApiError.status === 404` from the product endpoint as not-found; every other rejection (including status 0 and 5xx) as a generic error with retry.

### Rationale
`src/api/client.js` already implements base URL resolution, `ApiError`, `AbortSignal`, and `auth: false`; response bodies use RFC 9457 `detail`/`message` which the client already maps into `ApiError.message`.

### Alternatives considered
- Direct `fetch` in components — forbidden by CONVENTIONS.md and Constitution Principle I.
- Treating all errors identically — rejected because a 404 is a distinct shopper-facing state.

### Partial-failure decision
The product request is required; reviews, rating summary, and similar products are supplementary. Use `Promise.allSettled` in the API helper so a failure in a supplementary request does not hide a successfully loaded product. Expose per-section error flags from the hook instead of a single global failure when only a section fails.

---

## 3. Mapping API Responses to Existing Component Props

### Decision
Keep the existing components and CSS unchanged in layout; convert each component to accept props from the hook's view model.

| Component | Current mock props | API source | Mapping decision |
|---|---|---|---|
| `ProductHero` | `product: { name, sku, color, inventory, image, options: [{ storage, price, originalPrice }] }` | `ProductDetail` + `VariantSummary` | `name` from `ProductDetail.name`; `sku` from the selected variant's `sku`; `image` from `primaryImageUrl` or first `images[].url`; `inventory` from `availability.availableQuantity`; options from `variants[].options.storage` and `sellingPrice.amount`. `originalPrice` has no API field: keep the mock value by matching storage, with `TODO`. `color` from a known `options` key with mock fallback and `TODO`. |
| `ProductHighlights` | `highlights: [{ icon, eyebrow, title, description }]` | none | Keep `src/mocks/product-detail.js` `highlights`; add `TODO` because no endpoint exists. |
| `ProductSpecifications` | `specifications: [{ title, icon, items: [[label, value]] }]` | `variants[].technicalSpecifications` | Convert the selected variant's object into groups of tuples; keep the existing mock groups as fallback with `TODO`. |
| `ProductReviews` | `reviews: [{ initials, name, time, title, text, photos }]`, hard-coded summary/distribution | `ReviewPage` + `ProductRatingSummary` | Map `author.displayName` → `name`/initials, `createdAt` → relative `time`, `comment` → `text`, `images[].finalUrl` → `photos`. No title field exists: derive from the first comment line with `TODO`. `averageRating` → score; `reviewCount` → review total. Star distribution and "Đã mua"/"có ảnh" stats stay mock with `TODO`. |
| Similar products | not currently rendered | `Recommendations.items` | Map `ProductListingItem` into a `ProductCard`-compatible object (`id`, `name`, `image`, formatted `price`, `status`, `specs`, `variantId`). Do not introduce a new visual section in this change; expose the mapped list from the hook for reuse. |

### Rationale
This preserves the existing design while satisfying the contract; every field absent from the OpenAPI document remains explicitly marked rather than invented.

### Alternatives considered
- Rendering a new similar-products grid — rejected because it changes the approved visual design.
- Removing sections whose data is unavailable — rejected because the spec requires keeping mock values for gaps.

---

## 4. Hook State Model

### Decision
Implement `useProductDetail(id)` with plain `useState`/`useEffect`, matching `useCategory.js`, rather than adding a new React Query dependency usage pattern to this feature.

Returned shape:

```js
{
  data: null | {
    product, highlights, specifications, reviews, summary, similarProducts,
    reviewCount, averageRating, inStock
  },
  loading: boolean,
  notFound: boolean,
  error: ApiError | null,
  sectionErrors: { reviews, rating, similar },
  retry: () => void
}
```

Effect behavior: reset state on `id`/retry change, create `AbortController`, ignore results after cleanup, and abort pending fetches. `retry` increments a nonce that retriggers the effect. A 404 from the product endpoint sets `notFound`; other product failures set `error`.

### Rationale
The repository already uses this lightweight pattern in storefront/category features; React Query is used mainly for auth/account flows. The hook still supports cancellation and user-driven retry without new dependencies.

### Alternatives considered
- TanStack `useQuery` with `retry: false` — viable, but would add provider-dependent behavior to a feature that otherwise has no query usage; not needed for four reads.
- No cancellation — rejected because route changes can leave stale responses.

---

## 5. Loading, 404, Out-of-Stock and Error UI

### Decision
Handle states in `ProductDetailPage.jsx` with existing `product-detail__*` classes plus minimal additions in `ProductDetailPage.css`:
- loading: `role="status"` message, no product sections;
- 404: `role="alert"` not-found message with a link back to `/products`;
- error: `role="alert"` message with a "Thử lại" button calling `retry`;
- out-of-stock: pass `inStock: false` to `ProductHero`, which disables quantity/buy/cart controls and shows "Hết hàng";
- supplementary section errors: inline messages in the reviews area only, product remains visible.

### Rationale
Matches existing Vietnamese copy and accessibility patterns in `CategoryPage.jsx`, `AddressBookScreen.jsx`, and `ProtectedRoute.jsx` while keeping the visual design intact.

### Alternatives considered
- Navigating to the global `NotFoundPage` — rejected; it loses the storefront chrome and breadcrumb context.

---

## 6. Verification Approach

### Decision
Verify with `npm run lint`, `npm run build`, and manual browser scenarios using `npm run dev:api` against a backend (`VITE_API_URL`) plus Node `http.createServer` stubs where needed.

### Rationale
`package.json` has no `test` script and no component-test framework. Existing `tests/*.js` use `node:test`, but adding product-detail tests would require introducing a new pattern; the constitution allows manual verification until a framework is introduced.

### Alternatives considered
- Adding Vitest/Testing Library — rejected as a new dependency outside this focused change.

---

## 7. Resolved Clarifications

| Topic | Resolution |
|---|---|
| API document path | `docs/openapi.json`; `docs/api/openapi.json` is absent |
| Auth mode | `auth: false` for all four calls |
| Product ID source | `useParams()` in `ProductDetailPage`, route `/products/:id` already exists |
| Original price | Keep mock with `TODO` |
| Star distribution | Keep mock with `TODO` |
| Review titles | Derive from comment with `TODO` |
| Highlights | Keep mock with `TODO` |
| Similar products UI | Mapped data exposed from hook; no new visual section |
| Tests | Manual + lint/build; no new framework |
