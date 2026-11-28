# Data Model: Product Detail API Integration

**Feature**: `002-product-detail-api`  
**Source contract**: `docs/openapi.json` (Backend-SWE API v1.3.0)  
**Date**: 2026-11-25  

---

## 1. API Entities (read-only)

### `ProductDetail`

| Field | Type | Required | Validation / notes |
|---|---|---:|---|
| `id` | UUID string | Yes | Lowercase UUID; used as path param |
| `name` | string | Yes | Display name |
| `category` | `CategorySummary` | Yes | `{ id: UUID, name: string }` |
| `primaryImageUrl` | string URI or `null` | Yes | Short-lived signed URL; may be null |
| `description` | string or `null` | Yes | Plain text |
| `variants` | `VariantSummary[]` | Yes | `minItems: 1` |
| `images` | `ProductImageSummary[]` | Yes | Max 10, ordered by `displayOrder` |
| `brand` | `BrandSummary` or `null` | Yes | `{ id, code, name }` |

### `VariantSummary`

| Field | Type | Required | Validation / notes |
|---|---|---:|---|
| `id` | UUID string | Yes | Selected variant identity |
| `sku` | string | Yes | `minLength: 1` |
| `options` | `Record<string, string>` | Yes | e.g. `storage`, `color`; keys are not guaranteed |
| `sellingPrice` | `{ amount: integer, currency: "VND" }` | Yes | Whole VND, possibly beyond JS safe integer |
| `technicalSpecifications` | `Record<string, unknown>` | Yes | May be empty |
| `availability` | `InventoryAvailability` | Yes | `{ availableQuantity >= 0, status }` |

`InventoryAvailability.status` is one of `IN_STOCK`, `OUT_OF_STOCK`, `INVENTORY_UNAVAILABLE`. A product is purchasable only when the selected variant has `status === "IN_STOCK"` and `availableQuantity > 0`.

### `ReviewPage` / `ReviewResponse`

| Field | Type | Required | Validation / notes |
|---|---|---:|---|
| `items` | `ReviewResponse[]` | Yes | Max 100 per page |
| `page`, `size`, `totalElements`, `totalPages` | integer | Yes | Zero-based `page`, `size` 1..100 |
| `items[].id` | integer >= 1 | Yes | Stable key |
| `items[].rating` | integer 1..5 | Yes | Used for fallback star rendering |
| `items[].comment` | string or `null` | Yes | Max 2000 chars |
| `items[].images` | `{ id: UUID, finalUrl: string or null }[]` | Yes | Max 10; null URLs filtered out |
| `items[].author` | `{ displayName: string, profileImage: ImageAccessResponse or null }` | Yes | No email/user ID exposed |
| `items[].createdAt`, `items[].updatedAt` | date-time string | Yes | Format into relative display time |
| `items[].verifiedPurchase` | `true` | Yes | Always true |

### `ProductRatingSummary`

| Field | Type | Required | Validation / notes |
|---|---|---:|---|
| `reviewCount` | integer >= 0 | Yes | Committed reviews |
| `averageRating` | number 1..5 or `null` | Yes | Two decimals; null when no reviews |

No per-star distribution field exists in the contract.

### `Recommendations` / `ProductListingItem`

| Field | Type | Required | Validation / notes |
|---|---|---:|---|
| `items` | `ProductListingItem[]` | Yes | Max 20 |
| `items[].id` | UUID string | Yes | Stable key |
| `items[].name` | string | Yes | `minLength: 1` |
| `items[].category` | `CategorySummary` | Yes | Used as specs fallback |
| `items[].primaryImageUrl` | string URI or `null` | Yes | Filter/handle null |
| `items[].displayPrice` | `SellingPrice` or `null` | Yes | Paired with `representativeVariantId` |
| `items[].representativeVariantId` | UUID string or `null` | Yes | Product card variant identity |
| `items[].availability` | `InventoryAvailability` or `null` | Yes | May be null |

---

## 2. Frontend View Models (mapped in `productDetailApi.js`)

### `ProductHeroView`

```js
{
  name: string,
  sku: string,
  color: string,
  inventory: number,
  image: string | null,
  options: Array<{
    storage: string,
    price: number,
    originalPrice: number,
    sku: string,
    inventory: number,
    inStock: boolean,
  }>,
}
```

Validation rules:
- `options` always has at least one entry because `variants` has `minItems: 1`.
- `price` uses `Number(amount)` only for display formatting; the raw amount may exceed safe integer precision, so no arithmetic is performed on it.
- `originalPrice` is taken from `src/mocks/product-detail.js` matched by storage (fallback to the corresponding mock index) — **TODO: backend has no original/list price field**.
- `color` reads known keys (`color`, `Color`, `colour`, `Colour`) from `variant.options`; falls back to the mock value with a TODO.

