# api/

Everything that talks to the backend. The backend's spec is the contract for this folder.

- `client.js`: the shared HTTP client (base URL from `import.meta.env.VITE_API_URL`, shared headers, error handling). All requests go through it.
- Endpoint functions (e.g. `getProducts()`, `login(email, password)`) live here or in a feature's own API helper that uses the shared client.
- Never hardcode URLs, and never call `fetch` directly from a component.
- If an endpoint or field is missing from the OpenAPI spec, ask the backend team to add it rather than guessing.

The frontend lead reviews changes to this folder.
