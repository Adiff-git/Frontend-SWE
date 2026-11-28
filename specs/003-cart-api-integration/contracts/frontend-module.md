# Contract: Cart Frontend Module

All cart data access and cart state transitions are owned by `src/features/customer/cart/`. Components receive mapped view models and callbacks; no component calls the API or formats money from a computed number.

## API Helper: `cartApi.js`

| Export | Request | Return |
|---|---|---|
| `getCart({ signal })` | `GET /api/me/cart` | raw text for exact-money parsing |
| `addCartItem({ productVariantId, quantity, signal })` | `POST /api/me/cart/items` | raw text |
| `updateCartQuantity({ itemId, quantity, signal })` | `PUT /api/me/cart/items/{itemId}/quantity` | raw text |
| `changeCartVariant({ itemId, productVariantId, signal })` | `PUT /api/me/cart/items/{itemId}/variant` | raw text |
| `selectCartItem({ itemId, selected, signal })` | `PUT /api/me/cart/items/{itemId}/selection` | raw text |
| `removeCartItem({ itemId, signal })` | `DELETE /api/me/cart/items/{itemId}` | `null` on `204` |
| `selectAllCartItems({ selected, signal })` | `PUT /api/me/cart/selection` | raw text |
| `applyCartVoucher({ walletEntitlementId, signal })` | `PUT /api/me/cart/voucher` | raw text |
| `removeCartVoucher({ signal })` | `DELETE /api/me/cart/voucher` | `null` on `204` |
| `getVoucherWalletPage({ page, size, signal })` | `GET /api/me/vouchers` | raw text |

Every function uses `expectedStatus` and passes `signal` through. Item and entitlement IDs are encoded from authoritative values.

## Exact Money Helpers

- `parseExactMoneyJson(text)`: returns a plain object where `SellingPrice.amount` values are digit strings; throws a contract-mismatch error for non-integer wire amounts.
- `formatExactVnd(amountDigits)`: returns the existing Vietnamese display form, e.g. `30.480.000₫`.

No helper returns `BigInt`; `BigInt` is used only during formatting.

## Mappers and Reason Dictionaries

- `toCartView(rawCart)`: maps `CartResponse` to the cart view model.
- `toCartItemView(rawItem)`: maps row fields and attaches localized availability text.
- `toVoucherView(rawWalletEntry)`: maps wallet rows and applicability text.
- `mapAvailabilityReason(reason)`, `mapVoucherReason(reason)`, `mapApiError(error)`: produce Vietnamese messages.

## Hooks

- `useCart()`: `useQuery` with key `['cart', user.id, generation]`, `staleTime: 0`, `retry: false`, enabled only for an authenticated customer. Returns cart view, loading/error state, and `refetch`.
- `useCartCount()`: subscribes to `['cart', user.id, generation]` and returns `totalItemCount ?? 0`; initializes that shared cache entry with `getCart()` when authenticated so the badge is authoritative on every page.
- `useVoucherWallet()`: `useInfiniteQuery` with key `['cart', 'voucherWallet', user.id, generation, 20]`; returns pages, `fetchNextPage`, and loading/error state.
- Cart mutations share scope `cart:${user.id}:${generation}`, use `retry: false`, and call a single settle routine that refetches the cart and invalidates the wallet prefix.

## Component Props

| Component | Props |
|---|---|
| `CartPage` (feature) | none; composes `useCart()` and mutation hooks |
| `CartItems` | `cart`, `busy`, callbacks for toggle/select-all/quantity/variant/remove |
| `CartItem` | `item`, `busy`, callbacks for toggle/quantity/variant/remove |
| `CartSummary` | `cart`, `busy`, `onCheckout` (non-transactional) |
| `VoucherPicker` | `wallet`, `appliedVoucher`, `busy`, `onApply`, `onRemove`, `clearedReason` |
| `CartNotice` | `message`, `tone` (`info`/`error`) |
| `Header` | optional `cartCount` number; presentational only |
| `CustomerLayout` | optional `cartCount` prop forwarded to `Header` |

## Behavior Contract

- No optimistic writes: displayed quantity, selection, voucher, counts, and totals change only after an authoritative refetch.
- Mutations are disabled while another cart mutation is pending; the bulk remove action snapshots selected IDs and deletes them sequentially.
- A `404` during single/bulk removal is treated as already removed; all other failures show a Vietnamese error and keep last confirmed values.
- `voucherSelectionClearedReason` is displayed until the next authoritative response clears it; vouchers are never auto-reapplied.
- Guest cart opens and guest add attempts navigate to sign-in with a safe return destination; session expiry clears private cache entries first.
- Checkout and order placement are not called.

## Verification Contract

- Pure parser/mapper tests use `node:test`; component tests use Vitest, React Testing Library, and mocked API responses under `tests/components/`; both run via `npm test`.
- UI visual regression is verified manually plus `npm run lint` and `npm run build`.
- No new runtime dependency, environment variable, or direct `fetch` call is permitted; test tooling is dev-only.
