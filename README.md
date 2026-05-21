# Jane Hou — Portfolio

Static replica of [janehou.framer.website](https://janehou.framer.website), built with Astro and Tailwind CSS.

## Customize

Edit **`src/data/site.ts`** for copy, links, projects, and your email (enables the footer copy button).

## Development

```bash
npm install
npm run dev
```

## Deploy (GitHub Pages)

Push to `main` and enable **GitHub Actions** as the Pages source. Live URL:

**https://janeh0120.github.io/jane-portfolio/**

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home — hero, experience, project grid |
| `/about` | About page |
| `/extra` | Extra page |
| `/ixd`, `/gwsk`, `/designchall` | Case studies |

Case study pages include full text content; add images under `public/images/` to match the Framer site visuals.

## Anonymous comment mode

Visitors can enable **Comment mode** (floating bar at the bottom), click any section, and leave private feedback. Comments are saved to MongoDB and only you can read them.

See **[COMMENTS_SETUP.md](./COMMENTS_SETUP.md)** for MongoDB Atlas + Vercel deploy steps.
