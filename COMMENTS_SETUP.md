# Anonymous comment mode — setup guide

Visitors can turn on **Comment mode** (bottom bar), hover any section, click it, and leave anonymous feedback. Comments are stored in MongoDB and are **only visible to you** on the private admin page.

## What you need from MongoDB Atlas

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. **Database Access** → add a database user (username + password).
3. **Network Access** → allow your IP (or `0.0.0.0/0` for Vercel serverless).
4. **Connect** → “Drivers” → copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your real password (URL-encode special characters).

## Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | Atlas connection string |
| `MONGODB_DB_NAME` | Database name (default: `jane-portfolio`) |
| `ADMIN_SECRET` | Long random string — **only you** use this to view comments |

Optional:

| Variable | Purpose |
|----------|---------|
| `PUBLIC_COMMENT_API_URL` | Only if the site and API are on different domains |

## View your comments (private)

After deploy, open:

```
https://<your-site>/jane-portfolio/admin/comments?key=<ADMIN_SECRET>
```

Bookmark this URL. Do not share `ADMIN_SECRET`.

## Deploy (required for saving comments)

**GitHub Pages is static** — it cannot run `/api/comments` or MongoDB. Deploy the full project to **Vercel** (free):

1. Import `janeh0120/jane-portfolio` on [vercel.com](https://vercel.com).
2. Add the environment variables above in **Project → Settings → Environment Variables**.
3. Deploy. Vercel runs the API routes and admin page.

You can keep GitHub Pages for the old static site, or switch your main URL to Vercel.

## Local development

```bash
cp .env.example .env
# Edit .env with your Atlas URI and ADMIN_SECRET
npm run dev
```

- Comment mode: any page, bottom bar → **Comment mode**
- Admin: `http://localhost:4321/jane-portfolio/admin/comments?key=YOUR_SECRET`

## Data stored per comment

| Field | Example |
|-------|---------|
| `comment` | User’s text |
| `selector` | CSS path to the clicked element |
| `elementLabel` | e.g. `p: “systems thinker”` |
| `pageUrl` | Full page URL |
| `createdAt` | Server timestamp |
| `deviceType` | `desktop`, `mobile`, or `tablet` |
| `os` | `ios`, `android`, or `other` |
| `viewportWidth` | Window width in pixels |

No names or emails are collected (anonymous).
