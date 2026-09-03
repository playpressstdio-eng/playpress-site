# PlayPress Studio — Sveltia CMS Setup Guide

This site uses **Sveltia CMS** — a free, open-source, Git-backed content editor (a modern
drop-in replacement for Decap/Netlify CMS). It reads the same `admin/config.yml`, so the
collections, fields, and repeatable blocks are unchanged.

**What's already in place:** `admin/index.html` loads Sveltia, `admin/config.yml` defines all
editable sections (Home, Samples, Packages, Testimonials, Blog, About, Site Settings).
`build.js` reads your `content/` files and renders the site; new content shows up on the next
build. Sveltia is already wired for the **GitHub backend** (the repo must be public).

---

## Two things you still need to do once

### 1. Make the GitHub repo public
Sveltia's free GitHub auth requires a **public** repository. In GitHub:
**Settings → General → Danger Zone → Change visibility → Make public.**

> No secrets live in the repo (no API keys, no passwords), so this is safe for a marketing site.

### 2. Choose a login method
Sveltia needs a way to authenticate with GitHub. Two options:

**Option A — Personal Access Token (simplest, zero setup, free) — pick this if it's just you.**
1. GitHub → **Settings → Developer settings → Personal access tokens → Tokens (classic)** →
   **Generate new token.** (Or a fine-grained token with **Contents: Read & write** on this repo.)
2. Scope: classic token → tick **`repo`** (full control). Copy it.
3. Visit `https://your-site.pages.dev/admin/`, click **Login with GitHub**, then paste the token.

That's it. No external services, no billing.

**Option B — One-click "Login with GitHub" (needed only if non-technical editors will sign in).**
1. Deploy Sveltia's authenticator to Cloudflare Workers (free): for/use
   [github.com/sveltia/sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth).
2. Create a GitHub **OAuth App** (github.com → Settings → Developer settings → OAuth Apps),
   set its Authorization callback URL to `https://YOUR-WORKER.workers.dev/callback`.
3. Put the OAuth app's **Client ID / Client Secret** in the Worker as
   `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`.
4. In `admin/config.yml`, uncomment and point `base_url` at your Worker:
   ```yaml
   backend:
     name: github
     repo: playpressstdio-eng/playpress-site
     branch: main
     base_url: https://YOUR-WORKER.workers.dev
   ```

For a solo owner, **Option A is enough** — skip the OAuth app entirely.

---

## The automatic publishing flow

1. Open `https://your-site.pages.dev/admin/` → log in with GitHub.
2. Edit / create a post (title, date, featured image, excerpt, body).
3. Hit **Publish.** Sveltia commits the change to GitHub.
4. The host rebuilds automatically; the page is live a moment later.

---

## Migrating from Netlify (if you're moving host)

1. In Cloudflare: **Workers & Pages → Create → Pages → Connect to Git** → pick the repo.
2. Set **Build command:** `node build.js` · **Build output directory:** `dist`
   · **Root directory:** `playpress-studio-source`.
3. Deploy. The `/admin/` folder and the whole site are served from the build output.

**No `netlify.toml` needed on Cloudflare Pages** (it's a Netlify file; harmless to keep).
Cloudflare free tier: **500 builds/month, unlimited bandwidth, free custom domains** —
far more forgiving than Netlify's build-minute cap.
