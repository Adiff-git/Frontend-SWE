# SWE-150 — Finalize Chatbox Design

## 1. Purpose and design basis

Specify a clean, responsive Chạm Tech AI shopping assistant that customers can open while browsing the storefront. This document is the design handoff for implementation; all dimensions and interactions below are specified targets, not claims about an existing implementation.

No approved Figma file, export, or link was found in the repository during inspection. This specification follows the current frontend tokens and conventions; it does not claim Figma approval or compliance. If an approved design becomes available, reconcile it with this specification before implementing visual differences.

### Repository references

| Source | Observed foundation | Design consequence |
|---|---|---|
| `docs/CONVENTIONS.md` and `src/features/README.md` | Domain-first components; `assistant` is an established domain | Place assistant UI in `src/features/assistant/` |
| `src/index.css` | Semantic color variables, system fonts, light/dark theme, shadow | Reuse these variables rather than introducing a separate brand palette |
| `src/components/CustomerLayout.jsx` | Shared storefront frame around an `Outlet` | Mount one assistant beside the main content, outside individual route pages |
| `src/components/CustomerLayout.css` | Plain CSS, specific class names, understated bordered controls | Use scoped component styles and restrained surfaces |
| `src/App.jsx` | Customer routes include `/products/:id`; auth/admin have separate layouts | Show the assistant on customer routes and use existing product detail navigation |
| `src/components/` and customer pages | Layouts and placeholder pages only | No implemented shared Button, Modal, Spinner, or ProductCard is available to reuse yet |
| `package.json` | React 19, React Router 7, Vite, ESLint; no UI or test library | Use native controls and existing dependencies for the future UI |

### Scope

This ticket delivers the component, responsive, styling, and interaction specification plus an implementation checklist. A future UI implementation can demonstrate all states with local fixtures. Backend endpoints, AI responses, streaming, authentication integration, and server-side conversation storage are outside this design handoff.

## 2. Visual composition

The assistant is a quiet floating affordance in the viewport's bottom-right corner. It starts collapsed and opens only after customer action. Keep the storefront visible beside the desktop panel. Use a white/dark semantic surface, purple highlights, subtle border, and the existing shadow; avoid gradients or decorative animation.

### Annotated expanded layout

```text
┌──────────────────────────────────────────┐
│ Assistant icon  Chạm Tech Assistant   [×] │  Header, fixed within panel
│                 AI shopping assistant    │
├──────────────────────────────────────────┤
│ Assistant                                │
│ Hi! What are you shopping for today?      │
│ [Find a laptop] [Explore headphones]      │  Welcome prompts
│                                          │
│                              You         │
│              A laptop for university     │  Scrollable message history
│                                          │
│ Assistant                                │
│ Here are some options to explore.         │
│ ┌──────────────────────────────────────┐ │
│ │ Image  Product name                 │ │
│ │        Price · short explanation    │ │  Stacked recommendation cards
│ │        View product →               │ │
│ └──────────────────────────────────────┘ │
│ [Loading status OR recoverable error]     │
├──────────────────────────────────────────┤
│ Message the assistant                    │  Visible input label
│ [Ask about a product…             ] [↑]  │  Multiline input + send button
│ AI suggestions may be inaccurate.        │  Supporting text
└──────────────────────────────────────────┘
```

The launcher is hidden while the panel is open; the header close button collapses it. Do not render a second floating close control.

### Component anatomy

