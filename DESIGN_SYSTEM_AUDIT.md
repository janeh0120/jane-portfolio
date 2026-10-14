# Design system audit

Case study material: a critique of the portfolio's design system against Google's DESIGN.md
format, what was changed in response, and the before/after numbers. Audit run 9 October 2026 on the
`design-system-edits` branch.

## Context

The site already had a design system: colour tokens named by role with a full dark palette, one
typeface (TeX Gyre Heros), one corner radius, and a `/design-system` page showing every component
state. To make it legible to AI coding agents, it was written up as a [DESIGN.md](DESIGN.md), the
open format from Google Labs (`@google/design.md`), which pairs machine-readable tokens with written
rationale and lints the result, including WCAG contrast.

Writing the system down exposed the gap between the documented system and the shipped site.

## Verdict

The foundations were clear and well chosen, and the main pages held to them. The drift was at the
edges, in comment mode, Play, and the case study reels, which were built later or separately, and
in rules that existed only as habits and were never written down (a pill shape, a "label" text
style, a spacing scale), so each new page invented its own version.

### What was working

- **Role-based colour tokens** (ink, muted, fill, hover) with a full dark palette: the "name by
  purpose, not hue" approach the spec recommends.
- **One typeface and one corner radius**, with a rule for nested corners (a shell's radius is the
  inner radius plus its padding, so the curves share a centre).
- **Every component state documented** on `/design-system`: hover, pressed, focus, disabled.
- **Restraint:** blue reserved for focus and selection; one call to action (Leave feedback).

### Critique, most important first

1. **No spacing scale.** The biggest gap. Padding, margin and gap used dozens of different literal
   values, mixing px and rem (0.35rem, 0.4rem, 0.45rem, 0.6rem, 0.75rem, 0.85rem, 9px, 10px, 12px…).
   The spec treats spacing as a core token group; without one, every component picks its own number,
   which is most of why things feel slightly off between pages.
2. **An undocumented pill.** The written rule was "one 8px radius, no pills", but the segmented
   toggles on Brand, Play, and About all used `999px`. The About toggle was copied from Brand's,
   which shows how an unwritten pattern spreads.
3. **A type ramp larger than documented.** Beyond the four documented steps: an intro size
   (`clamp(1.75rem, …, 2.5rem)`) shared by the homepage and Brand, a medium-weight "label" style used
   28 times, a 600 weight in comment mode, and one-off sizes (0.8125rem, 13.5px, 14.5px, 17.5px).
   Four weights against a rule of two.
4. **A second blue.** Comment mode's pinned highlight used `rgb(79 140 255)` rather than the accent
   `#246cff`, and a popover chip used the accent as a text colour, outside its focus/selection role.
5. **Ad-hoc shadows.** The rule was "dropdown menus only"; in practice comment cards, the comment
   popover, and Brand's toggle each had their own shadow values.
6. **Play's overlay hard-coded black and white.** The overlay is dark in both modes, so fixed
   colours are right, but they were scattered (`#000`, `#333`, and several opacities) rather than
   named. About 150 lines of Play CSS (`.play-hero`, `.play-button`, `.play-footer`,
   `.gallery-title`) were no longer used anywhere.
7. **Contrast.** Subtle grey `#919191` measured about 2.8:1 on the page background while carrying
   real information (years in the experience list, comment metadata, column headers). WCAG AA needs
   4.5:1 for small text.
