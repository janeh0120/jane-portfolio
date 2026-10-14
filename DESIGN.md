---
version: alpha
name: Jane Hou Portfolio
description: >-
  A quiet, type-led portfolio. Neutral greys, one grotesque typeface, one corner radius, and a
  4px spacing grid, and a single blue reserved for focus and selection. Light, dark, and system
  colour modes.
colors:
  # Light mode. Dark-mode values are in the Colors section below; src/styles/global.css is the
  # source of truth for both.
  primary: "{colors.ink}"
  page: "#f0f0f1"
  canvas: "#ffffff"
  ink: "#111111"
  # Ink eased toward canvas, for the primary control on hover. (In CSS: color-mix(in srgb,
  # var(--color-ink) 82%, var(--color-canvas)).)
  ink-hover: "#3c3c3c"
  muted: "#555555"
  subtle: "#6b6b6b"
  line: "#f0f0f0"
  surface: "#f5f5f5"
  fill: "#ebebeb"
  hover: "#e0e0e0"
  hover-subtle: "#f5f5f5"
  border: "#e8e8e8"
  border-strong: "#e0e0e0"
  hairline: "rgb(17 17 17 / 8%)"
  glass: "rgb(255 255 255 / 72%)"
  glass-hover: "rgb(255 255 255 / 82%)"
  placeholder: "#c8c8c8"
  accent: "#246cff"
  # Text and icons on an accent fill (the primary button); white in both colour modes.
  on-accent: "#ffffff"
  accent-soft: "rgb(36 108 255 / 12%)"
  danger: "#b42318"
  danger-soft: "#fef2f2"
  # The media overlay (Play, About): the page colour at 88%, so it follows the colour mode and the
  # page shows faintly behind. (In CSS: color-mix(in srgb, var(--color-page) 88%, transparent).)
  overlay: "rgb(240 240 241 / 88%)"
  # Solid black behind embedded video (letterboxing), in both modes.
  media-backdrop: "#000000"
  # /design-system Inspect mode only, in Figma's dev-mode colours: measurements and callout pins.
  measure: "#f24822"
  on-measure: "#ffffff"
  pin: "#14ae5c"
typography:
  # Display, intro, heading and subheading scale with the viewport (CSS clamp); these are the
  # largest sizes. Body and label are fixed.
  display:
    fontFamily: TeX Gyre Heros
    fontSize: 3.625rem
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.04em
  intro:
    fontFamily: TeX Gyre Heros
    fontSize: 2.5rem
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.04em
  heading:
    fontFamily: TeX Gyre Heros
    fontSize: 2.375rem
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.04em
  subheading:
    fontFamily: TeX Gyre Heros
    fontSize: 1.25rem
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: -0.04em
  quote:
    fontFamily: TeX Gyre Heros
    fontSize: 1.25rem
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: -0.04em
  body:
    fontFamily: TeX Gyre Heros
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: -0.01em
  label:
    fontFamily: TeX Gyre Heros
    fontSize: 0.875rem
    fontWeight: 500
    lineHeight: 1.65
    letterSpacing: -0.01em
  compact:
    fontFamily: TeX Gyre Heros
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: -0.01em
  tag:
    fontFamily: TeX Gyre Heros
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1
    letterSpacing: -0.01em
  count:
    fontFamily: TeX Gyre Heros
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1
rounded:
  none: 0px
  base: 0.5rem
  menu: 12.5px
  panel: 16.5px
  pill: 999px
spacing:
  # A 4px grid, the same steps as Tailwind's spacing classes (space-3 = mt-3 = 0.75rem).
  space-1: 0.25rem
  space-2: 0.5rem
  space-3: 0.75rem
  space-4: 1rem
  space-5: 1.25rem
  space-6: 1.5rem
  space-8: 2rem
  space-10: 2.5rem
  space-12: 3rem
  space-16: 4rem
  space-20: 5rem
  space-24: 6rem
  section: 7rem
  section-mobile: 5.5rem
  inset: "{spacing.space-1}"
  bar-inset: "{spacing.space-2}"
  max-site: 1400px
  max-case-study: 768px
  max-about: 672px
