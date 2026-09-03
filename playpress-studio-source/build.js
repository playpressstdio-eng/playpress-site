// PlayPress Studio — build script (zero dependency)
// Reads YAML/MD content from ./content and renders into ./dist/index.html
// plus blog listing + post pages. Fail-safe: missing content falls back to
// hard-coded defaults so an empty field never breaks the page.

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const CONTENT = path.join(ROOT, 'content');
const BLOG_DIR = path.join(CONTENT, 'blog');
const TEST_DIR = path.join(CONTENT, 'testimonials');

function readFile(f) { return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : ''; }
function rmrf(p) { fs.rmSync(p, { recursive: true, force: true }); }
function parseYaml(str) { return yaml.load(str) || {}; }

// ---------- Frontmatter MD for blog/testimonials ----------
function readMD(file) {
  const raw = readFile(file);
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };
  return { data: parseYaml(m[1]), body: m[2].trim() };
}
function listRun(folder) {
  if (!fs.existsSync(folder)) return [];
  return fs.readdirSync(folder).filter(f => f.endsWith('.md')).map(f => readMD(path.join(folder, f)));
}
function slug(s) { const base = String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); return base || 'post'; }
function arr(x) { return Array.isArray(x) ? x : []; }
function safeDate(d) { if (!d) return ''; const t = new Date(d); return isNaN(t.getTime()) ? '' : t.toISOString().slice(0, 10); }
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