8. **Documentation drift.** `/design-system` labelled `--color-canvas` (white) as "Page background";
   the page background is `--color-page` (#f0f0f1), and canvas is the card colour.

### How to keep it consistent

1. **Token first.** If a value isn't a token, add it to `global.css` and DESIGN.md, or use an
   existing one.
2. **`/design-system` is the contract.** Nothing ships in a page that isn't shown there first.
3. **Automate drift detection.** `scripts/check-design-tokens.mjs` flags literal spacing, raw
   colours, off-token radii and shadows, and stray font weights; `npx @google/design.md lint
   DESIGN.md` validates the spec and contrast.
4. **Exempt illustrations.** The case study reels have their own palette by design; they are
   excluded from the checks rather than forced into the tokens.

## Numbers

Measured with `node scripts/check-design-tokens.mjs` (reels exempt).

| Check | Before | After |
| --- | --- | --- |
| Literal spacing values | 253 uses, 64 distinct | 0 |
| Raw colours outside the token file | 48 uses, 36 distinct | 0 |
| Off-token corner radii | 10 uses | 0 |
| Ad-hoc shadows | 7 uses, 7 distinct | 0 |
| Font weights outside 400/500/700 | 5 uses | 0 |
| **Total** | **323** | **0** |

The "after" column counts three documented exemptions as allowed rather than fixed: the case study
reels and the specular Leave feedback button (illustration and WebGL code that need literal
values), and two lines of Feedback case study artwork marked `design-tokens-ignore`. DESIGN.md
lints with no errors before and after; its remaining warnings are "token never referenced" notices
for border and accent colours, which the format has no component property to express.

## What changed

1. **Spacing scale.** Twelve tokens on a 4px grid (`--space-1` to `--space-24`, 4px to 96px),
   deliberately the same steps as Tailwind's spacing classes so markup (`mt-3`) and CSS
   (`var(--space-3)`) share one scale, plus two section gaps. 230 declarations were converted;
   values off the grid snapped to the nearest step (most commonly 10px → 12px, 0.35rem → 4px,
   0.45rem → 8px, 1.75rem → 32px). The nav bar's inset moved from 0.6rem to 8px, so its corner,
   derived from the inset, went from about 18.1px to 16.5px.
2. **Pill made official.** `--radius-pill` (999px), reserved for segmented toggles, now used by all
   three toggles.
3. **Type ramp written down.** Six styles instead of four: Intro became a shared `.text-intro`
   class (it had been copied between the homepage intro and Brand), and Label (body + medium) was
   documented as a style. Every 600 weight became 500, and the About page's one-off sizes moved
   onto the ramp.
4. **One blue.** Comment mode's highlight tints are now mixed from the accent. On closer
   inspection, the popover chip's use of the accent was correct (it marks the selected element
   being commented on, which is a selection), so it stayed and the selection rule now names it.
5. **Two shadow levels.** `--shadow-raised` and `--shadow-floating` replace four ad-hoc shadows.
6. **Overlay tokens.** Seven fixed tokens for the always-dark media overlay replace scattered
   black and white values; 165 lines of unused Play CSS were deleted.
7. **Contrast.** Subtle grey went from #919191 (about 2.8:1) to #6b6b6b (4.5:1 or better on page,
   canvas, and surface). Dark mode's subtle already passed (about 5.5:1).
8. **Documentation.** `/design-system` was rebuilt to follow DESIGN.md's structure (Colors,
   Typography, Layout with the spacing scale, Elevation, Shapes, Components, Motion, Do's and
   don'ts), the colour list now covers every token grouped by role, and the "Page background" label
   points at the right token.

Guardrails added: `npm run check:design` runs the token checker and the DESIGN.md linter, and
`CLAUDE.md` tells coding agents to read DESIGN.md and run the check before finishing UI work.

## Round 2: component audit

The token checker can only see values. A second pass inventoried every interactive element and
repeated pattern on the site and compared it with the documented components, prompted by a gap
that review caught: the Play carousel wasn't documented, and the overlay's close button didn't
match the other close buttons.

### Findings