components:
  button-primary:
    # Leave feedback, the one primary call to action
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.compact}"
    rounded: "{rounded.base}"
    padding: "{spacing.space-3}"
  button-secondary:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.ink}"
    typography: "{typography.compact}"
    rounded: "{rounded.base}"
    padding: "{spacing.space-3}"
  button-secondary-hover:
    backgroundColor: "{colors.glass-hover}"
    textColor: "{colors.ink}"
  button-tertiary:
    # Transparent at rest; listed as the page it sits on so contrast is checked correctly.
    backgroundColor: "{colors.page}"
    textColor: "{colors.muted}"
    typography: "{typography.compact}"
    rounded: "{rounded.base}"
    padding: "{spacing.space-3}"
  button-tertiary-hover:
    backgroundColor: "{colors.hover}"
    textColor: "{colors.ink}"
  icon-control:
    # Transparent at rest; listed as the page it sits on so contrast is checked correctly.
    # Every variant is one size: a 16px icon with space-2 on each side (32px).
    backgroundColor: "{colors.page}"
    textColor: "{colors.muted}"
    rounded: "{rounded.base}"
    padding: "{spacing.space-2}"
    size: 32px
  icon-control-hover:
    backgroundColor: "{colors.hover}"
    textColor: "{colors.ink}"
  icon-control-dismiss:
    # Transparent at rest; listed as the page it sits on so contrast is checked correctly.
    backgroundColor: "{colors.page}"
    textColor: "{colors.muted}"
    rounded: "{rounded.base}"
    padding: "{spacing.space-2}"
    size: 32px
  icon-control-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.base}"
    size: 32px
  icon-control-primary-hover:
    backgroundColor: "{colors.ink-hover}"
    textColor: "{colors.canvas}"
  icon-control-destructive-hover:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger}"
  dropdown-trigger:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.ink}"
    typography: "{typography.compact}"
    rounded: "{rounded.base}"
    padding: "{spacing.space-3}"
  dropdown-trigger-hover:
    backgroundColor: "{colors.hover}"
    textColor: "{colors.ink}"
  dropdown-menu:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.menu}"
    padding: "{spacing.inset}"
  dropdown-option-hover:
    backgroundColor: "{colors.hover-subtle}"
    textColor: "{colors.ink}"
    rounded: "{rounded.base}"
  tag:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.ink}"
    typography: "{typography.tag}"
    rounded: "{rounded.base}"
    padding: "{spacing.inset}"
  tag-count:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.ink}"
    typography: "{typography.count}"
    rounded: "{rounded.base}"
    padding: "{spacing.inset}"
  text-link:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
  text-link-pressed:
    textColor: "{colors.muted}"
  card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.base}"
    padding: "{spacing.space-10}"
  nav-bar:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "{spacing.bar-inset}"
  segmented-toggle:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.muted}"
    typography: "{typography.compact}"
    rounded: "{rounded.pill}"
    padding: "{spacing.space-1}"
  segmented-toggle-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.pill}"
  label:
    backgroundColor: "{colors.page}"
    textColor: "{colors.subtle}"
    typography: "{typography.label}"
  overlay:
    backgroundColor: "{colors.overlay}"
    textColor: "{colors.ink}"
  overlay-caption:
    backgroundColor: "{colors.overlay}"
    textColor: "{colors.muted}"
  carousel-dot:
    # Active dot; inactive dots use placeholder.
    backgroundColor: "{colors.ink}"
    rounded: "{rounded.base}"
    size: 8px
  embedded-video:
    backgroundColor: "{colors.media-backdrop}"
    textColor: "{colors.canvas}"
  page:
    backgroundColor: "{colors.page}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
  page-secondary-text:
    backgroundColor: "{colors.page}"
    textColor: "{colors.muted}"
  focus-selected:
    # accent-soft (12% accent) flattened onto canvas, so contrast is checked correctly.
    backgroundColor: "#e5edff"
    textColor: "{colors.ink}"