| Element | Specification |
|---|---|
| Launcher | 56 × 56px round native button; chat icon; accessible name “Open shopping assistant”. Tooltip on hover/focus, with no automatic opening or notification badge |
| Panel | Desktop width 380px, target height 560px, constrained to available viewport; 16px radius; 1px semantic border; existing shadow |
| Header | Minimum 72px high, 16px padding, 12px gap; icon, title, subtitle, and 44 × 44px close button. Use “Close shopping assistant” as the button name; do not imply a live human agent or online status |
| Message area | Flexible remaining height, 16px padding, 12px between message groups; independent vertical scrolling |
| Assistant message | Left aligned, semantic surface with border, 12px radius and padding; visible sender label “Assistant” |
| Customer message | Right aligned, accent-tinted surface with semantic text; visible sender label “You”; maximum 85% of message-area width |
| Welcome | One greeting plus two wrapping prompt buttons. Prompts populate the draft and focus the input; they do not submit automatically |
| Composer | Semantic surface with top border, 16px padding, 8px gaps; input and send control align at the bottom |
| Input | Visible label “Message the assistant”; placeholder “Ask about a product…”; at least 48px tall; grows to four lines, then scrolls internally |
| Send | 44 × 44px minimum native submit button with arrow icon and accessible name “Send message”; visibly disabled when blank or awaiting a response |

Use 16px/1.5 for message and input text, 16px/1.4 at weight 600 for the panel title, and 14px/1.5 for sender labels, subtitle, prices' supporting text, and notices. Keep input text at least 16px on mobile. Use the existing font families, not a new web font.

### Product recommendation cards

- Render recommendations as a semantic list belonging to an assistant response, stacked vertically without a horizontal carousel. Show at most three cards per response in the initial design.
- Each card has a 1px border, 12px radius, 12px padding, and 12px gap. Use a 64 × 64px image with `object-fit: contain` and a flexible content column (`min-width: 0`).
- Include a wrapping product name, localized price, optional short explanation, and one “View product” link to `/products/:id`. The accessible link name must identify the product, for example “View product: Example laptop”.
- Format fixture prices as Vietnamese đồng using `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })`; this is display guidance, not a backend data contract.
- Allow names and prices to wrap rather than truncate essential information. At narrow widths or enlarged text, the image can stack above the content.
- Treat images as decorative (`alt=""`) when the adjacent product name supplies the same information. If an image fails, retain the image footprint with a neutral placeholder; preserve the product name and link.
- When a price is unavailable, show “Price unavailable”. Do not fabricate ratings, discounts, stock claims, or recommendation confidence.
- Use the detail link as the initial shopping action. Maintain the current conversation when navigating between customer routes in the same tab.

## 3. States and interaction contract

Keep visibility (`collapsed` / `expanded`) separate from response status (`idle` / `loading` / `error`). Closing the panel does not erase messages or cancel a pending fixture response. Keep messages and unsent draft in memory while `CustomerLayout` remains mounted; a reload or leaving that layout may reset them. Persistent storage is not required.

| State | Visible UI | Controls and transitions |
|---|---|---|
| Collapsed | Launcher only | Enter, Space, or pointer opens the panel and restores the current conversation. Initial state on a fresh mount |
| Expanded, empty | Header, greeting, prompt buttons, composer | Focus the panel heading on open so mobile does not immediately summon the keyboard. Prompts fill the draft; valid submission enters loading |
| Expanded, conversation | Chronological messages and any product cards | Customers can read, follow product links, write, send, or close |
| Loading | Preserve prior messages, append customer message once, and show “Finding products…” with a small optional animated indicator | Announce status once; disable send and prompts to prevent duplicate requests. Input stays editable for the next draft. Closing remains available |
| Error | Preserve the conversation and show “We couldn't get a response. Please try again.” with a “Try again” button after the failed turn | Stop loading; announce error once; preserve any new draft. Retry reuses the failed turn without duplicating its customer bubble. Submitting a new turn replaces the retry action for the old failure |

### Submission and history behavior

- Trim input for validation; whitespace-only content cannot submit. Preserve deliberate line breaks in messages. Use a 2,000-character UI limit with an associated limit hint and show a remaining count near the limit; this is a proposed UI constraint, not an API requirement.
- Desktop keyboard: Enter submits, Shift+Enter inserts a newline. Do not submit during IME composition. On touch devices, Enter inserts a newline; use the visible send button to submit.
- On a valid submission, clear only the submitted draft and keep focus in the input. Failed delivery never removes the customer message. A later retry must not clear a newly typed draft.
- Show loading text rather than empty fake response bubbles or invented product skeletons. Respect reduced-motion preferences for the indicator.
- When the customer is at the bottom, keep the latest message visible. When they scroll back, preserve their position and show a “New message” button to return to the latest content. Never steal keyboard focus when a response arrives.
- Show a genuine empty recommendation result as helpful assistant text, such as “No matching products found. Try a different budget or category.” It is not a transport error.
- Escape closes the panel when focus is inside it. Closing restores focus to the launcher. Do not dismiss on outside click, so accidental taps do not disrupt shopping or writing.

