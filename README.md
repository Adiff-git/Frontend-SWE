# Frontend-SWE

Frontend for our electronics store e-commerce web app (Element of Software Engineering course project). It is a single-page app that talks to the backend through its REST API (documented with OpenAPI).

**Stack:** React, Vite, JavaScript, ESLint

## Prerequisites

- [Node.js](https://nodejs.org/) LTS (version 22 or newer; Vite needs 20.19+ / 22.12+). Check with `node -v`.
- npm (comes with Node). Check with `npm -v`.
- Git.

## Getting started

```bash
git clone <repo-url>
cd Frontend-SWE
npm install
cp .env.example .env        # on Windows: copy .env.example .env
npm run dev
```

Then open http://localhost:5173 in Chrome or Firefox.

Edit `.env` to point `VITE_API_URL` at the backend you are using (a teammate's local backend, a mock server, or a shared dev server). Never commit `.env`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Build the production bundle into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Check the code with ESLint |

Run `npm run lint` before opening a pull request.

## Project structure

```
src/
  api/          Functions that call the backend
  components/   Shared, generic UI pieces (Button, Modal, Navbar)
  features/     Code grouped by business domain (cart, admin, assistant...)
  hooks/        Reusable logic shared across the whole app
  pages/        One component per route
  App.jsx       Route table
  main.jsx      Entry point
  index.css     Global styles
```

Each folder has its own README explaining what belongs there. For team rules (ownership, branching, pull requests, naming), see [docs/CONVENTIONS.md](docs/CONVENTIONS.md).