| Where | Problem | Fix |
| --- | --- | --- |
| Play and About overlay close | A custom 40px black button with a "×" text glyph and a 0.3s transition, unlike every other close button (24px dismiss icon control, 14px icon, 0.15s) | Now the standard dismiss icon control with a new `.is-on-overlay` variant: identical size, padding, icon, and hover rotation |
| Play carousel arrows | Custom 40px buttons, undocumented | Standard icon controls with `.is-on-overlay`; documented with the dots and caption as the media overlay |
| Segmented toggles (Brand, Play, About) | Three copied implementations of the same control | One shared `.segmented` component with `.is-glass` and `.is-on-overlay` variants; pages only position it |
| Footer colour mode menu | A near-copy of the dropdown trigger without its pressed state or chevron | Now the dropdown trigger itself |
| Comment upvote | A one-off outlined button that coloured its text with the accent | A tertiary button with a new documented `.is-selected` state (Accent soft fill, ink text) |
| Comment tabs | Focus ring in Accent soft, inactive text in Subtle | Standard Accent focus ring; Muted text |
| Dropdown menu options | No visible keyboard focus | Accent focus ring, inset |
| Section nav links | Undocumented, no visible keyboard focus | `.section-nav-link` with the Accent focus ring; documented |
| History page "Live" label | Uppercase, letter-spaced text found nowhere else | A tag |
| ProjectGrid, ProjectCard, SocialLinks | Unused components that could mislead future work | Deleted |

### Documentation added

`/design-system` and DESIGN.md now cover every component in use: the selected button state, the
on-overlay icon control, the segmented toggle (all three variants), the media overlay and carousel,
the section nav, comment cards, and a Patterns section for recurring layouts (project card, media
tile, experience list, case study figure, quote card, footer card, floating bar).

### Left as is, on purpose

- **The reels and the specular Leave feedback button** keep their own styling (illustration and
  WebGL code; exempt from the token checks with a stated reason).
- **Admin pages** (`/admin/*`) are private tools and weren't audited for visual consistency.
- **`LogoScrollIntro`** is commented out on the homepage rather than deleted, since it may come back.
- **Migration's statement styles** repeat the Heading values to override the case study layout's
  paragraph size; a cleaner fix is to stop that layout rule matching `.heading`.

### Follow-up: the overlay follows the colour mode

Review of round 2 questioned why the media overlay was the one surface that ignored the colour
mode. Its backdrop is now the page colour (`--color-overlay` points at `--color-page`), which
removed six overlay-only colour tokens and two component variants: the close button and the
light/dark toggle are now the plain dismiss control and default segmented toggle, and only the
carousel arrows, which float over the image, keep a variant (`.is-on-media`, glass). The slide
dots moved from on top of the image to below it, so they never sit over the artwork.

### Follow-up: nothing on top of the image, and motion into the overlay

- **Arrows:** the carousel arrows now match the close button: standard icon controls with no
  backdrop, moved out from over the image into a row below it, either side of the slide dots. That
  removed the last overlay-specific variant (`.is-on-media`), so the overlay is built entirely from
  default components.
- **Backdrop:** the page colour at 88% instead of solid, so the gallery shows faintly behind and the
  overlay reads as a layer over the page rather than a new page.
- **Motion:** the clicked image now grows from its place on the page into the centre of the overlay
  as the backdrop fades in, and shrinks back on close, on both Play and About. It's one shared
  module (`src/lib/media-morph.ts`) instead of logic inside the Play page, and the backdrop is its
  own layer so the fade works with any page colour in either mode.

### Follow-up: an Inspect mode that proves it

The component previews on `/design-system` became specimens (no longer clickable or focusable) with
a Preview / Inspect toggle. In Inspect mode, hovering any part of a component outlines its box,
shades its padding, and lists the tokens behind its fill, text, type, border, padding, gap, radius,
and shadow, like Figma's dev mode. The breakdown is computed live from the real styles against every
token in `global.css`, so it can't drift from the code, and any value that isn't a token is flagged.

Its first sweep inspected 102 elements and flagged five values the token checker couldn't see,
because they were derived rather than typed: the primary icon control's hover fill (a one-off
`color-mix`, now the `--color-ink-hover` token), the count tag's 6px padding (off the 4px grid, now
`space-2`), the inactive slide dot (a one-off tint, now Placeholder), and line heights on the
segmented toggle and comment text that matched no type style (now Control and Body). It also
caught comment titles set in 14px bold, outside the type ramp (now Label). After the fixes: 102
elements, 0 flags.

### Follow-up: text sat high in controls