## 4. Suggested component hierarchy and ownership

```text
src/components/CustomerLayout.jsx
└── ShoppingAssistant                   # src/features/assistant/
    ├── AssistantLauncher
    └── AssistantPanel
        ├── AssistantHeader
        ├── AssistantMessageList
        │   ├── AssistantWelcome
        │   ├── AssistantMessage        # one per customer/assistant turn
        │   │   └── AssistantProductCard[]
        │   ├── AssistantResponseStatus # loading or retryable error
        │   └── New-message control
        └── AssistantComposer
```

- `ShoppingAssistant` owns visibility, draft, fixture messages, response status, and the failed-turn reference. Mount it once beside `<main>` in `CustomerLayout`, so customer navigation does not remount it. Admin/auth layouts do not mount it.
- `AssistantLauncher` receives expanded state, panel ID, and an open callback. Set `aria-expanded` and `aria-controls`; omit the closed panel from the tab order and accessibility tree.
- `AssistantPanel` owns panel semantics, responsive focus behavior, and the layout shell; it receives close behavior and content. A body portal is suitable to avoid future ancestor clipping while retaining layout ownership.
- `AssistantHeader` receives the heading ID and close callback. `AssistantMessageList` receives messages and status and manages scroll position without owning requests.
- `AssistantMessage` receives sender, plain text, and optional recommendations. `AssistantProductCard` receives presentation data and a detail route. These are frontend display props, not an assumed backend schema.
- `AssistantComposer` receives draft value, loading state, and change/submit callbacks. `AssistantResponseStatus` receives response status and retry callback.
- All child components are presentation-focused and make no API calls. Keep fixture response transitions deterministic for UI review. No new provider, shared hook, or request client is needed for the design prototype.
- Use one `PascalCase.jsx` file per component with a matching colocated CSS file. Keep business-specific components in the feature until a second feature needs them; reuse genuine shared primitives if introduced before implementation.

## 5. Responsive behavior

These assistant-specific dimensions and breakpoints are proposed design values. The existing 1024px global typography breakpoint remains the source of inherited page sizing.

| Viewport | Collapsed | Expanded |
|---|---|---|
| Width ≥ 768px | Bottom-right, 24px edge spacing plus safe-area insets | 380px wide; height `min(560px, calc(100dvh - 48px))`, with an equivalent `vh` fallback. Maintain 24px top/bottom clearance and safe-area allowance |
| Width < 768px | Bottom-right, 16px edge spacing plus safe-area insets | Full-width, full-height modal panel; no outer radius; use the available dynamic viewport height, with `vh` fallback and internal safe-area padding |
| Short desktop viewport | Same launcher | Reduce panel height to available space. Keep header/composer visible and let the message area shrink and scroll |

- Size against the viewport, not the centered 1126px `#root`. Use fixed positioning; account for `env(safe-area-inset-right)` and `env(safe-area-inset-bottom)` at floating edges.
- In fullscreen mode, apply safe-area padding at the top and bottom once, without double-counting it in child controls. Use border-box sizing throughout.
- Panel layout is a three-row grid (`auto minmax(0, 1fr) auto`) or equivalent flex layout. Set `min-height: 0` on the message region, contain its overscroll, and keep the header/composer outside it.
- When the mobile keyboard opens, keep the composer within the visible viewport and scroll messages rather than the entire page. Verify on iOS Safari and Android Chrome; use a visual-viewport adjustment if dynamic viewport sizing alone does not handle the keyboard.
- Lock background scrolling and make background content inert only while the mobile modal is expanded. On desktop, the storefront remains interactive.
- At 320px width and 200% zoom, controls and content must remain usable without horizontal scrolling. Prompt buttons wrap; product cards stack when needed. Long URLs and unbroken text use `overflow-wrap: anywhere`.
- Reserve space around the launcher when another fixed storefront control is introduced. Future modal dialogs must layer above the desktop assistant; never obscure a focused checkout action with the launcher.

