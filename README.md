# Jane Hou — Portfolio

Portfolio site with anonymous **comment mode** (sidebar feedback, categories, upvotes). Built with Astro, Tailwind CSS, Vercel, and Supabase.

## Customize

Edit **`src/data/site.ts`** for copy, links, projects, and your email.

## Development

```bash
npm install
npm run dev
```

Open http://localhost:4321/

## Comment mode setup

See **[COMMENTS_SETUP.md](./COMMENTS_SETUP.md)** for Supabase + Vercel deploy steps (no custom domain required to start).

## Admin (private)

- All comments: `/admin/comments?key=YOUR_ADMIN_SECRET`
- Version review: `/admin/review?key=YOUR_ADMIN_SECRET`

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home — hero, experience, project grid |
| `/about` | About page |
| `/extra` | Extra gallery |
| `/ixd`, `/gwsk`, `/designchall` | Case studies |

## Deploy

**Vercel (recommended)** — full site + API + comments. Free Hobby tier + free Supabase.

**GitHub Pages** — static mirror only; comment saving requires Vercel.

## Framer?

See **[FRAMER_EVAL.md](./FRAMER_EVAL.md)** if you are considering moving the portfolio back to Framer.