Labels in buttons, dropdowns, and the segmented toggle looked higher than centre, while tags looked
right. Measured, every one of those controls had its capitals 1.98px above centre; the tag was
0.07px off. The cause was the font, not the components: TeX Gyre Heros reserves 0.73em above the
baseline (exactly its cap height) and 0.22em below, so any line box centres capitals about 0.11em
high. The tag only escaped because it trims its text box to the cap height. Rather than patching
each component's padding, the `@font-face` rules now override the font's ascent and descent so the
space above the capitals matches the space below the baseline. Every control moved to within 0.2px
of centre at once, in every browser, with no change to any component's height.

### Follow-up: one icon control size, and a tighter scope

- **Icon control:** variants had different sizes (32px standard, 24px dismiss with a 14px icon) and
  comment mode resized its delete button again (44px on touch, with a −2.5px nudge). Every variant
  is now one size defined by padding: a 16px icon with `space-2` on each side and the corner radius
  (32px; a 20px icon on phones for 36px). Pages no longer resize it.
- **Scope:** upvoting belongs to the public comments view, which is turned off, so its button state
  was taken out of the documented system rather than kept as a documented one-off.
- **Order:** text buttons are shown Secondary, then Tertiary, matching their emphasis.

### Follow-up: type became tokens too

Inspect mode exposed that type was the one part of the system without tokens. It recognised
"Control" or "Body" only by comparing values, because components set `font-size`, `line-height`,
`font-weight`, and `letter-spacing` by hand: about 160 declarations across the shared components,
comment mode, the case study layout, and individual case study pages, some repeating the Heading
values because a layout rule overrode them.

Each style is now one token holding weight, size, line height, and family (`--type-display` …
`--type-count`), with `--tracking-tight` / `--tracking-body` and three weight tokens. Writing them
down surfaced two styles that existed only as habits: **Compact** (body size at 1.35, used by every
control and by dense lists) and **Quote** (Migration's pull quotes). The case study layout no
longer overrides type-ramp classes, so three pages dropped their copies of Heading, and 72 lines of
unused comment-mode CSS were deleted. The token checker now flags any directly set type property
(0 remain, apart from the iOS 16px field exception and `@font-face` descriptors), and Inspect mode
names the `--type-*` token behind every component's text.

### Follow-up: spacing that was written but never applied

Asking for more room under a component card showed that the gap didn't move at all. The type-ramp
classes (`.text-body`, `.heading`, `.subheading`, `.text-intro`, `.hero-copy`) each reset
`margin: 0` in the utilities layer, after Tailwind's own utilities, so any margin class on the same
element (`mt-3 text-body`) lost. 112 margin classes on text were silently ignored, 89 of them on the
design system page (every intro under a section title sat flush against it). Tailwind's base layer
already zeroes margins, so the resets were removed: the spacing written in the markup now applies,
and the text below a card sits one step further away (`space-10`) than the card sits below its
intro (`space-8`).

### Follow-up: the comment card showed one state of a mix

The design system page showed a single comment card that matched neither real variant: the
read-only card's category tag with the editable card's delete button (which is invisible until
hover, so the specimen looked like it had none). The card actually has two variants with ten states
between them: your own comment (default, hover, text hover, active, editing, error) and read-only
(default, hover, active, plus the admin review's details line). The page now shows all ten, built
from the real classes, with `is-hover` demo states added to the shared CSS. Showing them surfaced a
missing style: the admin details line was styled only in the admin stylesheet, so it moved into the
shared comment-mode CSS.

### Follow-up: the colour mode switch eases in instead of snapping

Switching between light and dark repainted every token in a single frame, a hard flash at odds with
the site's otherwise soft motion. The switch now runs as a view transition: the new mode rises from
the bottom of the screen behind a soft gradient edge, and three backdrop-blur bands ride that edge,
reusing the edge blur's idea of stacked, masked blur strengths, so the page warps where the two
modes meet. It's a new Motion rule (DESIGN.md and the Motion section of `/design-system`), built
only from the colour tokens it is switching between. Reduced motion and browsers without view
transitions keep the instant switch. The token checker stays at 0.
