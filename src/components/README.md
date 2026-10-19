# components/

Shared, generic UI pieces with no business knowledge: `Button`, `Modal`, `Navbar`, `Spinner`, `ProductCard` (if used in many places).

- One component per file, with its own CSS file next to it (`Button.jsx`, `Button.css`).
- Components receive everything through props. They do not call the API directly.
- Changes here affect every feature, so keep PRs small and mention them in the group chat. The frontend lead reviews them.
- If a component only makes sense for one domain (e.g. cart totals), it belongs in `features/` instead.
