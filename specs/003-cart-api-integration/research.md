# Research: Cart API Integration

## Authoritative OpenAPI path

- **Decision**: Treat `docs/openapi.json` as the only contract source for this feature; do not create or reference `docs/api/openapi.json`.
- **Rationale**: The requested path `docs/api/openapi.json` does not exist in the repository. `docs/openapi.json` is the OpenAPI 3.1 document used by earlier features and contains all `/api/me/cart` and `/api/me/vouchers` operations.
- **Alternatives considered**: Creating a duplicate `docs/api/openapi.json` would add a second source of truth; guessing endpoint shapes from the UI would violate API Contract First.

## Exact VND money preservation

- **Decision**: Add an opt-in `responseType: 'text'` option to the shared client for successful JSON reads, then parse cart/wallet responses with a feature-level lossless helper that quotes integer tokens for `amount` keys. Format only at the render boundary with `Intl.NumberFormat('vi-VN').format(BigInt(digits)) + '₫'`.
- **Rationale**: `SellingPrice.amount` is an exact whole-VND integer that may exceed JavaScript's safe integer range; `res.json()` in `src/api/client.js` silently rounds such values. A raw-text path keeps generic client behavior unchanged, keeps all requests in the shared client, adds no dependency, and works with the project's current browser baseline. Error responses remain parsed as JSON so `ApiError.detail`, `code`, `reason`, and `fieldErrors` keep working.
- **Alternatives considered**: Accepting JS numbers risks changing displayed money; `JSON.parse` reviver `context.source` is not widely supported by the Vite baseline and cannot be polyfilled; `json-bigint`/`lossless-json` add runtime dependencies and would stringify unrelated int64 IDs.

## Bulk remove-selected

- **Decision**: Implement the existing bulk action as one orchestrating mutation that snapshots selected item IDs, deletes them sequentially through `DELETE /api/me/cart/items/{itemId}`, treats `404` as already removed, stops on any other failure, and always re-reads the cart on settle.
- **Rationale**: The contract has no bulk-delete endpoint and only single-item deletion returns `204` with no body. Sequential deletion avoids concurrent cart-lock conflicts, and a final authoritative refetch prevents guessed totals or counts after partial success.
- **Alternatives considered**: Unbounded parallel deletes can produce ambiguous partial failures; patching a 204 response with local estimates would invent server-owned totals; hiding the existing bulk button would contradict the user stories.

## Product variant identity and add intent

- **Decision**: Map `variants[].id` from `GET /api/products/{id}` into each product-detail option as `variantId`, then send that value as `productVariantId` in `POST /api/me/cart/items`. For an unauthenticated add, navigate to `/login` with a safe return URL containing the product path plus `add=1`, `variant=<uuid>`, and a clamped `quantity`. On return, restore the selected option and quantity but leave the add button primed rather than auto-submitting.
- **Rationale**: Variant IDs already exist in the product API but are dropped by the current view-model mapper. URL query state survives the existing `getSafeReturnDestination` helper, while router state would be lost. Not auto-submitting avoids accidental duplicate adds after sign-in.
- **Alternatives considered**: Using product ID or SKU as the variant UUID would be rejected by the contract; storing pending adds only in component state loses them across login navigation; silently clamping stock failures would hide the server's reason.

## Header cart count ownership

- **Decision**: The header badge displays `CartResponse.totalItemCount`. `App.jsx` calls the feature-level `useCartCount()` hook and passes the number through `CustomerLayout` as `cartCount`; `Header.jsx` renders an optional presentational badge.
- **Rationale**: `totalItemCount` counts distinct rows including unselected and unavailable items, matching the clarified spec. `App.jsx` is route composition, `CustomerLayout` only forwards a prop, and `Header` makes no request and contains no cart rules.
- **Alternatives considered**: Fetching inside `Header` would violate the shared-component rule; deriving the count from `items.length` or summed quantities would disagree with the authoritative count; keeping the count only in `CartPage` would leave the header stale on product pages.

## Session expiry and return destination

