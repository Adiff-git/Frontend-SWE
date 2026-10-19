# Frontend Conventions

## Folder structure and what goes where

| Folder | Contains | Example |
|---|---|---|
| `src/pages/` | One component per route. Thin: it arranges pieces, with little logic of its own. | `CartPage.jsx` |
| `src/features/<domain>/` | Components, hooks and API helpers specific to one business domain. | `features/cart/CartSummary.jsx` |
| `src/components/` | Generic UI with no business knowledge. Used by several features. | `Button.jsx`, `Modal.jsx` |
| `src/hooks/` | Reusable logic shared across the app. | `useAuth.js`, `useDebounce.js` |
| `src/api/` | The shared API client and endpoint functions that call the backend. | `client.js` |

Domains: `customer` (storefront), `admin` (store administration), `assistant` (AI chat). Add sub-folders per feature inside them as needed (e.g. `features/customer/cart/`).

**Rule of thumb:** build something inside your own feature folder first. Move it to `components/` or `hooks/` only when a second feature needs it.

## Ownership

| Area | Reviewer / owner |
|---|---|
| `features/<domain>/` and its pages | The member who owns that domain |
| `src/components/`, `src/hooks/`, `src/api/` | Frontend lead |
| `App.jsx`, `main.jsx`, config files, `package.json` | Frontend lead |

Anyone may open a PR that changes any folder. Changes to the lead-reviewed areas should be small and mentioned in the group chat. Install new dependencies through a PR, not directly on `main`.

## Git workflow

- Never commit directly to `main`. It is protected and requires a pull request with at least one approval.
- Branch names: `feature/<short-name>`, `fix/<short-name>`, `docs/<short-name>` (e.g. `feature/cart-page`).
- Keep PRs small and focused (one feature or fix). Large PRs are hard to review.
- Pull the latest `main` into your branch before opening a PR.
- A PR is ready when: the app runs, `npm run lint` passes, and the PR description says what changed and how to check it (screenshots for UI changes).
- Review each other's PRs within a day or two, and be kind and specific in comments.
- Commit messages: short, present tense, say what changed ("Add cart summary component").

## Naming

- Components: `PascalCase.jsx`, one component per file, file name matches the component (`ProductCard.jsx`).
- Hooks: `useSomething.js`, and they must start with `use`.
- Non-component JavaScript (API helpers, utilities): `camelCase.js`.
- CSS: one file per component, named after it (`ProductCard.css`). Use specific class names (`product-card__price`) so styles don't clash. Global styles and CSS variables (colors, fonts) go only in `index.css`.
- Use `.jsx` when the file contains JSX and `.js` when it does not.

## Backend and API

- All requests go through the shared client in `src/api/`. Never hardcode URLs, and read the base URL from `import.meta.env.VITE_API_URL`.
- Components don't call `fetch` directly. They use functions from `api/` (or a feature's own API helper that uses the shared client).

## Code style

- Run `npm run lint` and fix warnings, rather than disabling rules.
- Remove unused code, imports and `console.log` before opening a PR.
- Prefer small components. If a component grows past roughly 150 lines, consider splitting it.
- Don't commit `.env`, `node_modules/`, or editor-specific files (`.vs/`, `.idea/`).

## Environment

- Use Node.js LTS (22 or newer).
- Add new environment variables to `.env.example` (with a placeholder value) in the same PR that uses them. Vite only exposes variables starting with `VITE_`.
