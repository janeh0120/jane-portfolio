# Jane Hou's portfolio

## Design system

Read [DESIGN.md](DESIGN.md) before any UI or styling work, and follow it: colour roles, the type
ramp, the single corner radius, component states, motion, and the do's and don'ts.

- `src/styles/global.css` is the source of truth for tokens and shared classes. If DESIGN.md and the
  CSS disagree, the CSS wins. When you change a token or a shared component, update DESIGN.md in the
  same change.
- Use the role tokens (`--color-ink`, `--color-fill`, ...), never raw hex, so dark mode
  (`html.theme-dark`) keeps working. Check changes in light and dark mode.
- Every component state is shown on `/design-system` (`src/pages/design-system.astro`). Add new
  components and states there too.
- No literal spacing, colours, radii, shadows, or type (font size, line height, weight, letter
  spacing): use the tokens. Run
  `npm run check:design` before finishing UI work. It runs `scripts/check-design-tokens.mjs` (should
  report 0) and lints DESIGN.md (no errors; "never referenced" warnings for the border and accent
  colours are expected, since the format can't express borders or focus rings). Mark a genuine
  exception with a `design-tokens-ignore: <reason>` comment.

- Skills: follow `.claude/skills/use-design-system` for any UI work, and
  `.claude/skills/update-design-system` for any change to the system itself (it also updates
  DESIGN.md and the `/design-system` page).

## Project

- Astro with Tailwind v4 and React islands. Site copy, projects, and experience live in
  `content/site.json`; the Play gallery in `content/gallery.json`.
- Dev server: `npm run dev` (port 4321). `npm run build` first checks media file sizes.
- Pages scroll inside `#site-canvas`, not the window. Scroll listeners and scroll-driven code need to
  use that element.
- Respect `prefers-reduced-motion`, and keep content visible if JavaScript fails.
