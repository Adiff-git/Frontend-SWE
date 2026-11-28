# Quickstart: Cart API Integration

## Prerequisites

- Node.js LTS 22 or newer and installed dependencies (`npm install`).
- A reachable backend implementing `docs/openapi.json` with a signed-in customer account that has cart items, purchasable and unavailable variants, and at least one applicable and one inapplicable voucher grant.
- `.env.local` (not committed) with `VITE_API_URL` pointing at that backend. No new environment variable is required.
- `docs/api/openapi.json` is not present; use `docs/openapi.json`.

## Commands

```bash
npm install
npm run dev
npm test
npm run lint
npm run build
```

`npm test` runs `node --test tests/*.test.js` for pure helpers plus Vitest component tests under `tests/components/` with mocked API responses. UI visual regression remains manual.

## Validation Scenarios

Sign in first unless a scenario explicitly begins as a visitor.

1. **View cart** — Open `/cart` with two items, one selected and one unselected. Verify each row's image, name, options, unit price, quantity and subtotal, the item count includes both rows, and totals come only from the selected row. Compare every money string with the API response.
2. **Empty cart** — Remove all items. Verify the friendly empty state and keep-shopping link; no mock rows appear.
3. **Guest access** — Sign out, open `/cart`, sign in, and confirm return to `/cart`. Sign out again, open a product page, choose a variant and quantity, click add, sign in, and confirm return to the same product with that variant and quantity still selected but not yet submitted.
4. **Add and merge** — Add a variant from product detail twice. Verify one row, the server's combined quantity, and a header badge equal to `totalItemCount` (distinct rows, not summed quantities).
5. **Quantity** — Change quantity to 1 and 999 where stock permits, then request more than available stock. Verify the server's values after success and unchanged quantity/totals with a clear message after failure.
6. **Variant switch** — Switch one row to a variant already present in the cart and verify a single merged row from the server.
7. **Selection and unavailable rows** — Toggle a row and select-all/deselect-all. Verify out-of-stock or otherwise unavailable rows show their reason, cannot be selected, and never affect totals.
8. **Remove** — Remove one row, then remove selected rows. Verify authoritative count and totals after each settle; check the bulk action is disabled with no selection.
9. **Voucher** — Open the voucher picker, confirm inapplicable vouchers show their reason, apply one voucher, replace it, remove it, and verify discount/final total from each response. Deselect items until the server clears the voucher and confirm the reason notice.
10. **Loading and errors** — Throttle or fail cart requests. Verify loading, retry, and that a failed update leaves the last confirmed quantity and total unchanged.
11. **Session expiry** — Expire the session during a cart action. Verify private data is cleared, sign-in appears, and the shopper returns to the interrupted destination.
12. **Visual regression** — Check desktop and mobile widths against the existing cart design; only the new badge, unavailable tags, voucher picker, notices, and state views differ.

## Expected Outcomes

- All displayed money amounts preserve API integer values and use the existing `vi-VN` currency style; nothing is recalculated in the browser.
- Every mutation settles by re-reading the cart, so rapid clicks and failed/out-of-order responses never leave a wrong quantity, selection, voucher, count, or total.
- Checkout is never called; its existing CTA remains visually present but non-transactional.
- `npm test`, `npm run lint`, and `npm run build` pass with no warnings.

See [contracts/cart-api.md](contracts/cart-api.md), [contracts/frontend-module.md](contracts/frontend-module.md), and [data-model.md](data-model.md) for field-level and export-level details.