// For the hero headline: bold-marked word gets the accent color (matching h1 span CSS)
function headlineMD(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<span>$1</span>')
    .replace(/\*(.+?)\*/g, '$1');
}
// ---------- Light markdown for inline + body ----------
function inlineMD(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g, (m, text, url) => {
      const u = url.trim();
      // Block script-capable link schemes; allow http(s), mailto, tel, relative, and anchors only.
      const unsafe = /^\s*(javascript|vbscript|data)\s*:/i.test(u);
      return `<a href="${unsafe ? '#' : u}" target="_blank" rel="noopener">${text}</a>`;
    });
}
function renderBody(s) {
  return s.split(/\n\s*\n/).map(p => {
    const t = p.trim();
    if (/^#{1,3}\s/.test(t)) {
      const l = t.match(/^(#{1,3})\s/)[1].length;
      return `<h${l}>${inlineMD(t.replace(/^#{1,3}\s/, ''))}</h${l}>`;
    }
    if (/^[-*]\s/.test(t)) {
      return `<ul>${t.split('\n').filter(Boolean).map(i => `<li>${inlineMD(i.replace(/^[-*]\s/, ''))}</li>`).join('')}</ul>`;
    }
    return `<p>${inlineMD(t)}</p>`;
  }).join('\n');
}

// ---------- Load content with defaults ----------
let SEO = {}, BRAND = {}, CONTACT = {};
let NAV = {}, HERO = {}, HOW = {}, MATRIX = {}, FAQ = {}, CTA = {}, FOOTER = {};
let SAMPLES = {}, PACKAGES = {};
let ABIO = {}, APORT = {}, ACREDS = {}, AFUN = {};
const HOME_DIR = path.join(CONTENT, 'home');
const ABOUT_DIR = path.join(CONTENT, 'about');
const SETTINGS_DIR = path.join(CONTENT, 'settings');
try { SEO = parseYaml(readFile(path.join(SETTINGS_DIR, 'seo.yml'))); } catch (e) { console.error('seo', e.message); }
try { const c = parseYaml(readFile(path.join(SETTINGS_DIR, 'contact.yml'))); BRAND = c; CONTACT = c; } catch (e) { console.error('contact', e.message); }
try { NAV = parseYaml(readFile(path.join(HOME_DIR, 'nav.yml'))); } catch (e) { console.error('nav', e.message); }
try { HERO = parseYaml(readFile(path.join(HOME_DIR, 'hero.yml'))); } catch (e) { console.error('hero', e.message); }
try { HOW = parseYaml(readFile(path.join(HOME_DIR, 'how.yml'))); } catch (e) { console.error('how', e.message); }
try { MATRIX = parseYaml(readFile(path.join(HOME_DIR, 'matrix.yml'))); } catch (e) { console.error('matrix', e.message); }
try { FAQ = parseYaml(readFile(path.join(HOME_DIR, 'faq.yml'))); } catch (e) { console.error('faq', e.message); }
try { CTA = parseYaml(readFile(path.join(HOME_DIR, 'cta.yml'))); } catch (e) { console.error('cta', e.message); }
try { FOOTER = parseYaml(readFile(path.join(HOME_DIR, 'footer.yml'))); } catch (e) { console.error('footer', e.message); }
try { SAMPLES = parseYaml(readFile(path.join(CONTENT, 'samples.yml'))); } catch (e) { console.error('samples', e.message); }
try { PACKAGES = parseYaml(readFile(path.join(CONTENT, 'packages.yml'))); } catch (e) { console.error('packages', e.message); }
try { ABIO = parseYaml(readFile(path.join(ABOUT_DIR, 'bio.yml'))); } catch (e) { console.error('about/bio', e.message); }
try { APORT = parseYaml(readFile(path.join(ABOUT_DIR, 'portrait.yml'))); } catch (e) { console.error('about/portrait', e.message); }
try { ACREDS = parseYaml(readFile(path.join(ABOUT_DIR, 'creds.yml'))); } catch (e) { console.error('about/creds', e.message); }
try { AFUN = parseYaml(readFile(path.join(ABOUT_DIR, 'fun.yml'))); } catch (e) { console.error('about/fun', e.message); }

const seo = SEO || {};
const brand = BRAND || {};
const contact = CONTACT || {};
const nav = NAV || {};
const hero = HERO || {};
const how = HOW || {};
const matrix = MATRIX || {};
const faq = FAQ || {};
const cta = CTA || {};
const footer = FOOTER || {};
const about = ABIO || {};
const aport = APORT || {};
const acreds = ACREDS || {};
const afun = AFUN || {};

// ---------- Render helpers ----------
function listLinks(links, cls) {
  return arr(links).map(l => `<a href="${esc(l.href || '#')}">${esc(l.label || '')}</a>`).join('\n      ');
}
function stepsHTML() {
  return arr(how.steps).map(s => `
      <div class="step-card">
        <div class="step-badge">${esc(s.badge)}</div>
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.text)}</p>
      </div>`).join('\n');
}
function matrixHTML() {
  return arr(matrix.items).map(m => `
        <div class="asset-item">
          <div class="asset-icon">${esc(m.num)}</div>
          <div><b>${esc(m.name)}</b><small>${esc(m.text)}</small></div>
        </div>`).join('\n');
}
function faqHTML() {
  return arr(faq.items).map(f => `
      <div class="faq-item">
        <h4>${esc(f.q)}</h4>
        <p>${esc(f.a)}</p>
      </div>`).join('\n');
}
function ctaButtons() {
  return arr(cta.buttons).map((b, i) => i === 0
    ? `<a href="${esc(b.link)}" target="_blank" rel="noopener" class="btn-primary">${esc(b.label)}</a>`
    : `<a href="${esc(b.link)}" target="_blank" rel="noopener" class="btn-primary" style="background: transparent; color: #FFF; border: 1px solid rgba(255,255,255,0.3);">${esc(b.label)}</a>`).join('\n        ');
}
function sampleGraphics() {
  const g = SAMPLES.graphics || {};
  return arr(g.items).map(it => {
    const img = `<img src="${esc(it.image)}" alt="${esc(it.alt)}" loading="lazy" style="width: 100%; border-radius: 12px; border: 1px solid var(--border-light); box-shadow: var(--shadow-sm); margin-bottom: 12px;">`;
    const media = it.link ? `<a href="${esc(it.link)}" target="_blank" rel="noopener" style="display:block; text-decoration:none;">${img}</a>` : img;
    return `<div>${media}<p style="font-size: 13.5px; color: var(--text-body); line-height: 1.5; text-align: center;">${inlineMD(it.caption || '')}</p></div>`;
  }).join('\n');
}
function featuredHTML() {
  const f = SAMPLES.featured || {};
  if (!f.enabled) return '';
  const v = f.video || '';
  if (!v) return '';
  const cap = f.caption ? `<p style="font-size: 14px; color: var(--text-body); line-height: 1.5; text-align: center; margin-top: 16px;">${inlineMD(f.caption)}</p>` : '';
  return `
      <div style="background: var(--bg-surface-solid); border: 1px solid var(--border-light); border-radius: 20px; padding: 32px; box-shadow: var(--shadow-sm); margin-bottom: 32px; text-align: center;">
        <div style="font-size: 11.5px; font-weight: 800; text-transform: uppercase; color: var(--accent-dark); letter-spacing: 0.06em; margin-bottom: 6px;">Featured Work</div>
        <iframe class="portfolio-media" height="380" src="${esc(v)}" title="Featured sample" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width: 100%; border-radius: 16px; border: 1px solid var(--border-light);"></iframe>${cap}
      </div>`;
}
function planCards() {
  return arr(PACKAGES.plans).map(p => {
    const pill = p.pill ? `<div class="pkg-pill ${p.pill_class || ''}">${esc(p.pill)}</div>` : '';
    const features = arr(p.features).map(f => `<li><span class="check">✓</span><span class="text">${esc(f)}</span></li>`).join('\n          ');
    return `
      <div class="pkg-card ${p.pill_class === 'featured' ? 'featured' : (p.pill_class === 'gold' ? 'founder' : '')}">
        ${pill}
        <h3>${esc(p.name)}</h3>
        <div class="pkg-desc">${esc(p.description)}</div>
        <div class="pkg-price">${esc(p.price)}<span> / month</span></div>
        <div class="founding-badge-inline">✦ ${esc(p.badge)}</div>
        <ul>
          ${features}
        </ul>
        <a href="${esc(p.cta_link)}" target="_blank" rel="noopener" class="btn-pkg">${esc(p.cta)}</a>
      </div>`;
  }).join('\n');
}
function credCards() {
  return arr(acreds.credentials).map(c => `
        <div class="cred-card${c.gold ? ' gold' : ''}">
          <div class="cred-card-head"><strong>${esc(c.title)}</strong><span class="cred-tag">${esc(c.tag)}</span></div>
          <span>${esc(c.text)}</span>
        </div>`).join('\n');
}
function testimonialsHTML() {
  const list = listRun(TEST_DIR);
  if (!list.length) return '<p style="color:var(--text-muted);text-align:center;">Client testimonials are coming soon.</p>';
  return list.map(t => {
    const q = esc(t.data.quote || t.body || '');
    const name = esc(t.data.name || 'Client');
    const role = esc(t.data.role || '');
    return `<div class="testimonial-card"><div class="quote-mark">\u201C</div><blockquote>${q}</blockquote><div class="t-author"><div class="t-name">${name}</div>${role ? `<div class="t-role">${role}</div>` : ''}</div></div>`;
  }).join('\n');
}

// ---------- Build from a template with markers ----------
rmrf(DIST);
fs.mkdirSync(path.join(DIST, 'blog'), { recursive: true });
['images', 'samples', 'admin'].forEach(d => { if (fs.existsSync(path.join(ROOT, d))) fs.cpSync(path.join(ROOT, d), path.join(DIST, d), { recursive: true }); });
['favicon-16.png','favicon-32.png','favicon-48.png','favicon-180.png','favicon-512.png','logo-mark.png','og-image.png','robots.txt','sitemap.xml'].forEach(f => { if (fs.existsSync(path.join(ROOT, f))) fs.copyFileSync(path.join(ROOT, f), path.join(DIST, f)); });

// Load index.html template (content markers are <!--HERO-->, <!--STEPS-->, etc.)
let html = readFile(path.join(ROOT, 'index.html'));
html = html
  // <head> SEO
  .replace('<!--SEOTITLE-->', esc(seo.title || 'PlayPress Studio — Podcasting, Done Right!'))
  .replace('<!--SEODESC-->', esc(seo.meta_description || ''))
  .replaceAll('<!--SEOURL-->', esc(seo.canonical || 'https://playpress-studio.netlify.app/'))
  .replaceAll('<!--OGIMAGE-->', esc(seo.og_image || 'https://playpress-studio.netlify.app/og-image.png'))
  .replaceAll('<!--OGTITLE-->', esc((brand.name || 'PlayPress Studio') + ' — ' + (brand.tagline || 'Podcasting, Done Right.')))
  .replaceAll('<!--OGDESC-->', esc(seo.meta_description || 'Done-for-you podcast editing, vertical reels, show notes, and social scheduling by a dedicated solo producer.'))
  // nav
  .replaceAll('<!--NAVLINKS-->', listLinks(nav.links))
  .replace('<!--NAVLOGO-->', esc(nav.logo_text || brand.name || 'PlayPress Studio'))
  .replaceAll('<!--NAVCTA-->', esc(nav.cta_text || 'Book Discovery Call'))
  .replaceAll('<!--NAVCTALINK-->', esc(nav.cta_link || contact.calendly || '#'))
  // hero
  .replace('<!--HEROEYEBROW-->', esc(hero.eyebrow || ''))
  .replace('<!--HEROH1-->', headlineMD(hero.headline || ''))
  .replace('<!--HEROLEDE-->', esc(hero.lede || ''))
  .replace('<!--HEROPRIMARY-->', esc(hero.primary_text || 'Book a Discovery Call'))
  .replace('<!--HEROPRIMLINK-->', esc(hero.primary_link || contact.calendly || '#'))
  .replace('<!--HEROSECONDARY-->', esc(hero.secondary_text || 'View Packages'))
  .replace('<!--HEROSECLINK-->', esc(hero.secondary_link || '#packages'))
  // how it works
  .replace('<!--HOWKICKER-->', esc(how.kicker || 'The Process'))
  .replace('<!--HOWTITLE-->', esc(how.title || ''))
  .replace('<!--HOWSUB-->', esc(how.subtitle || ''))
  .replace('<!--STEPS-->', stepsHTML())
  // asset matrix
  .replace('<!--MATRIXTITLE-->', esc(matrix.title || ''))
  .replace('<!--MATRIXNOTE-->', esc(matrix.note || ''))
  .replace('<!--MATRIXITEMS-->', matrixHTML())
  // samples
  .replace('<!--SAMPLEKICKER-->', esc(SAMPLES.kicker || 'Work Samples'))
  .replace('<!--SAMPLETITLE-->', esc(SAMPLES.title || ''))
  .replace('<!--SAMPLESUB-->', esc(SAMPLES.subtitle || ''))
  .replace('<!--FEATURED-->', featuredHTML())
  .replace('<!--CMPLABEL-->', esc((SAMPLES.compare || {}).label || 'Audio & Video Mastering'))
  .replace('<!--CMPHEAD-->', esc((SAMPLES.compare || {}).headline || ''))
  .replace('<!--CMPBEFORELABEL-->', esc((SAMPLES.compare || {}).before_label || 'BEFORE: RAW'))
  .replace('<!--CMPBEFOREVID-->', esc((SAMPLES.compare || {}).before_video || ''))
  .replace('<!--CMPBEFORECAP-->', inlineMD((SAMPLES.compare || {}).before_caption || ''))
  .replace('<!--CMPAFTERLABEL-->', esc((SAMPLES.compare || {}).after_label || 'AFTER: EDITED'))
  .replace('<!--CMPAFTERVID-->', esc((SAMPLES.compare || {}).after_video || ''))
  .replace('<!--CMPAFTERCAP-->', inlineMD((SAMPLES.compare || {}).after_caption || ''))
  .replace('<!--REELSLABEL-->', esc((SAMPLES.reels || {}).label || 'Short-Form Repurposing'))
  .replace('<!--REELSHEAD-->', esc((SAMPLES.reels || {}).headline || ''))
  .replace('<!--REELSTEXT-->', esc((SAMPLES.reels || {}).text || ''))
  .replace('<!--REELSBULLETS-->', arr((SAMPLES.reels || {}).bullets).map(b => `<li style="display: flex; gap: 10px; font-size: 14.5px; color: var(--text-muted);"><span style="color: var(--accent); font-weight: 800;">✓</span> ${esc(b)}</li>`).join('\n          '))
  .replace('<!--REELSVID-->', esc((SAMPLES.reels || {}).video || ''))
  .replace('<!--BROLLNOTE-->', esc(SAMPLES.broll_note || ''))
  .replace('<!--STYLELABEL-->', esc(SAMPLES.style_label || ''))
  .replace('<!--STYLENOTE-->', esc(SAMPLES.style_note || ''))
  .replace('<!--GRAPHLABEL-->', esc((SAMPLES.graphics || {}).label || 'Quote & Title Graphics'))
  .replace('<!--GRAPHHEAD-->', esc((SAMPLES.graphics || {}).headline || ''))
  .replace('<!--GRAPHS-->', sampleGraphics())
  .replace('<!--GRAPHNOTE-->', esc((SAMPLES.graphics || {}).note || ''))
  // packages
  .replace('<!--PKGKICKER-->', esc(PACKAGES.kicker || 'Packages'))
  .replace('<!--PKGTITLE-->', esc(PACKAGES.title || ''))
  .replace('<!--PKGSUB-->', esc(PACKAGES.subtitle || ''))
  .replace('<!--PLANS-->', planCards())
  .replace('<!--DEPOSITLABEL-->', esc((PACKAGES.deposit_note || {}).label || ''))
  .replace('<!--DEPOSITTEXT-->', esc((PACKAGES.deposit_note || {}).text || ''))
  .replace('<!--PKGSTYLENOTE-->', esc(PACKAGES.style_note || ''))
  // about
  .replace('<!--ABOUTKICKER-->', esc(about.kicker || 'About the Producer'))
  .replace('<!--ABOUTTITLE-->', esc(about.title || ''))
  .replace('<!--ABOUTBIO-->', arr(about.bio).map(p => `<p>${inlineMD(p)}</p>`).join('\n          '))
  .replace('<!--PORTRAITSRC-->', esc(aport.image || 'images/producer-portrait.png'))
  .replace('<!--PORTRAITALT-->', esc('John Lloyd Sarez — founder of PlayPress Studio'))
  .replace('<!--PORTRAITNAME-->', esc(aport.name || 'John Lloyd Sarez'))
  .replace('<!--PORTRAITROLE-->', esc(aport.role || 'Founder & Producer'))
  .replace('<!--FUNNOTE-->', inlineMD(afun.fun_note || ''))
  .replace('<!--CREDS-->', credCards())
  // faq
  .replace('<!--FAQKICKER-->', esc(faq.kicker || 'Questions'))
  .replace('<!--FAQTITLE-->', esc(faq.title || ''))
  .replace('<!--FAQITEMS-->', faqHTML())
  // cta
  .replace('<!--CTATITLE-->', esc(cta.title || ''))
  .replace('<!--CTATEXT-->', esc(cta.text || ''))
  .replace('<!--CTABUTTONS-->', ctaButtons())
  // footer
  .replace('<!--COPYRIGHT-->', esc(footer.copyright || '© 2026 PlayPress Studio. Podcasting, Done Right. All rights reserved.'))
  .replaceAll('<!--FOOTEREMAIL-->', esc(contact.email || 'playpress.stdio@gmail.com'))
  .replace('<!--FOOTERWA-->', esc(contact.whatsapp || ''))
  .replace('<!--FOOTERWALINK-->', esc(contact.whatsapp_link || '#'))
  .replace('<!--FOOTERLINKEDIN-->', esc(contact.linkedin || '#'))
  .replace('<!--FOOTERLINKEDINURL-->', esc(contact.linkedin || '#'))
  // testimonials
  .replace('<!--TESTIMONIALS-->', testimonialsHTML());

fs.writeFileSync(path.join(DIST, 'index.html'), html);

// ---------- Blog listing + posts ----------
const posts = listRun(BLOG_DIR).sort((a, b) => (new Date(b.data.date||0).getTime()) - (new Date(a.data.date||0).getTime()));
// Assign each post a unique slug once (dedupes titles that slugify identically; guards non-ASCII titles).
const usedSlugs = {};
posts.forEach(p => {
  const base = slug(p.data.title || 'post');
  let s = base, n = 2;
  while (usedSlugs[s]) { s = base + '-' + (n++); }
  usedSlugs[s] = true;
  p._slug = s;
});
const postCards = posts.map(p => {
  const date = safeDate(p.data.date);
  return `<a class="post-card" href="/blog/${p._slug}/"><h3>${esc(p.data.title)}</h3>${date ? `<div class="post-date">${esc(date)}</div>` : ''}${p.data.excerpt ? `<p>${esc(p.data.excerpt)}</p>` : ''}</a>`;
}).join('\n');

const blogList = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Blog — ${esc(brand.name || 'PlayPress Studio')}</title>
<style>${styleBlock()}</style></head><body>
<header><div class="wrap"><a href="/">\u2190 ${esc(brand.name || 'PlayPress Studio')}</a></div></header>
<div class="wrap"><h1>Blog</h1><div class="posts">${postCards || '<p>No posts yet. Add them at /admin/.</p>'}</div></div>
</body></html>`;
fs.writeFileSync(path.join(DIST, 'blog', 'index.html'), blogList);

posts.forEach(p => {
  const dir = path.join(DIST, 'blog', p._slug);
  fs.mkdirSync(dir, { recursive: true });
  const title = esc(p.data.title || 'Untitled');
  const date = safeDate(p.data.date);
  const body = renderBody(p.body);
  const htmlPost = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title} — ${esc(brand.name || 'PlayPress Studio')}</title>
<style>${styleBlock()}</style></head><body>
<header><div class="wrap"><a href="/blog/">\u2190 All posts</a></div></header>
<div class="wrap"><article><h1 class="post-title">${title}</h1>${date ? `<div class="post-date">${date}</div>` : ''}<div class="post-body">${body}</div></article></div>
</body></html>`;
  fs.writeFileSync(path.join(dir, 'index.html'), htmlPost);
});

