# features/

Code grouped by business domain. Each sub-folder holds everything specific to that part of the store: its components, hooks and API helpers.

```
features/
  customer/     storefront: catalog, search, cart, checkout, orders, reviews
  admin/        store administration: products, stock, orders, sales overview
  assistant/    AI shopping assistant chat UI
```

Add sub-folders inside a domain when it grows (e.g. `customer/cart/`).

- Build new things here first. Move something to `components/` or `hooks/` only when a second feature needs it.
- Each domain has an owner who reviews PRs for it (see `docs/CONVENTIONS.md`).
- Pages for a domain live in `src/pages/` and import their pieces from here.