---

# Jane Hou Portfolio

The portfolio of Jane Hou, a product designer: "I care about people and want to design around
them." This file describes the design system for coding agents and collaborators. The live
implementation is `src/styles/global.css` (tokens and shared classes), and the `/design-system`
page shows every token and component state. When this file and the CSS disagree, the CSS wins;
update this file to match.

## Overview

Quiet, editorial, and type-led. The work (case study media, gallery images) carries the colour;
the interface stays out of the way in near-white and near-black neutrals. Everything is set in
one grotesque typeface, every control and card shares one corner radius, all spacing sits on a 4px
grid, and blue appears only for focus, selection, and the one primary call to action. A fine film-grain texture sits over the whole page so flat greys
feel printed rather than digital.

The tone is warm but restrained: personal copy, small type, generous space, and motion that is
quick and physical (things press in, menus slide) rather than decorative. The site supports
light, dark, and system colour modes, and every decision has to hold up in both.

## Colors

The palette is neutral greys plus one accent and one error colour. Tokens are named by role, not
by hue, so the same names work in dark mode.

- **Page (#f0f0f1):** the background of every page, a cool off-white.
- **Canvas (#ffffff):** cards, menus, and other raised surfaces sit on pure white.
- **Ink (#111111):** primary text, headings, and the one filled primary control. This is the
  `primary` token.
- **Muted (#555555):** secondary text: body copy, captions, roles, resting tertiary buttons.
- **Subtle (#6b6b6b):** labels (years in the experience list, column headers, metadata) and
  disabled text. It passes WCAG AA (4.5:1 or better) on Page, Canvas, and Surface; it was
  darkened from #919191 (about 2.8:1) after the audit in `DESIGN_SYSTEM_AUDIT.md`.
- **Ink hover:** the primary (ink-filled) control on hover, ink eased toward the canvas.
- **Line, Surface, Fill, Hover, Hover subtle, Border, Border strong:** the grey ramp for dividers,
  panels, control fills at rest, hover and pressed fills, and outlines.
- **Hairline (8% ink):** the 0.5px border on the nav bar, comment cards, and page frame.
- **Glass (white at 72%, 82% on hover):** floating bars and secondary buttons, always with
  `backdrop-filter: blur(40px) saturate(1.5)`.
- **Accent (#246cff):** three jobs only: focus rings (2px outline, 2px offset), selected states
  (comment mode's highlighted target and active tab), and the fill of the one primary button,
  Leave feedback. Accent soft (12%) is the matching selected fill; lighter tints are mixed from the
  accent (`color-mix(in srgb, var(--color-accent) 8%, transparent)`), never a different blue. It
  is never a link colour or decoration, and no other button uses it.
- **On accent (#ffffff):** text and icons on an accent fill. White in both colour modes (Canvas,
  which sits on Ink fills, turns dark in dark mode, so it can't do this job). White on the accent is
  4.5:1, just meeting WCAG AA, so keep on-accent text at body size or larger.
- **Danger (#b42318) and Danger soft:** destructive hovers and errors.
- **Overlay:** the media overlay on Play and About is the page colour at 88%, so it follows the
  colour mode, the page shows faintly behind it, and everything on it uses the ordinary text and
  control tokens. `media-backdrop` (black) is only for letterboxing embedded video.

### Dark mode

Dark mode swaps every value under `html.theme-dark` (set from the Light / Dark / System menu).
Accent, on-accent, and `media-backdrop` are unchanged; `overlay` follows `page` (still at 88%).

| Token | Dark value |
| --- | --- |
| page | #141414 |
| canvas | #1c1c1c |
| ink | #f3f3f3 |
| muted | #a8a8a8 |
| subtle | #8d8d8d (5.5:1 on the dark page) |
| line | #2a2a2a |
| surface | #262626 |
| fill | #303030 |
| hover | #4a4a4a |
| hover-subtle | #262626 |
| border | #3a3a3a |
| border-strong | #4a4a4a |
| hairline | white at 12% |
| glass | rgb(28 28 28 / 78%), 88% on hover |
| placeholder | #5c5c5c |
| danger | #ff8d85 |
| danger-soft | #3a1d1b |

The grain overlay switches from `multiply` at 35% to `overlay` at 18%, and text selection becomes
white at 16% instead of black at 8%.

## Typography

One family, **TeX Gyre Heros** (a Helvetica-style grotesque, self-hosted), falling back to
Helvetica, Helvetica Neue, and Arial. Its `@font-face` rules override the font's vertical metrics
(`ascent-override: 95%; descent-override: 22%`): the font reserves its cap height above the
baseline but 0.22em below, which sat text about 0.11em high in every line box. Don't remove the
overrides, or labels in buttons, dropdowns, and toggles drift above centre again.

Type is set only through tokens in `global.css`. Each `--type-*` token holds weight, size, line
height, and family, and is applied as `font: var(--type-body)` with its letter spacing,
`--tracking-tight` (-0.04em, the bold display styles and quotes) or `--tracking-body` (-0.01em,
everything else). The few places that change only the weight use `--weight-regular`,
`--weight-medium`, or `--weight-bold`. Never set `font-size`, `line-height`, `font-weight`, or
`letter-spacing` directly; `scripts/check-design-tokens.mjs` flags it.

- **Display (`--type-display`, `.hero-copy`):** the largest headline, 2.5rem up to 3.625rem, bold.
- **Intro (`--type-intro`, `.text-intro`):** the intro line (when shown large) and Brand's project
  titles, 1.75rem up to 2.5rem, bold.
- **Heading (`--type-heading`, `.heading`):** page titles and case study statements, 1.625rem up to
  2.375rem, bold.
- **Subheading (`--type-subheading`, `.subheading`):** section and project titles, 1rem up to
  1.25rem, bold.
- **Quote (`--type-quote`):** pull quotes, subheading size at regular weight with a 1.35 line height.
- **Body (`--type-body`, `.text-body`):** everything else, including body copy, captions, metadata,
  and nav, at a fixed 14px with 1.65 line height. Also the page default on `body`.
- **Label (`--type-label`, `.text-body` + `font-medium`):** labels above values, column headers,
  comment titles, and the current nav link; body size at weight 500.
- **Compact (`--type-compact`, `.text-compact`):** body size with a 1.35 line height, for controls
  (buttons, dropdowns, the segmented toggle, menus) and dense text (the experience list, project tag
  lines, status messages, and the homepage intro, so it reads as one block with the list).
- **Tag (`--type-tag`):** body size at line height 1; tags also trim their text box to the cap
  height so the padding looks even.
- **Count (`--type-count`):** 12px medium at line height 1, with tabular figures.

The only weights are 400, 500, and 700; there is no 600. The one exception to the sizes is 16px
on comment form fields on touch screens, which stops iOS zooming the page when they're focused.

## Layout

- **Spacing scale:** every padding, margin, and gap uses `--space-N`, where N × 4px is the value:
  1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24 (4px to 96px). These are the same steps as Tailwind's
  spacing classes, so `mt-3` in markup and `var(--space-3)` in CSS mean the same 12px. Don't type
  literal spacing values; `node scripts/check-design-tokens.mjs` flags them. Negative values
  (optical nudges) and em values (padding that scales with text) are allowed.
- **Page frame:** content sits in `.page-frame`, max 1400px wide with a 1.5rem gutter on each side
  (1rem below 768px).
- **Reading widths:** case studies max 768px, the About page 672px.
- **Section rhythm:** page sections are separated by one parent gap (`.section-stack`):
  `--space-section` (7rem), or `--space-section-sm` (5.5rem) below 768px. Prefer that gap over
  margins on individual sections.
- **Case studies and the design system page** use a 200px sticky sidebar (back link and section
  nav) beside the content from 1024px up. From 768px up the back button sticks level with the nav
  bar, centred on the same line (`--header-offset` + `space-2`); on phones it sticks just below it.
- **Homepage:** the intro (Compact type, in Ink) and work experience at the top, as one left-aligned
  block centred on the page at the expanded nav bar's width (`--nav-bar-width`, published by the
  header; the full page width on phones), then the case
  studies in one full-width row, padded so the first card is centred on load and the last is
  centred when the row ends. Scrolling down moves the row sideways first and the page only
  continues to the footer once the last card is in view; scrolling up rewinds the row first. Touch
  and sideways swipes scroll the row directly. A WebGL lens warps and colour-splits the cards at the
  left and right edges (skipped for reduced motion), and the progressive edge blur (`EdgeBlur`),
  at the top and bottom on every other page, runs down the left and right sides instead; without JavaScript it is a plain sideways row.
- **Breakpoints:** 768px (tablet), 900px (comment sidebar stacks), 1024px (desktop).
- **Insets:** `--space-inset` (4px) for menu and tag padding; `--bar-inset` (8px) between a
  floating bar's edge and its controls.

## Elevation & Depth

Mostly flat. Hierarchy comes from tone (white Canvas cards on the grey Page), hairline borders,
and the grain texture. There are exactly two shadow levels:

- **Raised (`--shadow-raised`, `0 2px 8px rgb(0 0 0 / 6%)`):** things that lift slightly off the
  page: comment cards, the Brand page's light/dark toggle.
- **Floating (`--shadow-floating`, `0 12px 32px rgb(0 0 0 / 14%)`):** things that float over
  content: dropdown menus and the comment popover.

Focus-style rings (`0 0 0 2px var(--color-accent-soft)`) aren't elevation and are allowed. The
case study artwork may use its own shadows, marked in the CSS with `design-tokens-ignore`.


- **Floating bars** (nav, footer card, secondary buttons) use Glass with a 40px backdrop blur and
  a hairline border, so content shows through as they float.
- **Grain:** a fixed SVG noise overlay covers the page (35% multiply in light mode).
- **Borders:** 0.5px for the nav bar, comment cards, and page frame; 1px for dividers, inputs, and
  cards.

## Shapes

One corner radius, **0.5rem (8px)**, for every control, card, image, and tag. `none` (0) is for
full-bleed frames only. Tailwind's `rounded-full` is also 8px here.

The one exception is **Pill (`--radius-pill`, 999px)**, reserved for segmented toggles (Light /
Dark on Brand and Play, Web / Problems on About). Nothing else is pill-shaped.

When a shell wraps a nested control, the shell's radius is the inner radius plus the padding
between them (plus the border), so both curves share a centre:

- **Menu (12.5px):** 8px + 4px inset + 0.5px border.
- **Panel (16.5px):** 8px + 8px bar inset + 0.5px border, for the nav bar and footer card.

Both are tokens (`--radius-menu`, `--radius-panel`) computed from the corner, so they stay in step
if it changes.

## Components

All components live in `src/styles/global.css` (and `src/components/` for the Astro and React
ones). Every interactive component has hover, pressed, focus, and (where relevant) disabled
states, shown side by side on `/design-system`. Its Inspect mode, styled like Figma's dev mode, outlines
the hovered element, marks its padding with red measurements, and shows a callout card of the
tokens it's built from, flagging any value that isn't a token. `measure`, `on-measure`, and `pin`
are used only there.

- **Leave feedback button (primary):** the site's one call to action, a specular button (React,
  `SpecularButton`) that invites visitors to comment on the page. Filled with Accent, label in
  On accent in Compact type, with the same padding and focus ring as the other buttons and corner
  radius. Its WebGL shine is always on: an accent glow that circles the edge (as a halo just
  outside it, never over the fill) and turns toward a nearby pointer. It holds still for reduced motion,
  pauses off screen, and is off when the button is disabled. The shader needs real colour values,
  so it reads them from the tokens at runtime.
- **Text buttons (`.button`):** for lower-emphasis actions like Back. Secondary (Glass with a
  hairline border) when it floats over content; tertiary (muted text, no fill until hover) when
  the button sits in the page flow.
- **Icon control (`.icon-control`):** for actions where the icon speaks for itself, like opening
  the menu. Every variant is the same size: a 16px icon with `space-2` padding and the corner
  radius, 32px square (a 20px icon on phones, for a 36px touch target). Pages never resize it.
  Variants: dismiss (rotates 90° on hover), primary (ink fill, for the one main action in a
  surface), destructive (danger hover).
- **Dropdown (`.dropdown-trigger`, `.dropdown-menu`):** for picking one option from a short list,
  like a comment's category or the colour mode (the colour mode menu, `ThemeMenu`, is a dropdown
  trigger with the current mode's icon; it sits in the footer, opening upward, and under the
  `/design-system` intro, opening downward, and every copy stays in step). Fill at rest, Hover when hovered or open; the menu is Canvas with a
  sliding highlight behind the options, and options show the accent focus ring.
- **Tag (`.tag`):** a static label that matches the dropdown trigger without the chevron, for a
  value that can't be changed. `.tag.is-count` for a number beside a label.
- **Segmented toggle (`.segmented`):** one shared component for every two-option switch (Light /
  Dark on Brand and Play, Web / Problems on About). A pill track with a thumb that slides to the
  option with `aria-pressed="true"`. Default is a Fill track with an Ink thumb (also on the media
  overlay, which is the page colour); `.is-glass` when it floats over media. Pages only add
  placement.
- **Media overlay and carousel:** Play and About open images in the same overlay, on a backdrop in
  the page colour at 88%: the standard dismiss icon control to close it; below the image, a row with standard icon-control arrows either side of 8px slide dots
  (inactive in Placeholder; the active one stretches to 24px, in Ink); a muted caption; and the default segmented toggle for
  images with light and dark versions. Nothing sits on top of the image. The clicked image grows
  out of its spot on the page into the centre as the backdrop fades in, and shrinks back on close
  (`src/lib/media-morph.ts`). A YouTube link as a slide becomes a 16:9 player (privacy-enhanced
  embed, corner radius, Media backdrop) that loads only when shown and unloads when you leave it.
  Styles live in `src/styles/play.css`.
- **Section nav (`.section-nav-link`):** the sidebar list on case studies and `/design-system`,
  muted links that turn ink on hover, with the accent focus ring. The section you're reading is
  marked `.is-current` (`aria-current="location"`): its label turns ink and a 3px ink dot grows in
  before it over 0.2s, sliding the text over by `space-2`. A group's links are indented
  under it with a 1px line.
- **Comment card:** comment mode's card (Canvas, 0.5px border, corner radius) with the category,
  the element it's about (Label; click it to pin the element), and the comment (Body). Two variants:
  - *Your comment* (This page): the category is a dropdown you can change, a destructive dismiss
    deletes it (shown on hover, always on touch), and clicking the text edits it. States: hover
    (Border strong and `shadow-raised`; the text shows Hover subtle behind it), active / pinned
    (Accent border with a 2px Accent soft ring), editing (the text becomes a field with the same
    ring), and an error under the field in Danger on Danger soft.
  - *Read-only* (All comments, and the admin review): the category is a tag and nothing is
    editable. States: hover, active; the admin review adds a Subtle line with when and on what
    device it was left (`.comment-sidebar-card-meta`).
  (Upvoting belongs to the public comments view, which is turned off, and isn't part of the
  documented system.)
- **Links (`.text-link`):** underlined at 40% ink, full ink on hover, muted when pressed, medium
  weight with a full underline for the current page.
- **Section label (`.section-label`):** the pretitle that opens every case study section, on its
  `<h2>`: Body type in Muted, `space-3` above the content. Don't use tags or other styles as
  pretitles.
- **Status labels:** use a tag (for example "Live" on `/history`), not uppercase or letter-spaced
  text.
- **Focus:** every focusable element shows a 2px Accent outline with a 2px offset (3px for links).

### Patterns

Recurring layouts built from the tokens and components above; each should look the same wherever
it appears.

- **Project card:** a 16:10 image with the corner radius, a muted tag line, and a subheading title.
- **Media tile:** an image with the corner radius that fades slightly on hover and opens the media
  overlay (Play gallery, About cards).
- **Experience list:** year in Subtle, company as a link, role in Muted; each year shows once.
- **Case study figure:** media with the corner radius and an optional caption in Muted.
- **Quote card:** a Surface panel with a 1px border, the corner radius, and `space-5` padding.
- **Footer card:** a Canvas panel with a hairline border and the panel radius.
- **Floating bar:** hugs its contents, centred (full width on phones). Glass with a 40px backdrop
  blur, a hairline border, the panel radius, and
  controls `bar-inset` from its edge.

## Motion

- **Press:** buttons and dropdown triggers scale to 0.97 when pressed; icon controls to 0.92.
- **Hover:** colour and background transitions run 0.12 to 0.15s.
- **Menus** fade in over 0.12s, and the option highlight slides with
  `cubic-bezier(0.22, 1, 0.36, 1)` over 0.2s.
- **Reveal on scroll:** project cards and case study sections rise 1.5rem and fade in.
- **Nav bar (desktop):** the bar hugs its contents, centred at the top. Scrolling down collapses
  the nav links so only the logo and Leave feedback remain, and the bar narrows with them; any scroll up, the top of the page, or keyboard focus brings them back. The
  links' column eases between its width and nothing over 0.7s (ease in and out) while they fade,
  slower than other transitions so the bar never snaps.
- **Primary button shine:** the Leave feedback glow circles continuously and slowly; never fast
  enough to read as flashing.
- **Media overlay:** the clicked image grows from its place on the page to the centre of the
  overlay while the backdrop fades in (0.46s), and shrinks back on close; skipped for reduced
  motion, off-screen sources, and video previews.
- **Colour mode switch:** picking a mode that changes light or dark rises the new mode in from the
  bottom of the screen to the top over 1.1s (`cubic-bezier(0.45, 0, 0.25, 1)`), behind a soft
  gradient edge. Three backdrop-blur bands (4, 12, 28px) ride that edge, strongest at its centre,
  so the page warps as the modes meet, like the edge blur. It runs as a view transition
  (`theme-wipe` in `global.css`, started by `__setTheme` in `Layout.astro`). Switches that keep the
  same look (System matching the current mode), the OS changing mode on its own, reduced motion,
  and browsers without view transitions change instantly.
- **Larger transitions** (the media overlay, view switches) ease with
  `cubic-bezier(0.3, 0.7, 0.2, 1)` over roughly 0.3 to 0.5s.
- **Reduced motion:** honour `prefers-reduced-motion` everywhere: drop reveals, slides, and
  morphs, and fall back to instant changes. Content must never depend on JavaScript to become
  visible.

## Do's and Don'ts

- Do use the tokens (`--color-ink`, `--space-4`, `--shadow-raised`, ...) rather than raw values,
  so dark mode and spacing stay consistent. Run `node scripts/check-design-tokens.mjs` to catch
  any that slip in.
- Do check every change in both light and dark mode.
- Do keep one corner radius; derive nested radii with the shell formula instead of picking a new
  value.
- Do use Muted for readable secondary text; reserve Subtle for labels and disabled states.
- Don't use the Accent blue for links, decoration, or any button but Leave feedback; it means
  focus, selection, or the primary call to action.
- Don't add shadows outside the two elevation levels.
- Don't introduce a second typeface or new font weights (400, 500, and 700 only).
- Don't use the pill radius for anything but segmented toggles.
- Don't add another primary call to action; Leave feedback is the one.
