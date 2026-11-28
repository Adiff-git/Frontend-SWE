# Contract: Product Detail Backend Endpoints

**Source of truth**: `docs/openapi.json` (OpenAPI 3.1.0, Backend-SWE API v1.3.0)  
**Base URL**: `import.meta.env.VITE_API_URL` via `src/api/client.js`  
**Auth**: none; every operation declares `security: []` and must be called with `auth: false`.

---

## `GET /api/products/{id}`

- Path param `id`: lowercase UUID, required.
- Query params: none.
- Success: `200 application/json` → `ProductDetail`.
- Errors: `400`, `401`, `404`, `500`, `503` with `application/problem+json` (`Problem`, `ApiError`, or `IdentityProblem`).
- `404` means the product is missing, not published, or archived. The frontend maps this to `notFound: true`.

### `ProductDetail` (required fields)

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "name": "Example product",
  "category": { "id": "00000000-0000-4000-8000-000000000002", "name": "Example category" },
  "primaryImageUrl": null,
  "description": "Example description",
  "brand": null,
  "images": [
    {
      "id": "00000000-0000-4000-8000-000000000003",
      "url": "https://cdn.example/image.jpg",
      "altText": "Example product",
      "width": 800,
      "height": 800,
      "displayOrder": 0,
      "isPrimary": true
    }
  ],
  "variants": [
    {
      "id": "00000000-0000-4000-8000-000000000004",
      "sku": "EXAMPLE-1",
      "options": { "storage": "256GB", "color": "Titan" },
      "sellingPrice": { "amount": 29990000, "currency": "VND" },
      "technicalSpecifications": { "Chip": "A17 Pro" },
      "availability": { "availableQuantity": 18, "status": "IN_STOCK" }
    }
  ]
}
```

---

## `GET /api/products/{productId}/reviews`

- Path param `productId`: lowercase UUID, required.
- Query params: `page` (0-based, default `0`), `size` (1..100, default `20`), `sort` (`createdAt,asc|desc`, `rating,asc|desc`, default `createdAt,desc`). Unknown/repeated keys are rejected.
- Success: `200 application/json` → `ReviewPage`; header `Cache-Control: no-store`.
- Errors: `400`, `401`, `404` (`application/problem+json`).
- The frontend requests `page=0`, `size=20`, `sort=createdAt,desc`.

### `ReviewPage`

```json
{
  "items": [
    {
      "id": 701,
      "rating": 5,
      "comment": "Useful product",
      "images": [{ "id": "00000000-0000-4000-8000-000000000005", "finalUrl": "https://cdn.example/review.jpg" }],
      "author": { "displayName": "Example customer", "profileImage": null },
      "createdAt": "2026-11-21T03:00:00.000000Z",
      "updatedAt": "2026-11-21T03:00:00.000000Z",
      "verifiedPurchase": true
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1
}
```

---

## `GET /api/products/{productId}/rating-summary`

- Path param `productId`: lowercase UUID, required.
- Query params: none accepted.
- Success: `200 application/json` → `ProductRatingSummary`; header `Cache-Control: no-store`.
- Errors: `400`, `401`, `404` (`application/problem+json`).

```json
{ "reviewCount": 1542, "averageRating": 4.8 }
```

When `reviewCount` is `0`, `averageRating` is `null`. The schema explicitly has **no distribution field**.

---

## `GET /api/products/{productId}/similar`

- Path param `productId`: lowercase UUID, required.
- Query param `limit`: integer 1..20, default `10`; unknown/repeated keys rejected.
- Success: `200 application/json` → `Recommendations`; header `Cache-Control: no-store`.
- Errors: `400`, `401`, `404` (`application/problem+json`).
- The source product is excluded from `items`.

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000002",
      "name": "Similar product",
      "category": { "id": "00000000-0000-4000-8000-000000000002", "name": "Example category" },
      "primaryImageUrl": null,
      "displayPrice": { "amount": 150000, "currency": "VND" },
      "representativeVariantId": "00000000-0000-4000-8000-000000000004",
      "availability": { "availableQuantity": 3, "status": "IN_STOCK" }
    }
  ]
}
```

---

## Error Handling Rules

1. The shared client converts non-2xx responses into `ApiError` with `status`, `message` (from `detail`/`message`), and `data`.
2. Network failures produce `ApiError` with `status === 0`; abort errors are rethrown as `AbortError` and ignored by the hook.
3. Product `404` → not-found state; product other errors → error + retry state.
4. Supplementary endpoint errors → `sectionErrors` flags; the product remains visible.
