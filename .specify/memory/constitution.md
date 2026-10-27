<!--
Sync Impact Report
==================
Version change: 0.0.0 (unratified scaffold) -> 1.0.0
Modified principles: none (scaffold placeholders replaced by initial principles)
Added principles:
  - I. API Contract First
  - II. Feature-Domain Structure
  - III. Quality Gates (NON-NEGOTIABLE)
  - IV. Component and Naming Discipline
  - V. Small, Reviewed Changes
Added sections:
  - Additional Constraints
  - Development Workflow
Removed sections: none
Follow-up TODOs:
  - RATIFICATION_DATE set to 2026-10-26 as the initial adoption date; correct it if the
    constitution was formally adopted on a different date.
  - No automated test framework is configured yet; Principle III requires tests once one is
    introduced.
-->

# Frontend-SWE Constitution

## Core Principles

### I. API Contract First

The backend OpenAPI specification is the contract for all data access. Every request MUST go
through the shared client in `src/api/`, and the base URL MUST be read from
`import.meta.env.VITE_API_URL`. Components MUST NOT call `fetch` or hardcode URLs. Endpoint
functions MUST live in `src/api/` or in a feature's own API helper that uses the shared client.
When an endpoint or field is missing from the OpenAPI spec, the team MUST ask the backend team
to add it rather than guessing the contract in frontend code.

Rationale: a single, spec-backed access path keeps the frontend compatible with the backend,
makes failures traceable to one place, and prevents environment-specific URLs from leaking
into the codebase.

### II. Feature-Domain Structure

Code MUST be organized by business domain under `src/features/` (`customer`, `admin`,
`assistant`), with pages in `src/pages/` kept thin and responsible only for layout and
composition. New code MUST be built inside its feature folder first and moved to
`src/components/` or `src/hooks/` only when a second feature needs it. Generic UI in
`src/components/` MUST NOT contain business knowledge, and shared hooks in `src/hooks/` MUST be
reusable across the app.

Rationale: domain grouping limits coupling, keeps ownership unambiguous, and prevents the
shared folders from becoming a dumping ground.

### III. Quality Gates (NON-NEGOTIABLE)

Every change MUST pass `npm run lint` with warnings fixed rather than rules disabled, and MUST
pass `npm run build`. Unused code, unused imports, and `console.log` MUST be removed before a
pull request is opened. Once an automated test framework is introduced, shared logic in
`src/api/`, `src/hooks/`, and feature modules MUST have tests that run in the project's test
command, and those tests MUST pass before merge. Until then, each pull request MUST document
how the change was verified manually.

Rationale: lint and build failures are cheap to prevent and expensive to discover later;
verification evidence keeps the main branch runnable for every teammate.

### IV. Component and Naming Discipline

Components MUST be `PascalCase.jsx` files with one component per file and a filename matching
the component. Pages MUST end in `Page` (e.g., `CartPage.jsx`). Hooks MUST start with `use`
and live one per file. Files containing JSX MUST use `.jsx`; files without JSX MUST use `.js`.
Each component MUST have its own CSS file named after it, using specific class names
(e.g., `product-card__price`) to avoid collisions. Global styles and CSS variables MUST live
only in `src/index.css`.

Rationale: consistent naming and colocated styles make the codebase predictable and prevent
accidental style and behavior collisions across features.

### V. Small, Reviewed Changes

No one MUST commit directly to `main`; every change MUST arrive through a pull request with at
least one approval. Branches MUST follow `feature/<short-name>`, `fix/<short-name>`, or
`docs/<short-name>`. Pull requests MUST be small and focused on one feature or fix. Changes to
lead-reviewed areas (`src/components/`, `src/hooks/`, `src/api/`, `App.jsx`, `main.jsx`, config
files, `package.json`) MUST be small and announced in the group chat. New dependencies MUST be
introduced through a pull request, not directly on `main`. Commit messages MUST be short,
present tense, and describe what changed.

Rationale: small, reviewed changes are easier to understand, test, and revert, and they keep
ownership and dependency decisions visible to the whole team.

## Additional Constraints

- Secrets and local configuration MUST NOT be committed. `.env`, `node_modules/`, and
  editor-specific files (`.vs/`, `.idea/`) MUST remain ignored.
- Frontend environment variables MUST be treated as public because Vite exposes every
  `VITE_`-prefixed variable in the client bundle. Secrets MUST live only on the backend.
- Every new environment variable MUST be added to `.env.example` with a placeholder value in
  the same pull request that uses it.
- Node.js LTS (22 or newer) MUST be used for development and builds.
- The app MUST remain a single-page React application using Vite, JavaScript, and ESLint as
  defined in `package.json`; stack changes require a constitution amendment.

## Development Workflow

- A pull request is ready for review only when the app runs, `npm run lint` passes,
  `npm run build` succeeds, and the description states what changed and how to verify it,
  including screenshots for UI changes.
- Authors MUST pull the latest `main` into their branch before opening a pull request.
- Reviewers MUST respond within one or two working days and MUST give specific, respectful
  feedback.
- Domain owners review `features/<domain>/` and its pages; the frontend lead reviews
  `src/components/`, `src/hooks/`, `src/api/`, and root configuration.
- `docs/CONVENTIONS.md` and the folder READMEs are the runtime guidance for this
  constitution; when they conflict with it, the constitution prevails.

## Governance

This constitution supersedes all other project practices. Amendments MUST be proposed as a
pull request that changes this file, states the rationale, and is approved by the frontend lead
and at least one other team member. Amendments that change principles or required workflow MUST
include a migration note describing how existing work is brought into compliance.

Versioning follows semantic versioning: MAJOR for backward-incompatible governance or principle
removals or redefinitions, MINOR for new principles or materially expanded guidance, and PATCH
for clarifications and non-semantic refinements. The version line MUST be updated in the same
pull request as the amendment.

Every pull request review MUST verify compliance with the Core Principles. Any complexity or
deviation that cannot be avoided MUST be justified in the pull request description and approved
during review. Compliance is reviewed at each amendment and whenever the team retrospects.

**Version**: 1.0.0 | **Ratified**: 2026-10-26 | **Last Amended**: 2026-10-26
