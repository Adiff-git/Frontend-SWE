# Contract: Product Detail Frontend Module

**Location**: `src/features/customer/product-detail/`  
**Modules**: `productDetailApi.js`, `useProductDetail.js`  
**Conventions**: `docs/CONVENTIONS.md`; hooks start with `use`, non-JSX files use `.js`, all HTTP goes through `src/api/client.js`.

---

## `productDetailApi.js`

```js
getProductDetail(id, options)      // GET /api/products/{encodeURIComponent(id)}
getProductReviews(id, options)     // GET /api/products/{id}/reviews?page=0&size=20&sort=createdAt,desc
getRatingSummary(id, options)      // GET /api/products/{id}/rating-summary
getSimilarProducts(id, options)    // GET /api/products/{id}/similar?limit=10
getProductDetailData(id, options)  // aggregate + map into ProductDetailViewModel
```

- `options` may contain `signal`; every call uses `{ auth: false, signal }`.
- `getProductDetailData` uses `Promise.allSettled`; product rejection is rethrown, supplementary rejections become `sectionErrors: { reviews, rating, similar }`.
- Mappers are pure functions: no direct `fetch`, no new dependencies.
- Mock imports are limited to documented fallback fields and each fallback carries a `TODO` comment referencing the missing backend field.

### Returned view model

```js
{
  product: {
    name, sku, color, inventory, image,
    options: [{ storage, price, originalPrice, sku, inventory, inStock }],
  },
  highlights: [{ icon, eyebrow, title, description }],
  specifications: [{ title, icon, items: [[label, value]] }],
  reviews: [{ initials, name, time, title, text, photos }],
  summary: { score, count, purchased, withPhotos },
  distribution: [{ stars, count, width }],
  similarProducts: [{ id, name, image, price, oldPrice, status, colors, colorName, specs, variantId }],
  reviewCount, averageRating, inStock,
}
```

---

## `useProductDetail.js`

```js
const {
  data,
  loading,
  notFound,
  error,
  sectionErrors,
  retry,
} = useProductDetail(id);
```

Guarantees:
- `loading` is `true` immediately after mount, ID change, or `retry()`.
- `data` is `null` while loading or on failure; no stale product is shown for a new ID.
- `notFound` is `true` only for product `404`; `error` is set for all other product failures.
- `sectionErrors` only reports supplementary failures and never replaces `data`.
- `AbortController` cancels in-flight requests on cleanup; `AbortError` is ignored.
- `retry()` re-runs the effect with a new nonce; no automatic retry loop is introduced.

---

## Component Props Contract

Existing components keep their visual structure and CSS; they accept props instead of importing mocks directly:

| Component | Props |
|---|---|
| `ProductDetailPage` | none; reads `useParams().id`, calls `useProductDetail`, renders states and passes view-model slices |
| `ProductHero` | `product` (`ProductHeroView`), `inStock` (boolean, optional derivation from `product.options`) |
| `ProductHighlights` | `highlights` (`ProductHighlightsView`) |
| `ProductSpecifications` | `specifications` (`ProductSpecificationsView`) |
| `ProductReviews` | `reviews`, `summary`, `distribution`, `sectionErrors` (optional) |

ProductCard-compatible `similarProducts` are exposed for reuse but no new section is added in this change.

---

## UI States

| State | Rendering |
|---|---|
| loading | `<p role="status">Đang tải sản phẩm…</p>` |
| 404 | Not-found message + link to `/products`, `role="alert"` |
| product error | Error message + "Thử lại" button calling `retry`, `role="alert"` |
| out of stock | `ProductHero` shows "Hết hàng" and disables quantity/buy/cart controls |
| section error | Inline message in the reviews section; product stays visible |
| success | Existing sections with mapped data; no visual redesign |