## 6. Accessibility requirements

- Desktop panel: labeled non-modal `role="dialog"`, without `aria-modal="true"` or a focus trap. Mobile panel: labeled modal dialog with `aria-modal="true"`, contained focus, inert background, and background scroll locking. Update semantics and focus behavior when crossing the breakpoint while open.
- Label the dialog through its visible heading with `aria-labelledby`. Give icon-only controls accessible names; hide their decorative icons from assistive technology.
- On open, focus the heading (`tabIndex="-1"`). On close, restore focus to the launcher. Tab order follows header, conversation links/actions, input, send. Keep all controls reachable with a visible `:focus-visible` outline.
- Expose chronological history as a labeled `role="log"` with polite announcements for newly added messages (`aria-relevant="additions"`). Avoid rereading history on reopen. Use a separate polite status region for loading and an alert for a new error; do not announce the same error through both the log and alert.
- Associate input label and helper text through native labeling and `aria-describedby`. Use native disabled behavior for unavailable send actions and explain loading in the visible status text.
- Maintain at least 4.5:1 contrast for normal text and 3:1 for UI boundaries/focus indicators that communicate state. Sender labels, loading text, and error text convey meaning independently of color.
- Use semantic text for errors instead of inventing an unapproved red token. Keep minimum 44 × 44px pointer targets and adequate gaps between adjacent controls.
- Honor `prefers-reduced-motion: reduce`: remove panel transitions and indicator animation, and avoid smooth autoscrolling. Otherwise keep any panel opacity transition at or below 150ms.
- Render fixture message content as text. Do not introduce HTML injection or a markdown renderer for this UI handoff.

## 7. Styling conventions

### Existing tokens to reuse

| Token | Light value / role | Assistant use |
|---|---|---|
| `--bg` | `#fff`, dark override `#16171d` | Panel, composer, and product surfaces |
| `--text-h` | `#08060d`, dark override `#f3f4f6` | Titles, primary message text, prices, control labels |
| `--text` | `#6b6375`, dark override `#9ca3af` | Secondary copy and sender labels |
| `--border` | `#e5e4e7`, dark override `#2e303a` | Dividers and decorative surface borders |
| `--accent` | `#aa3bff`, dark override `#c084fc` | Icons, accents, and focus treatment |
| `--accent-bg` / `--accent-border` | Theme-aware purple tint / border | Customer bubbles and interactive emphasis |
| `--shadow` | Theme-aware paired shadow | Floating panel and launcher |
| `--sans` / `--heading` | System UI font stacks | Body / title typography |

Do not assume white text on the existing purple accent meets normal-text contrast. Prefer accent-tinted control backgrounds with `--text-h` labels/icons, and verify contrast in both themes. `--border` can remain subtle for decoration; input boundaries and focus rings must use a stronger token such as `--text` where necessary for 3:1 contrast.

### Implementation rules

