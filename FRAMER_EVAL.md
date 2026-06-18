# Framer integration — evaluation (post-MVP)

Use this when deciding whether to move portfolio editing back to Framer after the comment MVP is live.

## Current recommendation

**Stay on Astro + Vercel + Supabase** unless Framer's visual editor becomes a hard requirement after 2–3 months of real comment usage.

## Options (ranked)

### 1. Stay on Astro (simplest)

- Edit copy in `src/data/site.ts`, images in `public/images/`
- Ask Cursor to apply changes; push to deploy
- Comment UI, versioning, and admin already integrated

### 2. Framer public site + review subdomain

- **Framer** hosts the polished portfolio visitors browse day-to-day
- **`review.jane-hou.com`** (or Vercel preview URL) runs this Astro app for comment collection and version review
- Avoids iframe cross-origin problems
- Two URLs to maintain

### 3. Framer + custom code + postMessage (highest cost)

- Framer pages include custom JavaScript that reports clicks to a parent shell
- Required if you want click-to-comment *inside* Framer via an iframe wrapper
- Every Framer redesign may break anchors — use `data-comment-id` in Framer custom attributes

## Why iframe-only Framer failed the MVP cut

Browsers block the outer comment layer from reading or highlighting elements inside a cross-origin Framer iframe. Screenshots and MongoDB do not fix that — you need cooperative scripts on both sides.

## When to revisit

- You are updating the Astro site less than once a month and miss Framer's canvas
- Comment volume justifies a dedicated review workflow (already built in `/admin/review`)
- You have budget for a developer to maintain a Framer ↔ API bridge
