// Zero-dependency build for PlayPress Studio.
// Reads content/testimonials + content/blog markdown and renders them into the site.
// Run:  node build.js      Output: ./dist

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const CONTENT = path.join(ROOT, 'content');
const TESTIMONIALS_DIR = path.join(CONTENT, 'testimonials');
const BLOG_DIR = path.join(CONTENT, 'blog');

function rmrf(p) { fs.rmSync(p, { recursive: true, force: true }); }
function readMD(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };
  const data = {};
  m[1].split('\n').forEach(line => {
    const i = line.indexOf(':');
    if (i > -1) data[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  });
  return { data, body: m[2].trim() };
}
function listRun(folder) {
  if (!fs.existsSync(folder)) return [];
  return fs.readdirSync(folder).filter(f => f.endsWith('.md')).map(f => readMD(path.join(folder, f)));
}
function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

// ---------- 1. Render a blog post body (very small markdown subset) ----------
function inlineMD(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}
function renderBody(s) {
  const paras = s.split(/\n\s*\n/);
  const html = paras.map(p => {
    const t = p.trim();
    if (/^#{1,3}\s/.test(t)) {
      const level = t.match(/^(#{1,3})\s/)[1].length;
      return `<h${level}>${inlineMD(t.replace(/^#{1,3}\s/, ''))}</h${level}>`;
    }
    if (/^[-*]\s/.test(t)) {
      const items = t.split('\n').filter(Boolean).map(i => `<li>${inlineMD(i.replace(/^[-*]\s/, ''))}</li>`).join('');
      return `<ul>${items}</ul>`;
    }
    return `<p>${inlineMD(t)}</p>`;
  }).join('\n');
  return html;
}

// ---------- 2. Build testimonial cards ----------
const testimonials = listRun(TESTIMONIALS_DIR);
function testimonialCards() {
  if (!testimonials.length) return '<p style="color:var(--text-muted);text-align:center;">Client testimonials are coming soon.</p>';
  return testimonials.map(t => {
    const quote = esc(t.data.quote || t.body || '');
    const name = esc(t.data.name || 'Client');
    const role = esc(t.data.role || '');
    return `<div class="testimonial-card"><div class="quote-mark">\u201C</div><blockquote>${quote}</blockquote><div class="t-author"><div class="t-name">${name}</div>${role ? `<div class="t-role">${role}</div>` : ''}</div></div>`;
  }).join('\n');
}
fs.mkdirSync(path.join(DIST, 'blog'), { recursive: true });

// ---------- 3. Copy static assets ----------
const staticDirs = ['images', 'samples', 'favicon-16.png', 'favicon-32.png', 'favicon-48.png',
  'favicon-180.png', 'favicon-512.png', 'logo-mark.png', 'og-image.png', 'robots.txt', 'sitemap.xml', 'admin'];
staticDirs.forEach(item => {
  const src = path.join(ROOT, item);
  if (fs.existsSync(src)) fs.cpSync(src, path.join(DIST, item), { recursive: true });
});

// ---------- 4. Homepage (inject testimonials) ----------
let home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
home = home.replace(/<!-- Testimonial cards are injected here by the build\. -->/, testimonialCards());
fs.writeFileSync(path.join(DIST, 'index.html'), home);

// ---------- 5. Blog listing ----------
const posts = listRun(BLOG_DIR).sort((a, b) => (b.data.date || '').localeCompare(a.data.date || ''));
const postCards = posts.map(p => {
  const s = slug(p.data.title || 'post');
  const date = (p.data.date || '').slice(0, 10);
  return `<a class="post-card" href="/blog/${s}/"><h3>${esc(p.data.title)}</h3>${date ? `<div class="post-date">${esc(date)}</div>` : ''}${p.data.excerpt ? `<p>${esc(p.data.excerpt)}</p>` : ''}</a>`;
}).join('\n');

const blogList = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Blog — PlayPress Studio</title>
<style>
body{font-family:'Plus Jakarta Sans',sans-serif;background:#FCF8F3;color:#2B1D18;margin:0;line-height:1.65}
.wrap{max-width:900px;margin:0 auto;padding:0 24px}
header{background:#FCF8F3;border-bottom:1px solid rgba(146,100,86,.14);padding:20px 0}
header a{color:#C75B64;text-decoration:none;font-weight:700}
h1{font-size:34px;margin:40px 0 8px;letter-spacing:-.03em}
.posts{display:grid;gap:18px;margin:28px 0 60px}
.post-card{display:block;background:#fff;border:1px solid rgba(146,100,86,.14);border-left:4px solid #C75B64;border-radius:14px;padding:24px;text-decoration:none;color:inherit;box-shadow:0 4px 16px rgba(140,82,72,.06);transition:transform .2s,box-shadow .2s}
.post-card:hover{transform:translateY(-3px);box-shadow:0 10px 30px rgba(140,82,72,.12)}
.post-card h3{margin:0 0 6px;font-size:20px}
.post-card .post-date{font-size:12px;color:#8A6F62;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px}
.post-card p{margin:0;font-size:14.5px;color:#4A342E}
.post-body{margin:0 0 60px;max-width:720px}.post-body h2{margin:28px 0 8px}.post-body p{margin:0 0 16px}
.back{display:inline-block;margin:24px 0 0;color:#C75B64;text-decoration:none;font-weight:700}
</style></head><body>
<header><div class="wrap"><a href="/">\u2190 PlayPress Studio</a></div></header>
<div class="wrap"><h1>Blog</h1>
<div class="posts">${postCards || `<p>No posts yet. Add them at /admin/.</p>`}</div>
</div></body></html>`;
fs.writeFileSync(path.join(DIST, 'blog', 'index.html'), blogList);

// ---------- 6. Individual posts ----------
posts.forEach(p => {
  const s = slug(p.data.title || 'post');
  const dir = path.join(DIST, 'blog', s);
  fs.mkdirSync(dir, { recursive: true });
  const title = esc(p.data.title || 'Untitled');
  const date = esc((p.data.date || '').slice(0, 10));
  const body = renderBody(p.body);
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title} — PlayPress Studio</title>
<style>
body{font-family:'Plus Jakarta Sans',sans-serif;background:#FCF8F3;color:#2B1D18;margin:0;line-height:1.7}
.wrap{max-width:760px;margin:0 auto;padding:0 24px}
header{background:#FCF8F3;border-bottom:1px solid rgba(146,100,86,.14);padding:20px 0}
header a{color:#C75B64;text-decoration:none;font-weight:700}
.post-title{font-size:38px;letter-spacing:-.03em;margin:40px 0 8px;line-height:1.2}
.post-date{font-size:13px;color:#8A6F62;text-transform:uppercase;letter-spacing:.05em;margin-bottom:24px}
.post-body{font-size:17px;margin-bottom:60px}.post-body h2{margin:28px 0 8px;color:#C75B64}.post-body h3{margin:24px 0 6px}.post-body a{color:#C75B64}.post-body code{background:#FAE7E4;padding:2px 6px;border-radius:4px;font-size:.9em}
.back{display:inline-block;margin:24px 0 40px;color:#C75B64;text-decoration:none;font-weight:700}
</style></head><body>
<header><div class="wrap"><a href="/blog/">\u2190 All posts</a></div></header>
<div class="wrap"><article>
<h1 class="post-title">${title}</h1>
${date ? `<div class="post-date">${date}</div>` : ''}
<div class="post-body">${body}</div>
</article></div></body></html>`;
  fs.writeFileSync(path.join(dir, 'index.html'), html);
});

console.log(`Built ${distCount()} pages (${testimonials.length} testimonials, ${posts.length} posts).`);
function distCount() {
  let n = 0; function walk(d){ for(const f of fs.readdirSync(d)){ const p=path.join(d,f); if(fs.statSync(p).isDirectory()) walk(p); else if(f.endsWith('.html')) n++; } }
  try { walk(DIST); } catch(e) {}
  return n;
}