### `ProductHighlightsView`

`Array<{ icon: "chip" | "camera" | "phone" | "battery", eyebrow, title, description }>`, sourced directly from the existing mock — **TODO: no highlights endpoint**.

### `ProductSpecificationsView`

`Array<{ title, icon, items: Array<[string, string]> }>` built from the selected variant's `technicalSpecifications`. Unknown values are stringified safely; empty specifications fall back to the existing mock — **TODO: no dedicated specification endpoint**.

### `ProductReviewsView`

```js
{
  reviews: Array<{
    initials: string,
    name: string,
    time: string,
    title: string,
    text: string,
    photos: string[],
  }>,
  summary: {
    score: string,          // averageRating formatted to one decimal, "—" when null
    count: string,          // reviewCount formatted vi-VN
    purchased: string,      // mock, TODO
    withPhotos: string,     // mock, TODO
  },
  distribution: Array<{ stars: number, count: string, width: string }>, // mock, TODO
}
```

Validation rules:
- `initials` derives from the first characters of up to two words in `displayName`; "Former customer" is allowed.
- `time` formats `createdAt` relative to now (`x giờ trước`, `x ngày trước`) with an absolute-date fallback.
- `title` uses the first sentence/line of `comment`; if `comment` is null, uses a localized placeholder — **TODO: no review title field**.
- Null `finalUrl` images are omitted; `rating` is used for the `aria-label` star count.

### `SimilarProductView`

`ProductCard`-compatible object:

```js
{
  id, name, image, price, oldPrice: null, status,
  colors: [], colorName: "", specs: [category.name], variantId,
}
```

`price` is formatted with `Intl.NumberFormat("vi-VN")` + `₫`; null `displayPrice` yields "Liên hệ".

### `ProductDetailViewModel`

```js
{
  product: ProductHeroView,
  highlights: ProductHighlightsView,
  specifications: ProductSpecificationsView,
  reviews: ProductReviewsView["reviews"],
  summary: ProductReviewsView["summary"],
  distribution: ProductReviewsView["distribution"],
  similarProducts: SimilarProductView[],
  reviewCount: number,
  averageRating: number | null,
  inStock: boolean,
}
```

---

## 3. Hook State Model

| State | Type | Meaning |
|---|---|---|
| `data` | `ProductDetailViewModel` or `null` | Populated after the product request succeeds |
| `loading` | boolean | True while the initial/retry load is pending |
| `notFound` | boolean | Product request returned 404 |
| `error` | `ApiError` or `null` | Product request failed for a reason other than 404 |
| `sectionErrors` | `{ reviews: boolean, rating: boolean, similar: boolean }` | Supplementary request failures |
| `retry` | `() => void` | Increments a nonce to re-run the effect |

State transitions:

```text
idle / id changed
  -> loading=true, data=null, notFound=false, error=null
  -> product 200 + section results -> loading=false, data=<view model>
  -> product 404                  -> loading=false, notFound=true
  -> product other failure        -> loading=false, error=<ApiError>
  -> unmount / id changed         -> AbortController.abort(), ignore result
  -> retry()                      -> same as id changed
```

Out-of-stock is derived state: `inStock = selectedVariant.status === "IN_STOCK" && availableQuantity > 0`. `ProductHero` disables stepper/buy/cart and shows "Hết hàng" when false.

---

## 4. Relationships

- One `ProductDetail` has many `VariantSummary` entries; the selected variant supplies SKU, price, specifications, and inventory.
- One `ProductDetail` has many `ProductImageSummary` entries; the primary image or first ordered image feeds `ProductHero`.
- One `ProductDetail` has many `ReviewResponse` entries via `ReviewPage`; `ProductRatingSummary` aggregates them.
- `Recommendations.items` reference other published products and exclude the source product.

---

## 5. Mock Fallbacks Requiring TODO

| Fallback | Source | Reason |
|---|---|---|
| `originalPrice` | `src/mocks/product-detail.js` | No price-before field in OpenAPI |
| Star distribution | `ProductReviews.jsx` / mock | Rating summary explicitly has no distribution |
| "Đã mua", "Đánh giá có ảnh" stats | `ProductReviews.jsx` | No backend counters |
| Highlights | `src/mocks/product-detail.js` | No highlights endpoint |
| Review title | Derived from comment | No title field |
| Specifications | Mock when `technicalSpecifications` empty | No dedicated endpoint |
