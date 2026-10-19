# pages/

One component per route, the equivalent of a view in Django. A page decides the layout of a screen and arranges pieces from `features/` and `components/`. It should stay thin, with little logic of its own.

- Name: `CartPage.jsx`, `ProductDetailPage.jsx` (PascalCase, ending in `Page`).
- Each page is registered in `src/App.jsx` with a `<Route path="..." element={...} />`.
- If a page needs data or logic, put that in a hook or API helper inside the matching `features/` folder and call it from here.
