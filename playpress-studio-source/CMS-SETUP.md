# PlayPress Studio — Decap CMS Setup Guide

You now have a **free GUI content editor** (Decap CMS) AND an **auto-render build** so blog
posts and testimonials appear on the site automatically. This guide walks you through the
one-time setup. ~15 minutes.

**What's already built and working:** a `build.js` that reads your `content/` Markdown files
and turns them into visible pages (blog listing + posts) and injects a testimonials section
into the homepage. The public site uses the `dist/` output. New files you add in the CMS get
rendered on the next build — no hand-editing HTML.

---

## What this gives you
- A CMS editor at **`https://your-site.netlify.app/admin/`**
- Add / edit **Blog posts** and **Testimonials** in a form
- Edit **About** and **Contact** details without touching code
- Your custom design, colors, and animations stay exactly as-is

## What it needs (one-time, then done)
Decap CMS needs three things on Netlify. This is the one-time cost of getting a GUI.
Do these once and you're set for good.

### 1. Connect the site to a Git repository (GitHub)
This is required for Decap's editor to save changes. Drag-and-drop-only deploy won't work
with the CMS — the CMS edits files and pushes them to your repo, which Netlify then redeploys.

1. Create a free GitHub account (github.com) if you don't have one.
2. Create a **new repository** (e.g. `playpress-site`). Private is fine.
3. Push the **source** folder into it — `index.html`, `build.js`, `netlify.toml`, `admin/`,
   `content/`, `images/`, `samples/`, favicons, `robots.txt`, `sitemap.xml`. (You do NOT
   push `dist/` — Netlify generates that during the build.)
4. In Netlify: **Site settings → Build & deploy → Connect Git repository** → pick that repo.
   Netlify reads `netlify.toml`, runs `node build.js`, and publishes from `dist/`.
   From now on, editing happens on the repo / via the CMS — no more re-zipping.

### 2. Enable Netlify Identity
1. Netlify → **Site settings → Identity → Enable Identity service.**
2. Under **Registration**, choose **Invite only** (or Public — your call).
3. Under **Services → Git Gateway**, click **Enable**. (This links Identity to your repo.)

### 3. Invite yourself as the editor
1. **Identity → Invite users** → enter your email (e.g. sarez.johnlloyd@gmail.com).
2. Click the invite link, set your password, log in.
3. Now go to **`https://your-site.netlify.app/admin/`** — you'll see the editor.

---

## What stays the same
- The **public site** still looks and behaves identical — the CMS is just a hidden
  back-office at `/admin/`.
- Your **domain**, **custom design**, **petals**, **palette** — untouched.

## What changes about how you deploy
- **Before:** drag-and-drop a zip.
- **After:** deploy from GitHub, and use `/admin/` to add content. Netlify rebuilds
  automatically on every save. No more re-zipping to change a testimonial.

---

## Alternative if you do NOT want to connect Git
If connecting a repo feels like too much, you have two fallbacks (both fully supported):
- **Keep drag-and-drop (no CMS).** I can still add testimonials / blog sections to your
  HTML directly — you just edit via code for bigger changes. The CMS files here are
  harmless to leave, or we delete them.
- **Just a `content/` folder + static publish:** I can write a tiny build script that takes
  your Markdown posts and renders them into static HTML on the fly (no Git needed for the
  *viewing*, but you'd still trigger builds somehow).

Tell me which direction and I'll tailor the exact next steps.
