---
name: update-design-system
description: Make a change to Jane's portfolio design system (a token, type style, component, variant, state, pattern, or rule) and carry it through everywhere — global.css, every place on the site that uses it, DESIGN.md, and the /design-system page — then verify. Use when Jane asks to change, add, rename, or remove anything in the design system.
---

# Update the design system

A design system change is only done when four things agree: the CSS, the site, `DESIGN.md`, and
the `/design-system` page. Work through every step; skip one only if it truly doesn't apply, and
say so.

## 1. Pin down the change

- Restate the change in one or two sentences: what changes, why, and what it replaces.
- Read `DESIGN.md` and the relevant part of `src/styles/global.css`.
- Find every current use: `grep -rn` for the token or class across `src/` (CSS, `.astro`, `.tsx`,
  and classes built in scripts, such as in `src/components/CommentMode.astro`).
- If the request is ambiguous in a way that changes the result (which variant, which pages, a
  new token vs. reusing one), ask Jane before editing. Otherwise pick the option that keeps the
  system smallest (reuse before adding) and say what you chose.

## 2. Change the source

- Tokens live in `src/styles/global.css`: colours, radii, shadows in `@theme`; spacing, insets,
  and derived radii (`--radius-menu`, `--radius-panel`) in the `@layer base` `html` block; dark
  values under `html.theme-dark`. Every colour token needs a dark value or a reason it doesn't.
- Shared components and their states live in `global.css` (media overlay and carousel in
  `src/styles/play.css`; comment mode in `src/styles/comment-mode.css`). Keep demo state classes
  working (`is-hover`, `is-pressed`, `is-focus`, `is-disabled`, `is-selected`) so the page can show
  each state.
- Derive instead of hard-coding: nested radii from the shell formula, tints with `color-mix()`
  from a token.

## 3. Carry it through the site

- Update every use found in step 1. Pages may position shared components, never re-skin them; move
  any page-level restyling into the shared component or remove it.
- Remove what the change makes obsolete: old tokens, variants, dead CSS. Search again to confirm
  nothing still references them.

## 4. Update DESIGN.md

- Front matter: add, change, or remove tokens and component entries (keep names in step with the
  CSS variables minus the prefix, e.g. `--space-3` → `space-3`). For components on a translucent
  background, give the contrast check the flattened colour with a comment, as existing entries do.
- Prose: update the matching section (Colors and its dark-mode table, Typography, Layout, Elevation
  & Depth, Shapes, Components and Patterns, Motion, Do's and Don'ts). Keep the section order.
  Patterns, Do's and Don'ts, and the case study Section label live only in DESIGN.md, not on the
  page.

## 5. Update the /design-system page

`src/pages/design-system.astro` mirrors DESIGN.md. Data arrays near the top drive most sections:

| Change | Edit |
| --- | --- |
| Colour token | `colorGroups` (role label + token) |
| Type style | `typeStyles` (token, label, spec, sample) |
| Spacing | `spacing` steps |
| Border, shadow, radius | `borders`, `shadows`, `radii` |
| Motion rule | `motion` |
| New section or component | `sections` (sidebar nav, with `children` under Components) and a new `<section>` |

Keep the page's copy short: one or two plain sentences per section or component saying what it
does, and a few words per list item. The detail belongs in DESIGN.md, not on the page. The page
intro only says it's built with Astro, Tailwind, and React, documented in the DESIGN.md format, and
adapts to light and dark mode.

For a component, add or update its section under Components using the existing markup pattern: a
one- or two-sentence description, then a `showcase-card` with a labelled group per variant and a
cell per state (Default, Hover, Active, Focus, plus Selected / Disabled where relevant), built
with the real component classes and the `is-*` state classes, `tabindex="-1"` on non-default
states. Use `.overlay-demo` (page-colour panel) or `.media-demo` (image behind) when the component
lives on the overlay or over media.

## 6. Verify

1. `npm run check:design`: token checker `Total: 0`, DESIGN.md lint with no errors.
2. `npm run build` succeeds.
3. In the preview (`astro-dev`), open `/design-system` and every page that uses the changed thing.
   Check light and dark mode (`window.__setTheme('dark')`, then `'system'`), phone width, and the
   console for errors. Pages scroll inside `#site-canvas`, so scroll that element to reach a section.
4. On `/design-system`, switch Components to **Inspect** and hover the changed components: every
   row should name a token. Anything shown as "not a token" is a value to fix (or a deliberate,
   documented exemption).
5. Take a screenshot of the updated `/design-system` section as proof.

## 7. Record it

- Add a short entry to `DESIGN_SYSTEM_AUDIT.md` (it's case study material): what changed and why,
  and new before/after numbers if the token checker counts changed. Keep the original critique
  wording intact.
- Summarise for Jane: the change, every file touched, anything visibly different, and anything
  left undone.

Don't commit or push unless Jane asks; she often keeps design system work uncommitted until she's
happy with it.
