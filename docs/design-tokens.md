# Design tokens — Chạm Tech

Values were read from [Figma page `3:8605`](https://www.figma.com/design/lJYIFsi9VAc0FyNDOjdyCh/Cham-Tech-design?node-id=3-8605) on 2026-11-03 and defined in `src/index.css`. These CSS tokens name repeated design values; they are not an export of Figma Variables. Calling `get_variable_defs` on the login frame returned `{}`.

## Reviewed sources

| Frame/node | Reference values |
|---|---|
| `77:19853` — Desktop login | Brand, surfaces, text, fonts, form spacing, control heights, radii |
| `3:9205` — Homepage | Strong brand color, muted text, storefront typography, shadows, spacing/radii |
| `77:20912` — Mobile laptop catalog | 16px mobile gutter, 17/30px font sizes, 1.35 line height |
| `77:20688` — Desktop order administration | Success/warning colors, admin typography and surfaces |
| `77:21362` — Login error notice | Error `#BA1A1A` on `#FFF0EE` |
| `77:21412` — Stock adjustment notice | Warning `#965600` on `#FFF6E8` |

Node `3:8605` is a **page**, rather than a design tokens frame. Request specific child frames when reading design context. The states board `77:21322` is too large for a single response; request its child nodes for complete styling information.

## Usage conventions

- Colors use semantic names: `--color-brand`, `--color-surface`, `--color-text-secondary`, `--color-error-subtle`, etc.
- Typography: body content uses `--font-family-body` (Be Vietnam Pro); headings/buttons use `--font-family-heading` (Manrope). Set button font family/weight in the component; the global `button` rule only inherits the font.
- Size and spacing names represent pixels at a 16px root: `--font-size-14`, `--space-24`. These tokens use `rem` to support user font preferences; radius/control/icon dimensions use `px` to match the design.
- `--line-height-heading/title/label/body` are ratios from the auth/admin/mobile frames. The original storefront uses fixed line heights; use `--line-height-20`, `--line-height-24`, etc. when matching those frames.
- Radii: `--radius-4` through `--radius-24`, plus `--radius-pill`. Pill radii normalize the design's 999/9999px values to 9999px.
- Shared dimensions: 44px controls, 48px buttons, 20px checkboxes, 18/20px icons, and an 80px desktop header. Use `min-height` for controls whose content may wrap.
- Shadows come from the storefront: card, header, popover, overlay and selected variant. This does not imply that every card needs a shadow.
- Existing aliases such as `--text`, `--accent` and `--sans` remain available; new components should use the semantic names above.

```css
.auth-form__input {
  min-height: var(--control-height);
  padding: var(--space-8) var(--space-12);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-8);
  font-size: var(--font-size-14);
  color: var(--color-text);
  background: var(--color-surface-subtle);
}
```

## Implementation notes and limitations

- Auth/admin/mobile use text color `#1D1D1F`; the original storefront uses `#1B1B1D`. Keep `--color-text-storefront` separate to preserve this difference.
- `#0055D6` appears in auth/admin/mobile; `#0040A4` appears in storefront CTAs/links. `--color-brand-strong` is not automatically a hover color: interaction states have not been verified for every component.
- The reviewed design uses a light theme. The scaffold's automatic dark theme was removed so operating system preferences do not change the design colors.
- The scaffold's fixed 1126px root width, border and centered text were removed. Pages/layouts should manage their own content widths and responsive behavior according to their frames; do not guess app-wide breakpoints or maximum widths.
- Fonts load through Google Fonts in `index.html` with `display=swap` and require network access. Before loading, or when offline, the browser uses system fallbacks with potentially different metrics. Font files are not currently self-hosted in this repository.
- The 2px focus outline and 2px offset are an accessibility implementation choice, not a verified Figma token. `--shadow-selection` comes from a selected storefront variant and does not establish the design's focus state.
- This task provides foundations; it does not implement the Figma layouts/pages. The three layout shells still have their previous CSS. Token availability does not establish UI completion or acceptance criteria coverage.