- **Decision**: Keep the existing shared-client refresh-and-rotation flow. Extend the session-expiry handler registered by `AuthProvider` to clear private queries and navigate to `/login` with `state.from` set to the current location. Cart and voucher query keys include the session generation, which is already treated as private by `AuthProvider`.
- **Rationale**: The client already refreshes once on 401, clears tokens, and invokes the expiry handler. Reusing the existing `ProtectedRoute` and `GuestRoute` return-destination logic gives a signed-in shopper back to `/cart` or the product page with add intent preserved.
- **Alternatives considered**: A global `window.location` redirect would lose router state and add intent; leaving `/cart` public would show stale/private data or a guest-only UI after expiry; adding a second auth layer would duplicate existing behavior.

## Cart query and mutation ordering

- **Decision**: Use one React Query cart entry per user/session generation with `staleTime: 0` and `retry: false`. Give every cart mutation (including add-to-cart from product detail) the same mutation scope so React Query serializes them, disable affected controls while mutations are pending, and refetch the cart and invalidate the voucher wallet on settle. Do not write mutation responses into the cart cache.
- **Rationale**: GET reconciles stock, price, and selection; re-reading after every mutation is the only safe way to display authoritative totals. Serial execution plus a final refetch prevents rapid clicks or older responses from leaving a wrong quantity, voucher, count, or total on screen.
- **Alternatives considered**: Optimistic quantity/total updates would calculate server-owned money locally; sequence numbers alone cannot handle voucher reconciliation or a failed latest request; user-triggered retry is safer than automatic mutation retries for non-idempotent actions.

## 204 responses and voucher preview

- **Decision**: After `DELETE /api/me/cart/items/{itemId}` or `DELETE /api/me/cart/voucher`, refetch the cart instead of patching the cache. Apply-voucher uses the returned `CartResponse` only as a signal to settle; all displayed values come from the subsequent GET. Display `voucherSelectionClearedReason` from `CartResponse` and remove the notice on the next authoritative response that no longer reports it.
- **Rationale**: Delete responses have no body, and totals, discounts, and voucher eligibility are server-owned. The apply operation returns `200`, but a single refetch-on-settle path avoids two different cache-write rules.
- **Alternatives considered**: Guessing `voucher: null`, zero discount, or `finalTotal = selectedSubtotal` would violate no-recalculation and could be wrong when a replacement selection qualifies.

## Voucher wallet and reason mapping

- **Decision**: Use `useInfiniteQuery` with key `['cart', 'voucherWallet', user.id, generation, size]`, fixed `size: 20`, `getNextPageParam` based on `last`, and deduplication by `walletEntitlementId`. Show `applicable` and localized `ineligibilityReason`; enable apply only when applicable. Invalidate the wallet after cart mutations. Map `ApiError.code`, `ApiError.data.reason`, `fieldErrors`, then status into Vietnamese messages via a shared feature dictionary.
- **Rationale**: Wallet applicability is an observation against the current selected subtotal, so it changes with cart mutations. Starting the key with `cart` ensures `AuthProvider` clears it on logout or session change. The contract's `reason` is an unconstrained string on `ApiError`, so it must be treated defensively.
- **Alternatives considered**: Filtering vouchers by client-side dates or amounts would duplicate server rules; using `items.length` to stop pagination would break count-first empty long-offset pages; showing raw enum strings or English network messages would be a poor user experience.

## Display-only placeholders

- **Decision**: Keep the existing static shipping-fee note and mark it with a TODO where it is defined. Do not introduce a cart original-price field; if a future design displays one, use `CartItemResponse.pricing.originalPrice` when present and keep the documented placeholder only where the contract truly has no field.
- **Rationale**: The current cart shows no original price or delivery estimate, but the contract exposes optional pricing evidence for eligible rows. Keeping placeholders only for absent data avoids inventing values while preserving the current design.
- **Alternatives considered**: Removing the shipping note changes the visual design; treating `pricing.originalPrice` as always present would break for unavailable rows where pricing is omitted.

## Checkout boundary

- **Decision**: Do not call `POST /api/me/cart/checkout` or any order endpoint in this feature. The existing checkout CTA stays visually present and non-transactional.
- **Rationale**: The feature specification explicitly places checkout and order placement out of scope; the API's checkout operation requires address and idempotency-key inputs that belong to a separate feature.
- **Alternatives considered**: Wiring the CTA now would expand scope and require address selection and idempotency handling; hiding the CTA would change the existing design.
