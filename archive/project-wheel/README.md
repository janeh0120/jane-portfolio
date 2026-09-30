# Curved project wheel (archived)

The homepage's original project layout: cards travel along a large arc as you scroll, pinned
beside the intro. Replaced by a straight vertical column with a lens warp at the top and
bottom of the screen.

Archived from commit `1816889` (the version that was live on the site).

## Files

- `ProjectWheel.astro`: the wheel component (markup, arc styles, scroll-driven rotation script).
- `index.astro`: the homepage that pins the wheel (`.home-stage` height is based on the number of projects).

## Restore

1. Copy `ProjectWheel.astro` back to `src/components/ProjectWheel.astro`.
2. Copy `index.astro` back to `src/pages/index.astro` (or re-add `<ProjectWheel />` and the
   `.home-stage` / `.home-stage-pin` styles).
3. Or restore both straight from git:

   ```bash
   git checkout 1816889 -- src/components/ProjectWheel.astro src/pages/index.astro
   ```
