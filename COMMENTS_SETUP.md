# Anonymous comment mode — setup guide

Visitors can enable **Comment mode**, click any section, and leave feedback. Comments are stored in **Supabase** and are only visible to you on private admin pages (unless visitors switch to **All** to read and upvote others' comments on the same page).

## 1. Supabase (database)

You already have a Supabase account. In your project:

1. Open **SQL Editor** → **New query**
2. Paste and run [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql)
3. Go to **Project Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL` (base URL only, e.g. `https://xxxxx.supabase.co` — **not** `.../rest/v1`)
   - **service_role** key (secret) → `SUPABASE_SERVICE_ROLE_KEY`

Never put the service role key in client-side code or Git.

## 2. Local environment

Create `.env` in the project root:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_SECRET=your-long-random-secret

# Optional — for recording deploy versions (phase 3)
DEPLOY_HOOK_SECRET=another-long-random-secret
```

## 3. Run locally

```bash
npm install
npm run dev
```

- Site: http://localhost:4321/
- Comment mode: bottom/sidebar toggle on any page
- Admin list: http://localhost:4321/admin/comments?key=YOUR_ADMIN_SECRET
- Version review: http://localhost:4321/admin/review?key=YOUR_ADMIN_SECRET

## 4. Deploy to Vercel (no custom domain required)

You can launch on the free **`.vercel.app`** URL before buying a domain.

1. Push this repo to GitHub
2. Import the project at [vercel.com](https://vercel.com)
3. Add the same environment variables under **Settings → Environment Variables**
4. Deploy

Your live URLs will look like:

- `https://jane-portfolio-xxxx.vercel.app/`
- Admin: `https://jane-portfolio-xxxx.vercel.app/admin/comments?key=YOUR_ADMIN_SECRET`

**GitHub Pages cannot run the comment API** — use Vercel for the full app.

### Optional: record a new portfolio version after deploy

Call your deploy hook (set `DEPLOY_HOOK_SECRET` on Vercel):

```bash
curl -X POST "https://YOUR-VERCEL-URL/api/deploy-hook" \
  -H "Authorization: Bearer YOUR_DEPLOY_HOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://YOUR-VERCEL-URL","name":"v1.0"}'
```

This creates a new `portfolio_versions` row and marks it active. Use **Admin → Version review** to open that deployment beside its comments.

## 5. Custom domain (later)

When you buy a domain (e.g. `jane-hou.com`):

1. Vercel → **Project → Settings → Domains** → add domain
2. Add the DNS records Vercel shows at your registrar
3. No code changes required

## Data stored per comment

| Field | Example |
|-------|---------|
| `comment` | User's text |
| `category` | accessibility, content, visual-design, bug |
| `elementDisplayName` | `Project card · Greenwich Skatepark` |
| `selector` | `[data-comment-id="project-gwsk"]` |
| `pageUrl` | Full page URL |
| `scrollY` | Scroll position when submitted |
| `version_id` | Portfolio version at submit time |
| `deviceType`, `os`, `viewportWidth` | Anonymous device info |

## Visitor experience

- **Mine** — comments from this browser session (editable in sidebar)
- **All** — everyone's comments on this page (read-only, +1 to agree)
- No accounts; visitors cannot edit comments from a previous visit
