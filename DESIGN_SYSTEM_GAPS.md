# Design system gap audit

October 28, 2026. An audit of `DESIGN.md`, `src/styles/global.css`, `/design-system`, and every public
page, using what a fully specified system like Rift DS covers as the checklist (token layers, colour
roles, status colours, elevation, layering, motion, borders, breakpoints, component states,
accessibility, dark mode). Nothing has been changed yet; pick what to fix.

## What already holds up

- The token checker reports 0 across spacing, colour, radius, shadow, type, and (now) motion.
- No page restyles a shared component; pages only position them.
- Every colour token has a dark value or a stated reason it doesn't (accent, on-accent,
  media-backdrop, the Inspect colours; `ink-hover` and `overlay` are mixed from tokens that do).
- At phone width (375px), none of the 14 public pages scrolls sideways, and none logs a console
  error.
- Every image has alt text, and the DESIGN.md contrast lint passes for every component.
- Most interactive components have hover, pressed, focus, and disabled states, and
  `/design-system` shows them.

## High: the system's own rules are broken

All three are fixed (see the last entry in `DESIGN_SYSTEM_AUDIT.md`).

**1. Three controls missed the accent focus ring. Fixed.** DESIGN.md says every focusable element
shows a 2px Accent outline. The nav logo, Play's gallery tiles, and the carousel dots showed the
browser's default ring instead, because there was no global `:focus-visible` rule and each
component had to opt in. A base-layer `:focus-visible` rule now gives anything without its own
style the accent ring.

**2. Two comment-mode fields had a faint or missing focus state. Fixed.** The category dropdown,
in both the sidebar card and the popover, showed only its hover fill (plus, in the sidebar, the 12%
Accent soft ring) on focus, so keyboard focus looked like hover. Both now show the accent ring. The
popover's compose field removed its outline and had no focus style, so the popover card now takes
the editing state's Accent border and soft ring while you type. (The first pass of this audit also
listed the sidebar's comment text field. That was wrong: it already has a 1px Accent border while
editing.)

**3. About and Play had no headings. Fixed.** Neither page had an `<h1>`, or any heading, so
screen reader users couldn't jump to the content. Both now have a visually hidden `<h1>` ("About
Jane", "Play"), and DESIGN.md records the one-`<h1>` rule.

## Medium: parts of the system that aren't specified

**4. Layering (z-index) has no scale.** 26 z-index values, 21 of them distinct, across 11 files,
from -1 to 10201: the nav is 50, the media overlay 3000 to 3010, the grain 9998, comment mode 10040
to 10060, menus 10100, Inspect 10200. Nothing overlaps wrongly today, but the order lives only in
people's heads. Fix: a `--layer-*` scale (base, raised, sticky, overlay, comment mode, menu, grain,
inspect), documented in Elevation & Depth, plus a checker rule.

**5. Border widths are half tokenised.** Only the 0.5px hairline is a token (`--border-width`).
1px (14 uses: dividers, inputs, cards, quote cards) and 2px (the comment mode accent ring) are
typed directly. Fix: `--border-width-hairline` (0.5px), `--border-width` (1px), `--border-width-ring`
(2px), and a checker rule.

**6. Breakpoints in the code don't match the doc.** DESIGN.md lists 768, 900, and 1024px. The code
also uses 640px (9 uses, Tailwind's `sm`, mostly on `/design-system`) and 480px (once). Fix: either
add 640px to the documented set, or move those uses to 768px.

**7. Hover fades use four different amounts.** Media tiles fade to 90%, the history badge to 80%,
and the nav logo and some links to 70%, all typed directly. Fix: one `--opacity-hover` token, or
document why each differs.

**8. There are no status colours beyond danger.** There's a success state already, "Copied" on the
footer's email button, but it has no colour or token and isn't in DESIGN.md or on
`/design-system`. Rift keeps info, positive, warning, and error as a separate set. For a portfolio,
danger alone may be right, but say so: add a line to Colors saying it's deliberate, and document
the Copied state under Components.

**9. Missing states.** Measured from the shared CSS:

| Component | Missing |
| --- | --- |
| Carousel dot | hover, pressed, focus (see 1) |
| Segmented toggle | pressed, disabled |
| Section nav link | pressed |
| Dropdown option | pressed |
| Comment card | loading (posting), and the empty sidebar isn't shown on `/design-system` |

None of these is broken, but "every interactive component has hover, pressed, focus, and disabled"
(DESIGN.md, Components) isn't true yet.

**10. There's no primitive layer under the colour roles.** Roles like `--color-fill` and
`--color-border` are set straight to hex, in light and dark. A grey scale underneath (grey-50 to
grey-950, with the roles pointing at it) is the structure Rift and most mature systems use. It
makes the ramp's steps visible, and a tint or new mode becomes one change. This is optional and the
biggest change on the list.

## Low: cleanup and doc drift

**11. Dead tokens and classes:**

- `--color-link`: defined in light and dark, the same as ink, and never used.
- `.surface-card`: defined in `global.css`, never used.
- `.font-serif`, `--font-serif`, `--font-instrument`: aliases of the one sans family, unused.
- `--radius-sm`, `-md`, `-lg`, `-xl`: all 8px so Tailwind's `rounded-*` classes stay on the one
  radius. Only `rounded-full` is documented. Add one line saying all of them are.

**12. Blur radii aren't tokens.** Glass blur is 40px (6 uses), the colour mode bands 4, 12, and
28px, and a demo 6px. They're documented, but a `--blur-glass` token would stop drift.

**13. Doc formatting.** Elevation & Depth has a stray blank gap after the shadow levels, where
the Floating bars, Grain, and Borders bullets follow with no subheading. DESIGN.md also doesn't
list `project-card` or `about-card`, which are shared classes (the Project card and Media tile
patterns cover them in prose).

## Suggested order

1. ~~Focus rings and the comment field focus (1, 2), plus headings (3).~~ Done.
2. Layering and border-width tokens with checker rules (4, 5), the same move as motion.
3. Breakpoints, hover opacity, and status colours (6, 7, 8): mostly decisions, then a line in
   DESIGN.md each.
4. Missing states on `/design-system` (9).
5. Cleanup (11 to 13).
6. Primitive colour layer (10), if you want the system to read as fully layered for the case study.

## How this was checked, and what wasn't

- Doc against code: a script compared every colour token in `global.css` (light and dark) with the
  DESIGN.md front matter and dark-mode table, and every shared class with DESIGN.md and
  `/design-system`.
- Code scan: z-index, border widths, breakpoints, opacity, blur, and Tailwind arbitrary values
  across `src/` (reels and the specular button excluded, as in the token checker).
- States: every hover, pressed, focus, disabled, and selected selector per shared component.
- Pages: all 14 public pages in the dev server, with keyboard focus on every focusable element (by
  page), heading structure, alt text, console errors, and sideways overflow at 375px. Text contrast
  was sampled in light and dark mode on all of them.
- Not covered: the admin pages (they need a sign-in), screen reader testing, and automated contrast
  on content that is hidden until it scrolls in or sits over a WebGL fill or a sliding thumb (the
  Leave feedback label, segmented toggles). Those showed false positives, and on screen they read
  fine.
