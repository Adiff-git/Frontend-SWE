# Administration interaction contract

Status: approved for development preview; live authorization and mutations remain unavailable.

- Admin preview is compiled only for development. Production keeps `AdminBoundary` closed regardless of mock flags.
- Preview data is synthetic, isolated from authentication and server caches, and resets on reload. Each save must identify its preview-only effect.
- Runtime CSS tokens in `src/index.css` remain canonical. Admin uses the existing brand, fonts and semantic colors; no storefront rebrand.
- Reuse Button, FormField and Dialog. Extend their explicit variants rather than duplicating controls per screen.
- Full-page create/edit returns to the owning list with non-sensitive filters, sorting and pagination preserved. Inspector edits remain in context.
- Customer/contact and review-content searches remain transient, outside URLs and persistent storage.
- Tables use native semantics, bounded pagination and button-based sortable headers. Filter changes reset pagination.
- Validation identifies affected fields, focuses the first error and retains drafts on failure. Cancel or navigation must not silently discard dirty forms.
- Confirm deactivation and stock adjustments. Preserve historical references; permanent deletion is outside this milestone.
- Dialogs require title/description, protected focus, background inertness, Escape rules and focus restoration. Native select/date controls own their platform popups.
- Use one notification owner with live announcements and persistent inline error recovery. Distinguish pending, failed, conflicted and unknown outcomes.
- Document scrolling belongs to forms. Table overflow stays in its own labeled region. Navigation becomes an accessible drawer on narrow screens.
- Vietnamese UI, tabular VND amounts and day/month/year dates. Preview rules and sample timestamps must never be represented as confirmed production policies.

Implementation ownership and evidence are recorded in `tasks/admin-ui-ux/plan.md` and the implementation report as each slice lands.

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
| --- | --- | --- | --- | --- |
| Select/Listbox | Native select, FormField select wrapper | UX-CONTRACT.md | Native platform popup, controlled value | Admin browser checks and keyboard navigation |
| Date | Native date/datetime-local inputs | UX-CONTRACT.md | ISO values; native display; UTC+7 promotion interpretation | Date range and invalid-period browser checks |
| Form | FormField, domain validators | UX-CONTRACT.md | Create/edit, native select/textarea | Validation and draft recovery browser checks |
| Toast | AdminProvider notice and AdminWorkspace live region | UX-CONTRACT.md | Preview success, dismissible | Rendered save flow |
| CRUD | Admin routes, mutate, useDraftNavigation | UX-CONTRACT.md | Full-page return; inspector stay; in-memory Back recovery | Admin full-flow browser checks |
| Scrollbar | Global index.css baseline | DESIGN.md | Internal table overflow with visible native scrollbar | Narrow layout and keyboard region checks |

An object saved in the preview is not published to storefront APIs. Sensitive contact/content searches remain local state. Report periods and non-sensitive list state may be encoded in URLs. Unknown mutation outcomes never produce a success notice.