function styleBlock() {
  return `body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#FCF8F3;color:#2B1D18;margin:0;line-height:1.7}.wrap{max-width:760px;margin:0 auto;padding:0 24px}header{background:#FCF8F3;border-bottom:1px solid rgba(146,100,86,.14);padding:20px 0}header a{color:#C75B64;text-decoration:none;font-weight:700}h1{font-size:34px;margin:40px 0 8px;letter-spacing:-.03em}.posts{display:grid;gap:18px;margin:28px 0 60px}.post-card{display:block;background:#fff;border:1px solid rgba(146,100,86,.14);border-left:4px solid #C75B64;border-radius:14px;padding:24px;text-decoration:none;color:inherit;box-shadow:0 4px 16px rgba(140,82,72,.06);transition:transform .2s,box-shadow .2s}.post-card:hover{transform:translateY(-3px);box-shadow:0 10px 30px rgba(140,82,72,.12)}.post-card h3{margin:0 0 6px;font-size:20px}.post-card .post-date{font-size:12px;color:#8A6F62;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px}.post-card p{margin:0;font-size:14.5px;color:#4A342E}.post-title{font-size:38px;line-height:1.2;margin:40px 0 8px;letter-spacing:-.03em}.post-date{font-size:13px;color:#8A6F62;text-transform:uppercase;letter-spacing:.05em;margin-bottom:24px}.post-body{font-size:17px;margin-bottom:60px}.post-body h2{margin:28px 0 8px;color:#C75B64}.post-body a{color:#C75B64}.post-body code{background:#FAE7E4;padding:2px 6px;border-radius:4px}.back{display:inline-block;margin:24px 0 40px;color:#C75B64}`;
}

console.log('Built site: index.html + ' + (posts.length) + ' blog posts + testimonials.');
