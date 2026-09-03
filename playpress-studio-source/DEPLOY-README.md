# Your website — setup guide

## What this is
A single file: `index.html`. Everything — layout, styling, content — lives inside it. No build tools, no installs needed to view or host it.

## 1. Preview it right now
Just double-click `index.html` — it opens in your browser exactly as it'll look live.

## 2. Put it online for free (pick one, ~5 minutes)

**Option A — Netlify (easiest)**
1. Go to netlify.com and sign up (free, no card required).
2. Once logged in, drag the whole `website` folder onto the dashboard where it says "Drag and drop your site output folder here."
3. Netlify gives you a free URL immediately (like `your-site-123.netlify.app`). You can rename it for free in Site settings → Change site name.
4. A custom domain (e.g. yourbusiness.com) can be added later, once you're ready to pay for one — the free subdomain works fine to start.

**Option B — GitHub Pages**
1. Create a free GitHub account and a new repository.
2. Upload `index.html` to it.
3. In the repo's Settings → Pages, set the source to the main branch.
4. Your site goes live at `yourusername.github.io/reponame`.

**Option C — Vercel**
Same drag-and-drop idea as Netlify — vercel.com, sign up free, deploy the folder.

Any of these is fine. Netlify is the fastest to get working if this is your first time deploying anything.

## 3. What to edit before it's ready to send anyone

Open `index.html` in any text editor (even Notepad works, but VS Code or a similar code editor makes this easier) and update:

- **Contact section (bottom of file, search for "you@yourdomain.com"):** replace with your real email.
- **Calendly link (same section, search for "Calendly link"):** once you set up a free Calendly account, replace the `href="#"` with your real booking link.
- **Pricing:** search for `$797` and `$1,497` — adjust to whatever you finalize from the handbook's Module 4, including the founding-client note if you're using a time-boxed discount.
- **Portfolio/proof section (search for "Sample work for this site"):** replace this placeholder paragraph with real before/after samples or embeds as soon as you have them — this is the highest-priority edit once you have anything to show.
- **Business name:** currently "Signal" (placeholder) — search and replace throughout if you want something else.
- **Footer year/name:** update to match.

## 4. Adding real work samples later
Once you have sample edits to show:
1. Upload the audio/video to YouTube (set to "Unlisted") or SoundCloud (free tier) — this hosts the file for free.
2. Get the embed code from either platform (usually under a "Share → Embed" button).
3. Paste that embed code into the proof section of `index.html`, replacing the placeholder paragraph.

## 5. You don't need to touch the CSS
Everything above only requires editing text between the `<...>` tags — you won't need to understand the styling code (the `<style>` block near the top) to make any of these changes. Leave that part alone unless you want to change colors or layout.
