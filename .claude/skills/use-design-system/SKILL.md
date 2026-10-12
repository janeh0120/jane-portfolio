---
name: use-design-system
description: Build or change any UI on Jane's portfolio using the existing design system — tokens, shared components, and patterns from DESIGN.md — instead of one-off styles. Use for any new page, section, component, or visual tweak, and before finishing any styling work.
---

# Use the design system

The portfolio has one design system. Every UI change must be built from it, so the site stays
consistent and `/design-system` stays true. If what you need doesn't exist yet, stop and use the
`update-design-system` skill to add it first; don't invent a one-off.

## Sources of truth

- `DESIGN.md` (repo root): the rules, tokens, components, patterns, and do's and don'ts. Read it
  before writing any UI.
- `src/styles/global.css`: the actual tokens and shared component classes. If it disagrees with
  DESIGN.md, the CSS wins (and DESIGN.md needs fixing: tell Jane).
- `/design-system` (`src/pages/design-system.astro`): every component and state, rendered. Open it
  in the preview when unsure how something should look.

## Before you write anything

1. Read `DESIGN.md` in full (it's short), then the parts of `global.css` you'll touch.
2. Find the closest existing component or pattern. Check `/design-system`'s Components and
   Patterns sections, and search `src/` for a similar element already on the site.
3. If nothing fits, don't improvise: switch to the `update-design-system` skill, or ask Jane.

## Rules while building

- **Colours:** role tokens only (`var(--color-ink)`, `text-muted`, `bg-fill`, ...). Never hex,
  `rgb()`, or `white`/`black`. Tints come from `color-mix(in srgb, var(--color-…) N%, transparent)`.
  Blue (`--color-accent`) means focus, selection, or the one primary button (Leave feedback, with
  `--color-on-accent` text); never decoration, links, or other buttons.
- **Spacing:** `var(--space-N)` in CSS (N × 4px: 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24) or the
  matching Tailwind classes (`mt-3`, `gap-6`). Section gaps: `.section-stack` /
  `--space-section(-sm)`. No literal px/rem spacing. Negative nudges and em padding are allowed.
- **Type:** the ramp classes (`hero-copy`, `text-intro`, `heading`, `subheading`, `text-body`,
  Label = `text-body font-medium`) in markup, or in CSS `font: var(--type-…)` plus
  `letter-spacing: var(--tracking-tight | --tracking-body)`. Other styles: `--type-quote`,
  `--type-compact` (controls, dense text), `--type-tag`, `--type-count`. Weight-only changes use
  `--weight-regular | medium | bold`. Never set font-size, line-height, font-weight, or
  letter-spacing directly.
- **Shape:** `var(--radius-base)` everywhere; `--radius-menu` / `--radius-panel` for shells;
  `--radius-pill` only for segmented toggles.
- **Elevation:** `var(--shadow-raised)` or `var(--shadow-floating)` only. Floating bars use glass.
- **Components:** reuse the shared classes and their states instead of restyling:
  `.button` (`is-tertiary`, `is-secondary`, `is-selected`), `IconControl` / `.icon-control`
  (`is-dismiss`, `is-primary`, `is-destructive`, `is-on-media`), `.dropdown-trigger` +
  `.dropdown-menu`, `.segmented` (`is-glass`), `.tag` (`is-count`), `.text-link`,
  `.section-nav-link`, the media overlay (`src/styles/play.css`), and the comment card classes.
  A page's own CSS may position a shared component, never re-skin it.
- **States:** every interactive element needs hover, pressed, and a visible focus ring
  (`outline: 2px solid var(--color-accent); outline-offset: 2px`), plus disabled where relevant.
- **Modes and motion:** must work in light and dark mode; respect `prefers-reduced-motion`; content
  must not depend on JavaScript to be visible.
- **Genuine exceptions** (case study artwork, illustration code) get a
  `/* design-tokens-ignore: <reason> */` comment on the line or the line above. Use sparingly.

## Before you finish

1. Run `npm run check:design`. The token checker must report `Total: 0`; the DESIGN.md lint must
   have no errors ("never referenced" warnings for border and accent colours are expected).
2. If the change touches a component shown on `/design-system`, use its Inspect mode there to
   confirm every value resolves to a token.
3. Check the change in the preview (`astro-dev`) in light **and** dark mode
   (`window.__setTheme('dark')`, then back to `'system'`), and at phone width. Pages scroll inside
   `#site-canvas`, not the window.
4. If you used a component in a new way or noticed `/design-system` doesn't show something you
   relied on, tell Jane and suggest running `update-design-system`.
5. In your summary, name the tokens and components you used, and any exception you added and why.
