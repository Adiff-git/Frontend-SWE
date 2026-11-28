# Contract: Cart and Voucher API

Source: `docs/openapi.json` (Backend-SWE API 1.3.0). `docs/api/openapi.json` does not exist in this repository.

## Common Rules

- All cart operations require bearer authentication and `MANAGE_CART`; wallet reads require bearer authentication only.
- Requests go through `src/api/client.js`; base URL is `import.meta.env.VITE_API_URL`.
- Successful JSON reads for money-bearing responses use the client's opt-in raw-text mode. Error bodies remain standard `application/problem+json`.
- A `401` triggers the existing single refresh-and-retry flow; if still unauthorized, the session is cleared and the shopper returns to sign-in.
- `204` responses have no body. Never infer new cart totals or voucher state from them.
- Every cart content response is `CartResponse`; the frontend displays its supplied values exactly.

## Money Serialization

`SellingPrice` is `{ amount: <integer>, currency: "VND" }`. `amount` is exact whole VND and may exceed JavaScript safe-integer range. The frontend preserves digit text, rejects fraction/exponent forms as `CONTRACT_MISMATCH`, formats with `Intl.NumberFormat('vi-VN').format(BigInt(amount)) + '₫'`, and never computes with `amount`.

## Operations

| Operation | Request | Success | Frontend behavior |
|---|---|---|---|
| `GET /api/me/cart` | No params/body | `200 CartResponse` | Reconciled load; replaces cache; empty `items` renders empty state |
| `POST /api/me/cart/items` | `{ productVariantId: UUID, quantity: 1..999 }` | `200 CartResponse` | Same variant merges on server; refetch after settle; update header from `totalItemCount` |
| `PUT /api/me/cart/items/{itemId}/quantity` | `{ quantity: 1..999 }` | `200 CartResponse` | Full resulting quantity; insufficient stock is a rejection with unchanged UI |
| `PUT /api/me/cart/items/{itemId}/variant` | `{ productVariantId: UUID }` | `200 CartResponse` | Switch within same product; matching rows merge on server |
| `PUT /api/me/cart/items/{itemId}/selection` | `{ selected: boolean }` | `200 CartResponse` | Selecting unavailable rows rejected; deselect is nonblocking |
| `DELETE /api/me/cart/items/{itemId}` | No body | `204` | `404` treated as already removed; refetch after settle |
| `PUT /api/me/cart/selection` | `{ selected: boolean }` | `200 CartResponse` | Select/deselect all eligible rows in one request |
| `PUT /api/me/cart/voucher` | `{ walletEntitlementId: int64 }` | `200 CartResponse` | Never sends code or voucher definition ID; failed apply preserves prior voucher |
| `DELETE /api/me/cart/voucher` | No body | `204` | Idempotent; refetch to obtain authoritative totals |
| `GET /api/me/vouchers` | `page`, `size` (1–100) | `200 VoucherWalletPage` | Drives voucher picker; `last` controls pagination |

## Response Shapes

### CartResponse

```json
{
  "items": [],
  "totalItemCount": 0,
  "selectedItemCount": 0,
  "selectedTotalQuantity": 0,
  "selectedSubtotal": { "amount": 0, "currency": "VND" },
  "finalTotal": { "amount": 0, "currency": "VND" },
  "voucherDiscount": { "amount": 0, "currency": "VND" },
  "voucher": null,
  "voucherSelectionClearedReason": null
}
```

### CartItemResponse

Required fields: `id`, `productId`, `variantId`, `productName`, `sku`, `options`, `primaryImageUrl`, `unitPrice`, `quantity`, `selected`, `purchasable`, `availabilityReason`, `subtotal`, `availability`. `pricing` is optional and may be omitted for unavailable rows.

### VoucherWalletEntry

Required fields: `walletEntitlementId`, `voucherId`, `code`, `title`, `discountType`, `discountValue`, `maximumDiscount`, `minimumSubtotal`, `description`, `validFrom`, `validUntil`, `enabled`, `grantedAt`, `applicable`, `ineligibilityReason`.

## Error Contract

`ApiError` carries `status`, `detail`/`message`, optional `code`, optional `reason`, and `fieldErrors` (`Record<string, string[]>`). Frontend message precedence is `code → reason → fieldErrors → status → generic Vietnamese`.

- `availabilityReason`: `PRODUCT_UNAVAILABLE`, `PRICE_UNAVAILABLE`, `INVENTORY_UNAVAILABLE`, `INSUFFICIENT_STOCK`.
- `voucherSelectionClearedReason` / `ineligibilityReason`: `VOUCHER_UNAVAILABLE`, `ENTITLEMENT_UNAVAILABLE`, `VOUCHER_DISABLED`, `VOUCHER_NOT_STARTED`, `VOUCHER_EXPIRED`, `GLOBAL_USAGE_EXHAUSTED`, `CUSTOMER_USAGE_EXHAUSTED`, `NO_ELIGIBLE_ITEMS`, `MINIMUM_SUBTOTAL_NOT_MET`.
- `409`/`422` on add, quantity, variant, or voucher apply must not change displayed rows, selection, totals, or header count.

## Out of Scope

`POST /api/me/cart/checkout` and `GET /api/me/vouchers/{walletEntitlementId}` are documented in the OpenAPI file but are not called by this feature.
