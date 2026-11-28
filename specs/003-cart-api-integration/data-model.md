# Data Model: Cart API Integration

## Source of Truth

`docs/openapi.json` Backend-SWE API 1.3.0. The cart view model is a direct mapping of `CartResponse`, `CartItemResponse`, `VoucherSummary`, `VoucherWalletEntry`, and `ApiError`. No financial value is derived in the frontend.

## Entities

### Cart

Server-owned aggregate returned by `GET /api/me/cart` and every successful cart content mutation.

| Field | Type | UI use |
|---|---|---|
| `items` | `CartItem[]` | Rendered rows, including unselected and unavailable rows |
| `totalItemCount` | integer | Cart text and header badge: distinct rows, not summed quantities |
| `selectedItemCount` | integer | Selected-row count supplied by the server |
| `selectedTotalQuantity` | integer | Selected unit count supplied by the server |
| `selectedSubtotal` | `Money` | "Tạm tính" value supplied by the server |
| `finalTotal` | `Money` | Final total supplied by the server |
| `voucherDiscount` | `Money` | Discount supplied by the server, including zero |
| `voucher` | `AppliedVoucher \| null` | Applied voucher summary |
| `voucherSelectionClearedReason` | `VoucherIneligibilityReason \| null` | Notice explaining why the server cleared a voucher |

### CartItem

One retained product-variant row. `id` is the cart item identity used by item mutations.

| Field | Type | Notes |
|---|---|---|
| `id` | int64 | Path identity for quantity, variant, selection, and removal |
| `productId` | UUID \| null | Product identity; may be null for historical retained rows |
| `variantId` | UUID \| null | Variant identity; may be null for historical retained rows |
| `productName` | string | Row title |
| `sku` | string | SKU text |
| `options` | `Record<string, string>` | Chosen options shown as the variant line |
| `primaryImageUrl` | URI \| null | Image source; null degrades to the existing placeholder |
| `unitPrice` | `Money \| null` | Null rows are not purchasable |
| `quantity` | integer 1–999 | Full resulting quantity, never a delta |
| `selected` | boolean | Authoritative selection state; no separate local `selectedIds` |
| `purchasable` | boolean | Controls selectability and totals eligibility |
| `availabilityReason` | `PRODUCT_UNAVAILABLE \| PRICE_UNAVAILABLE \| INVENTORY_UNAVAILABLE \| INSUFFICIENT_STOCK \| null` | Reason shown on unavailable rows |
| `subtotal` | `Money \| null` | Line subtotal supplied by the server |
| `availability` | `InventoryAvailability \| null` | Observed sellable quantity/status |
| `pricing` | `VariantPricing \| null` | Optional price evidence for eligible rows; never required for display |

### Money

Wire type is `SellingPrice`: `{ "amount": <integer>, "currency": "VND" }`.

Frontend view type keeps `amount` as a digit string to preserve exactness, plus a derived display string:

| Field | Type | Notes |
|---|---|---|
| `amount` | string of digits | Raw integer text from the server; never passed through `Number()` |
| `currency` | `"VND"` | Displayed only if it differs from the expected constant |
| `display` | string | `Intl.NumberFormat('vi-VN').format(BigInt(amount)) + '₫'` |

A null `Money` renders with the existing non-price placeholder. Non-integer or exponent wire amounts are treated as `CONTRACT_MISMATCH`.

### InventoryAvailability

| Field | Type | Notes |
|---|---|---|
| `availableQuantity` | integer ≥ 0 | Observed sellable units; not a reservation |
| `status` | `IN_STOCK \| OUT_OF_STOCK \| INVENTORY_UNAVAILABLE` | Supports availability messaging |

### AppliedVoucher

| Field | Type |
|---|---|
| `walletEntitlementId` | int64 |
| `voucherId` | int64 |
| `code` | string |
| `title` | string |
| `discountType` | `FIXED_AMOUNT \| PERCENTAGE` |
| `discountValue` | number |
| `maximumDiscount` | `Money \| null` |
| `calculationBase` | `Money` |
| `appliedDiscount` | `Money` |

### VoucherWalletEntry

| Field | Type | Notes |
|---|---|---|
| `walletEntitlementId` | int64 | Apply request identity; never use voucher code |
| `voucherId` | int64 | Display only |
| `code`, `title` | string | Display |
| `discountType`, `discountValue` | enum, number | Display as supplied |
| `maximumDiscount`, `minimumSubtotal` | `Money` | Display as supplied |
| `description`, `validFrom`, `validUntil` | string \| null | Display as supplied |
| `enabled`, `grantedAt`, `applicable` | boolean, date-time, boolean | Applicability comes from the server |
| `ineligibilityReason` | `VoucherIneligibilityReason \| null` | Localized reason shown when not applicable |

### VoucherWalletPage

| Field | Type |
|---|---|
| `items` | `VoucherWalletEntry[]` |
| `page`, `size`, `totalElements`, `totalPages` | integers |
| `first`, `last` | boolean; `last` controls pagination |

### ApiError

| Field | Type | Frontend use |
|---|---|---|
| `status` | integer 400–599, or 0 for network failure | Error classification |
| `code` | string \| undefined | Preferred message key |
| `reason` | string from `data.reason` | Secondary message key |
| `fieldErrors` | `Record<string, string[]>` | Field-level validation messages |
| `detail` / `message` | string | Server-safe detail, wrapped in Vietnamese context |

Never present raw English network messages or raw enum values as the complete user-facing message.

## Relationships

- A `Cart` contains zero or more `CartItem` rows and at most one `AppliedVoucher`.
- A `CartItem` belongs to at most one product variant; two rows with the same variant are merged by the server on add/switch.
- A `VoucherWalletEntry` can be applied by its `walletEntitlementId`; applying does not consume or delete the grant in this feature.
- `Cart.voucherSelectionClearedReason` refers to the same reason vocabulary as `VoucherWalletEntry.ineligibilityReason`.
- `Money` values are attached to cart rows, cart totals, displayed vouchers, and wallet thresholds; they are never inputs to frontend calculations.

## Validation Rules

- `quantity`: integer 1–999 inclusive; reject 0, negatives, fractions, and values above 999 locally before enqueueing.
- `productVariantId`: canonical lowercase UUID from product-detail variants; required for add and variant switch.
- `itemId` and `walletEntitlementId`: positive int64 from authoritative responses; never synthesized from array indexes.
- `page`: integer ≥ 0; `size`: integer 1–100; feature uses 20.
- `SellingPrice.amount`: digit-only integer text; no arithmetic, exponent, or fractional values.
- Selection of an unavailable row is blocked in the UI; the server also rejects selecting a non-eligible row with `422`.

## State Transitions

- **Guest → login → return**: Opening `/cart` or attempting an add while unauthenticated navigates to sign-in with a safe return destination; product-add intent is encoded in the return URL.
- **Cart load**: `checking → loading → ready | empty | error`. Refresh changes are ignored; a later load replaces the cache with reconciled server data and no separate change notice.
- **Mutation**: `idle → pending → success → refetch → ready` or `pending → failure → error notice + last confirmed data`. All mutations share a scope so rapid clicks are serialized; no response overwrites a newer confirmed cart.
- **Selection change**: server may clear an applied voucher; the next `CartResponse` supplies `voucherSelectionClearedReason`, which is shown until the next authoritative response clears it.
- **Session expiry**: client clears tokens, `AuthProvider` clears private queries, and the shopper is sent to sign-in with the current location as the return destination.
- **Checkout**: no transition is defined; checkout and order placement are out of scope.
