# hooks/

Reusable logic shared across the whole app, written as custom React hooks (functions whose names start with `use`). Files here are plain `.js` (no JSX).

Examples: `useAuth.js` (logged-in user, login, logout), `useDebounce.js` (wait until the user stops typing before searching).

- If logic is used in only one place, keep it in that component.
- If it is specific to one domain (e.g. cart logic), put it in that domain's folder under `features/` instead.
- Hooks start with `use` and live one per file.

The frontend lead reviews changes to this folder.