- Use plain CSS and feature-specific classes such as `.shopping-assistant`, `.assistant-panel__header`, `.assistant-message--customer`, and `.assistant-composer__input`. Do not style bare `button`, `input`, `h2`, or `.layout__*` selectors from feature files.
- Reset the assistant shell to `text-align: left`; `#root` currently centers inherited text. Explicitly set panel heading size/margins because global `h2` rules are intended for page headings.
- Set native controls to inherit the font and apply explicit semantic foreground/background colors, avoiding browser defaults that conflict with `color-scheme: light dark`.
- Use existing color/font/shadow variables. New global CSS variables, if genuinely needed later, belong only in `src/index.css` with light/dark values. The proposed dimensions, 4/8/12/16/24px spacing, and 12/16px surface radii are component styling values, not existing design tokens.
- Use `rem` for text and scalable spacing, while keeping the specified 380px panel width and minimum target sizes predictable across the root font-size change (18px desktop, 16px at ≤1024px).
- No existing z-index scale was found. Proposed assistant layer: `z-index: 100` for its positioned shell; document future overlay relationships rather than escalating arbitrary values. A later shared modal layer must appear above it.
- Use a small inline SVG chat/arrow/close icon with `currentColor`; no icon dependency is required. Provide accessible names on controls, not decorative SVGs.
- Reuse or extract a generic primitive only when a second feature actually uses it, in accordance with team conventions. Keep any future shared-area changes small and lead-reviewed.

## 8. Concise implementation checklist

- [ ] Create the feature components with matching CSS files and mount one assistant in `CustomerLayout`.
- [ ] Apply existing semantic tokens, system typography, scoped classes, and both theme treatments.
- [ ] Build launcher, header, history, labeled composer, send action, and stacked product cards.
- [ ] Demonstrate collapsed, empty, conversation, loading, error/retry, and no-results states with local fixtures.
- [ ] Preserve drafts/history on collapse and customer navigation; prevent duplicate sends/retry bubbles.
- [ ] Implement desktop/non-modal and mobile/modal behavior, focus restoration, keyboard/IME handling, and live announcements.
- [ ] Verify safe areas, short screens, keyboard visibility, long content, image failures, and 200% zoom.
- [ ] Run lint/build, document manual results, and capture desktop/mobile screenshots for UI review.

## 9. Acceptance and verification

### This documentation change

Review the specification against every SWE-150 requirement, confirm repository paths and token values, and check Markdown/diff whitespace with `git diff --check`. Run `npm run lint` and `npm run build` as required by the project constitution. Use Node 22 or newer (Vite's supported minimum for that line is 22.12); record environment blockers rather than claiming successful checks. No test runner or Markdown lint command is configured in `package.json`.

### Future UI implementation

| Check | Expected result |
|---|---|
| Desktop 1440 × 900 and tablet 768 × 1024 | Bottom-right launcher; constrained non-modal panel; customer page remains usable |
| Mobile 320 × 568 and 390 × 844 | Fullscreen expanded panel, safe-area clearance, no horizontal scroll |
| Short viewport and open virtual keyboard | Header and composer stay reachable; messages scroll independently |
| Keyboard-only / IME | Logical focus order, visible focus, correct newline/submission behavior, Escape closes, focus returns |
| Screen reader | Named dialog and controls, sender identity, one announcement per new response/status/error, correct mobile modal behavior |
| Light/dark and reduced motion | Readable surfaces, verified contrast, stable layout, motion disabled when requested |
| Loading / retry fixture | One customer bubble per submission; no duplicate send; preserved history and next draft |
| Long names/messages, missing price/image, no matches | Wrapping layout and meaningful fallback content without fabricated product details |
| Customer route navigation / layout exit | In-layout history retained; no assistant mounted on auth/admin layouts |

Record actual outcomes separately from these expected results. A documentation-only delivery does not establish that browser interactions or accessibility checks have passed.

### Verification recorded for this handoff

- Reviewed the specification against the ticket requirements, referenced source files, token definitions, and route paths.
- Whitespace checks passed: `git diff --check` and `git diff --no-index --check /dev/null docs/SWE-150-CHATBOX-DESIGN.md` (the latter includes the new, untracked document).
- The default Node 18 environment lacked local dependencies. Installed dependencies from the existing lockfile with `npm exec --yes --package=node@22 --package=npm@10 -- npm ci`.
- Lint passed: `npm exec --yes --package=node@22 --package=npm@10 -- npm run lint`.
- Production build passed: `npm exec --yes --package=node@22 --package=npm@10 -- npm run build`.
- Browser, screen-reader, and contrast acceptance checks above remain for the future UI implementation.
