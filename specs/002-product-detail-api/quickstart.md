# Quickstart: Product Detail API Integration

**Feature**: `002-product-detail-api`  
**Date**: 2026-11-25  

Validation guide for the frontend-only integration described in [spec.md](spec.md). Data shapes are in [data-model.md](data-model.md); endpoint and module contracts are in [contracts/product-detail-api.md](contracts/product-detail-api.md) and [contracts/frontend-module.md](contracts/frontend-module.md).

---

## 1. Prerequisites

- Node.js 22 or newer and npm
- A reachable Backend-SWE API exposing the endpoints in `docs/openapi.json`
- A published product UUID with at least one variant
- Modern browser with dev tools (Chrome/Chromium recommended)

No new environment variables or dependencies are required.

---

## 2. Setup

```bash
npm install
```

Configure `.env.local` (never commit it):

```dotenv
VITE_API_URL=http://localhost:18081
```

Start the app against the backend:

```bash
npm run dev:api
```

Open `http://localhost:5173/products/<product-uuid>`.

If a backend is unavailable, keep `VITE_API_URL` unset and use the existing local mock plugin (`VITE_ENABLE_MOCK=true`) only for UI smoke checks; it does not validate API mapping.

---

## 3. Automated Gates

```bash
npm run lint
npm run build
```

Expected: no errors/warnings from ESLint and a successful Vite production build. There is no `npm test` script; see `research.md` §6 for why verification is manual.

---

## 4. Validation Scenarios

### A. Successful load
1. Open a valid `/products/<uuid>` URL.
2. In the Network tab, confirm one call each to:
   - `/api/products/<uuid>`
   - `/api/products/<uuid>/reviews?page=0&size=20&sort=createdAt%2Cdesc`
   - `/api/products/<uuid>/rating-summary`
   - `/api/products/<uuid>/similar?limit=10`
3. Confirm no `Authorization` header is sent on any of them.
4. Confirm the page keeps its original layout and displays API name, SKU, price, inventory, images, review text, average score, and count.
5. Confirm original price and star distribution still show the mock values (documented TODOs).

### B. Loading state
1. Throttle the product request in dev tools (e.g. Slow 3G) or delay it with a local stub.
2. Confirm a visible `role="status"` loading message and no partially rendered product sections.

### C. Not found (404)
1. Open `/products/00000000-0000-4000-8000-000000000000` (or any unknown UUID).
2. Confirm a not-found message with a link back to `/products`, not a blank page or the global catch-all page.

### D. Out of stock
1. Use a published product whose selected variant has `status: OUT_OF_STOCK` or `INVENTORY_UNAVAILABLE`, or stub `availableQuantity: 0`.
2. Confirm "Hết hàng" is shown and quantity/buy/cart controls are disabled.
3. Switch to an in-stock variant when one exists and confirm the controls re-enable.

### E. Product error and retry
1. Stub `GET /api/products/{id}` to return 500, or stop the backend.
2. Confirm an error message with "Thử lại" and no stale product content.
3. Restore the backend, click "Thử lại", and confirm the page loads.

### F. Supplementary section failure
1. Stub `/reviews`, `/rating-summary`, or `/similar` to fail while `/products/{id}` succeeds.
2. Confirm the product section still renders and an inline message identifies the failed section.
3. Confirm no global error page replaces the product.

### G. Race safety
1. Navigate quickly between two product detail URLs.
2. Confirm only the latest product is rendered and no aborted request produces an error message.

---

## 5. Manual Verification Record

Because no test runner is configured, record in the PR description:
- product UUID(s) used;
- network responses observed for the four endpoints;
- which of scenarios A–G were exercised;
- `npm run lint` and `npm run build` results;
- screenshots for success, loading, 404, out-of-stock, and error states.
