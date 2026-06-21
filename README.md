# Jane Hou — Portfolio

Portfolio site with anonymous **comment mode** (sidebar feedback, categories, upvotes), **JSON-based content editing**, and **version history**. Built with Astro, Tailwind CSS, Vercel, and Supabase.

## Development

```bash
npm install
npm run dev
```

Open http://localhost:4321/

---

## Editing content

All site copy lives in the **`content/`** folder. Edit these JSON files, save, and refresh the dev server — no component changes needed for most updates.

### `content/site.json`

| Section | What you can change |
|---------|---------------------|
| `name`, `title`, `description`, `email`, `year` | Site identity and meta |
| `logo` | Path to logo under `public/` |
| `links` | External URLs (LinkedIn, resume, etc.) |
| `nav` | Header navigation labels and links |
| `hero` | Home page intro text and project filter tags |
| `experience` | Current and previous employers |
| `projects[]` | Project cards on the home page (title, tags, thumbnail, slug) |
| `about` | About page heading and paragraphs |
| `extra.heading` | Extra gallery page title |
| `footer.links` | Footer link labels |

**Project tags** are a JSON array, e.g. `"tags": ["product", "design systems", "internship"]`.

**Project images** are paths relative to `public/`, e.g. `"image": "images/intuit.png"`.

### `content/gallery.json`

Titles, descriptions, and years for items on the **Extra** page. Images are still loaded automatically from `public/images/extra/` — drop new files or folders there, then add matching metadata in this file.

### `content/changelog.json`

Short summaries shown on the **History** page next to each portfolio version. Add an entry **before you deploy**, using the same `label` you will pass to the deploy hook:

```json
{
  "entries": [
    {
      "label": "spring-2026 refresh",
      "summary": "Updated Intuit case study and hero copy."
    }
  ]
}
```

Labels are matched case-insensitively.

### Case studies

Long-form case study pages (`src/pages/des-sys.astro`, `ixd.astro`, etc.) are still edited in Astro for now. When you change section copy, keep existing `data-comment-id` attributes on `<section>` tags so comments stay anchored.

### Images and media

Put files in `public/images/`. Case study images go in `public/images/case-studies/{slug}/`.

---

## Publishing a new version

Each production deploy should create a new **portfolio version** in Supabase. That freezes the deploy URL so you (and visitors) can browse old designs and the comments left on them at `/history`.

### Step-by-step

1. **Edit content** in `content/` (and case study pages if needed).
2. **Add a changelog entry** in `content/changelog.json` with your planned version `label`.
3. **Commit and push** to GitHub (Vercel deploys automatically).
4. **Record the version** after deploy succeeds (see below).
5. **Verify** at `/history` — your new version should appear with its summary and deploy snapshot.

### Recording a version (deploy hook)

Set `DEPLOY_HOOK_SECRET` in Vercel environment variables (and local `.env`).

After each deploy, call:

```bash
curl -X POST "https://YOUR-VERCEL-URL/api/deploy-hook" \
  -H "Authorization: Bearer YOUR_DEPLOY_HOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"name":"spring-2026 refresh","url":"https://YOUR-VERCEL-URL"}'
```

- **`name`** — version label (should match an entry in `content/changelog.json`)
- **`url`** — this deployment’s URL (each Vercel deploy has a unique URL; use the one from the Vercel dashboard for that deployment)

The hook also reads `VERCEL_URL` and `VERCEL_GIT_COMMIT_SHA` automatically when run on Vercel.

#### Automate with a Vercel webhook (recommended)

1. Vercel → **Project → Settings → Webhooks**
2. Add a webhook for **Deployment Succeeded**
3. URL: `https://YOUR-VERCEL-URL/api/deploy-hook`
4. Add header: `Authorization: Bearer YOUR_DEPLOY_HOOK_SECRET`

Or use a GitHub Action that calls the hook after Vercel deploy completes.

### How versions and comments work

- **Live site** — visitors leave comments on the current (active) version only.
- **History** (`/history`) — browse past versions; comments from each era stay on that version’s snapshot.
- When you redesign, old comments do **not** move to the new layout — open the archived version to see them in context.

---

## Comment mode setup

See **[COMMENTS_SETUP.md](./COMMENTS_SETUP.md)** for Supabase + Vercel deploy steps.

## Admin (private)

- All comments: `/admin/comments?key=YOUR_ADMIN_SECRET`
- Version review (admin iframe): `/admin/review?key=YOUR_ADMIN_SECRET`

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home — hero, experience, project grid |
| `/about` | About page |
| `/extra` | Extra gallery |
| `/history` | Portfolio version timeline and archived snapshots |
| `/des-sys`, `/ixd`, `/designchall`, `/gwsk` | Case studies |

## Environment variables

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_SECRET=your-long-random-secret
DEPLOY_HOOK_SECRET=another-long-random-secret
```

## Deploy

**Vercel (recommended)** — full site + API + comments + version history. Free Hobby tier + free Supabase.

**GitHub Pages** — static mirror only; comments and version history require Vercel.

## Framer?

See **[FRAMER_EVAL.md](./FRAMER_EVAL.md)** if you are considering moving the portfolio back to Framer.
