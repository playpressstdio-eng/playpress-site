// PlayPress Studio — multi-page build script
// Reads YAML/MD content from ./content and renders into ./dist as real pages:
//   / (home), /samples/, /packages/, /testimonials/, /about/, /blog/, /blog/<slug>/.
// All pages share one shell (head, nav, footer, palette, on-page JS).

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
function asset(u) {
  if (!u) return '';
  const s = String(u).trim();
  if (/^(https?:)?\/\//i.test(s) || s.charAt(0) === '/') return s;
  return '/' + s.replace(/^\.?\//, '');
}
function strList(x) {
  return arr(x).map(it => (it && typeof it === 'object') ? (Object.values(it).find(v => typeof v === 'string') || '') : String(it));
}
function safeDate(d) { if (!d) return ''; const t = new Date(d); return isNaN(t.getTime()) ? '' : t.toISOString().slice(0, 10); }
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function headlineMD(s) {
  return esc(s).replace(/\*\*(.+?)\*\*/g, '<span>$1</span>').replace(/\*(.+?)\*/g, '$1');
}
function inlineMD(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g, (m, text, url) => {
      const u = url.trim();
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

// ---------- Load content ----------
let SEO = {}, BRAND = {}, CONTACT = {};
let NAV = {}, HERO = {}, HOW = {}, MATRIX = {}, FAQ = {}, CTA = {}, FOOTER = {}, STATS = {};
let SAMPLES = {}, PACKAGES = {};
let ABIO = {}, APORT = {}, ACREDS = {}, AFUN = {};
const HOME_DIR = path.join(CONTENT, 'home');
const ABOUT_DIR = path.join(CONTENT, 'about');
const SETTINGS_DIR = path.join(CONTENT, 'settings');
const load = (file, obj, key) => { try { obj = parseYaml(readFile(file)); } catch (e) { console.error(key, e.message); } return obj; };
SEO = load(path.join(SETTINGS_DIR, 'seo.yml'), SEO, 'seo');
BRAND = CONTACT = load(path.join(SETTINGS_DIR, 'contact.yml'), BRAND, 'contact');
NAV = load(path.join(HOME_DIR, 'nav.yml'), NAV, 'nav');
HERO = load(path.join(HOME_DIR, 'hero.yml'), HERO, 'hero');
HOW = load(path.join(HOME_DIR, 'how.yml'), HOW, 'how');
MATRIX = load(path.join(HOME_DIR, 'matrix.yml'), MATRIX, 'matrix');
FAQ = load(path.join(HOME_DIR, 'faq.yml'), FAQ, 'faq');
CTA = load(path.join(HOME_DIR, 'cta.yml'), CTA, 'cta');
FOOTER = load(path.join(HOME_DIR, 'footer.yml'), FOOTER, 'footer');
STATS = load(path.join(HOME_DIR, 'stats.yml'), STATS, 'stats');
SAMPLES = load(path.join(CONTENT, 'samples.yml'), SAMPLES, 'samples');
PACKAGES = load(path.join(CONTENT, 'packages.yml'), PACKAGES, 'packages');
ABIO = load(path.join(ABOUT_DIR, 'bio.yml'), ABIO, 'about/bio');
APORT = load(path.join(ABOUT_DIR, 'portrait.yml'), APORT, 'about/portrait');
ACREDS = load(path.join(ABOUT_DIR, 'creds.yml'), ACREDS, 'about/creds');
AFUN = load(path.join(ABOUT_DIR, 'fun.yml'), AFUN, 'about/fun');

const seo = SEO || {}, brand = BRAND || {}, contact = CONTACT || {};
const nav = NAV || {}, hero = HERO || {}, how = HOW || {}, matrix = MATRIX || {};
const faq = FAQ || {}, cta = CTA || {}, footer = FOOTER || {}, stats = STATS || {};
const about = ABIO || {}, aport = APORT || {}, acreds = ACREDS || {}, afun = AFUN || {};

const NAME = brand.name || 'PlayPress Studio';
const DOMAIN = 'https://playpress-studio.com';
const DEFAULT_OG = seo.og_image || DOMAIN + '/og-image.png';
const DEFAULT_DESC = seo.meta_description || 'Done-for-you podcast editing, vertical reels, show notes, and social scheduling by a dedicated solo producer.';

// ---------- Shared CSS ----------
const CSS = readFile(path.join(ROOT, 'styles.css'));

// ---------- Nav ----------
function navItems(links, activeId) {
  return arr(links).map(l => {
    const kids = arr(l.children);
    const label = esc(l.label || '');
    const href = esc(l.href || '#');
    const isActive = (activeId && l.id === activeId) ? ' class="active"' : '';
    if (!kids.length) return `<a href="${href}"${isActive}>${label}</a>`;
    const childLinks = kids.map(c => `<a href="${esc(c.href || '#')}" class="child-link">${esc(c.label || '')}</a>`).join('');
    return `<div class="nav-dd${isActive ? ' active' : ''}"><a class="nav-dd-title" href="${href}" aria-haspopup="true">${label}<span class="caret" aria-hidden="true">▾</span></a><div class="nav-dd-menu">${childLinks}</div></div>`;
  }).join('\n      ');
}

// ---------- Reusable section pieces ----------
function ctaBanner() {
  return `<section id="contact" style="padding-top:64px;padding-bottom:72px;">
    <div class="wrap">
      <div class="cta-banner">
        <h2>${esc(cta.title || '')}</h2>
        <p>${esc(cta.text || '')}</p>
        <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap">
          ${arr(cta.buttons).map((b, i) => i === 0
            ? `<a href="${esc(b.link)}" target="_blank" rel="noopener" class="btn-primary">${esc(b.label)}</a>`
            : `<a href="${esc(b.link)}" target="_blank" rel="noopener" class="btn-primary" style="background:transparent;color:#FFF;border:1px solid rgba(255,255,255,0.3)">${esc(b.label)}</a>`).join('\n          ')}
        </div>
      </div>
    </div>
  </section>`;
}
function pageHero(kicker, title, subtitle) {
  return `<div class="page-hero"><div class="wrap">
    <div class="kicker">${esc(kicker)}</div>
    <h1>${esc(title)}</h1>
    ${subtitle ? `<p class="section-sub">${esc(subtitle)}</p>` : ''}
  </div></div>`;
}

// ================= SHELL =================
function shell(o) {
  const title = esc(o.title || NAME);
  const desc = esc(o.desc || DEFAULT_DESC);
  const url = esc(o.url || DOMAIN + '/');
  const ogimg = esc(o.ogimg || DEFAULT_OG);
  const navHtml = navItems(nav.links, o.active || '').trim();
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${url}">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/favicon-180.png">
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="${NAME}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta property="og:image" content="${ogimg}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${NAME}: podcast editing, reels, show notes, and social scheduling">
<meta name="twitter:image" content="${ogimg}">
<meta name="google-site-verification" content="RsuA_oRkhVA7iH7YDESIRx6xAnAXmnByKJi4mA0oIdA" />
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "name": "${NAME}",
  "description": "Done-for-you podcast editing, vertical reels, show notes, and social media scheduling by a dedicated solo producer.",
  "url": "https://playpress-studio.com/",
  "email": "playpress.stdio@gmail.com",
  "areaServed": "Worldwide",
  "priceRange": "$$",
  "sameAs": ["https://www.linkedin.com/in/john-lloyd-sarez-68624718b"]
}
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>
<a href="#main-content" class="skip-link">Skip to main content</a>
<div class="mesh-backdrop"></div>
<nav>
  <div class="wrap">
    <a href="/" class="brand-logo" aria-label="PlayPress Studio Homepage">
      <img src="/logo-mark.png" alt="PlayPress Studio logo" width="44" height="20" style="height:22px;width:auto;display:block;">
      <span class="brand-logo-text"><span class="brand-logo-title">${esc(nav.logo_text || NAME)}</span><span class="brand-logo-sub">Podcasting, done right.</span></span>
    </a>
    <div class="navlinks">
      ${navHtml}
    </div>
    <button class="nav-toggle" id="navToggle" aria-label="Open navigation menu" aria-expanded="false" aria-controls="mobileMenu">
      <span></span><span></span><span></span>
    </button>
    <a href="${esc(nav.cta_link || contact.calendly || '#')}" target="_blank" rel="noopener" class="btn-nav">${esc(nav.cta_text || 'Book Discovery Call')}</a>
  </div>
  <div class="mobile-menu" id="mobileMenu">
    ${navHtml}
    <a href="${esc(nav.cta_link || contact.calendly || '#')}" target="_blank" rel="noopener" class="btn-nav">${esc(nav.cta_text || 'Book Discovery Call')}</a>
  </div>
</nav>
<main id="main-content">
${o.main || ''}
</main>
<footer>
  <div class="wrap">
    <p>${esc(footer.copyright || '© 2026 PlayPress Studio. Podcasting, Done Right. All rights reserved.')}
      <br>
      <a href="mailto:${esc(contact.email || 'playpress.stdio@gmail.com')}" style="text-decoration:underline;margin-top:4px;display:inline-block">${esc(contact.email || 'playpress.stdio@gmail.com')}</a>
      &nbsp;·&nbsp;
      <a href="${esc(contact.whatsapp_link || '#')}" target="_blank" rel="noopener" style="text-decoration:underline">WhatsApp ${esc(contact.whatsapp || '')}</a>
      &nbsp;·&nbsp;
      <a href="${esc(contact.linkedin || '#')}" target="_blank" rel="noopener" style="text-decoration:underline">LinkedIn</a>
    </p>
  </div>
</footer>
<script>
(function () {
  var toggle = document.getElementById("navToggle");
  var menu = document.getElementById("mobileMenu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
    });
    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        menu.classList.remove("open");
        toggle.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }
  var sparkleColors = ["#C75B64", "#D8895A", "#F3CDC3", "#FFFFFF"];
  document.querySelectorAll(".pkg-card").forEach(function (card) {
    var interval = null;
    card.addEventListener("mouseenter", function () { interval = setInterval(function () { spawnSparkle(card); }, 160); });
    card.addEventListener("mouseleave", function () { clearInterval(interval); });
  });
  function spawnSparkle(card) {
    var s = document.createElement("div");
    s.className = "sparkle";
    var size = 3 + Math.random() * 5;
    s.style.width = size + "px"; s.style.height = size + "px";
    s.style.left = (Math.random() * 90 + 5) + "%";
    s.style.top = (Math.random() * 30 + 60) + "%";
    s.style.background = sparkleColors[Math.floor(Math.random() * sparkleColors.length)];
    s.style.boxShadow = "0 0 6px " + s.style.background;
    card.appendChild(s);
    setTimeout(function () { s.remove(); }, 900);
  }

  // ---- Blog post reactions (global counts via /api/reactions) ----
  document.querySelectorAll(".reactions").forEach(function (box) {
    var slug = box.getAttribute("data-slug") || "post";
    var api = "/api/reactions?slug=" + encodeURIComponent(slug);
    var pickKey = "ppr_sel_" + slug; // which emojis THIS device picked
    var chosen = {};
    try { chosen = JSON.parse(localStorage.getItem(pickKey)) || {}; } catch (e) { chosen = {}; }
    var server = null; // global totals returned by the API
    var buttons = box.querySelectorAll(".reaction");

    function render() {
      buttons.forEach(function (b) {
        var em = b.getAttribute("data-emoji");
        var on = !!chosen[em];
        var base = (server && server[em] != null) ? server[em] : 0;
        b.querySelector(".r-count").textContent = base;
        b.classList.toggle("lit", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }

    function loadServer() {
      fetch(api).then(function (r) { return r.json(); }).then(function (d) {
        server = d || {};
        render();
      }).catch(function () { /* no backend on this preview; fall back to on-device only */ });
    }
    if (window.requestIdleCallback) requestIdleCallback(loadServer);
    else setTimeout(loadServer, 200);
    render();

    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        var em = b.getAttribute("data-emoji");
        var turningOn = !chosen[em];
        chosen[em] = turningOn;
        try { localStorage.setItem(pickKey, JSON.stringify(chosen)); } catch (e) {}
        var serverBefore = server ? (server[em] || 0) : 0;
        // Optimistic update, then reconcile with the server response.
        if (!server) server = {};
        server[em] = Math.max(0, serverBefore + (turningOn ? 1 : -1));
        b.classList.add("bump");
        setTimeout(function () { b.classList.remove("bump"); }, 360);
        render();
        fetch("/api/reactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: slug, emoji: em, delta: turningOn ? 1 : -1 })
        }).then(function (r) { return r.json(); }).then(function (d) {
          if (d && d[em] != null) { server[em] = d[em]; render(); }
        }).catch(function () { /* offline: keep optimistic value */ });
      });
    });
  });
})();
</script>
</body>
</html>`;
}

// ================= HOME (lean landing) =================
function homeMain() {
  return `<section class="hero">
  <div class="petals-container" aria-hidden="true">
    <div class="petal p1"></div><div class="petal gold p2"></div><div class="petal p3"></div>
    <div class="petal gold p4"></div><div class="petal p5"></div><div class="petal gold p6"></div>
    <div class="petal p7"></div><div class="petal gold p8"></div>
  </div>
  <div class="wrap" style="position:relative;z-index:1">
    <div class="eyebrow-pill"><span></span>${esc(hero.eyebrow || '')}</div>
    <h1>${headlineMD(hero.headline || '')}</h1>
    <p class="lede">${esc(hero.lede || '')}</p>
    <div class="hero-ctas">
      <a href="${esc(hero.primary_link || contact.calendly || '#')}" target="_blank" rel="noopener" class="btn-primary">${esc(hero.primary_text || 'Book a Discovery Call')}</a>
      <a href="${esc(hero.secondary_link || '/packages/')}" class="btn-secondary">${esc(hero.secondary_text || 'View Packages')}</a>
    </div>
  </div>
</section>

<!-- STAT BAR: numbers before adjectives (editable in content/home/stats.yml) -->
<section class="stats-bar">
  <div class="wrap">
    ${arr(stats.items).map(s => `<div class="stat"><b>${esc(s.stat)}</b><span>${esc(s.label)}</span></div>`).join('')}
  </div>
</section>

<!-- Compact 3-step tease: the gist, full detail lives on /packages/ -->
<section id="teaser" style="padding-top:72px;background:var(--bg-surface-solid);border-top:1px solid var(--border-light);border-bottom:1px solid var(--border-light)">
  <div class="wrap">
    <div class="section-head">
      <div class="kicker">${esc(how.kicker || 'The Process')}</div>
      <h2>${esc(how.title || '')}</h2>
    </div>
    <div class="steps-grid">${arr(how.steps).map(s => `<div class="step-card"><div class="step-badge">${esc(s.badge)}</div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div>`).join('\n')}
    </div>
    <p style="text-align:center;margin-top:28px"><a href="/packages/#deliverables" class="btn-secondary">See exactly what each episode includes →</a></p>
  </div>
</section>

<!-- Explore: one-line links into each division -->
<section id="explore" style="padding-top:72px;background:var(--bg-section-tint);border-bottom:1px solid var(--border-light)">
  <div class="wrap">
    <div class="section-head">
      <div class="kicker">Explore</div>
      <h2>Pick where to go next</h2>
    </div>
    <div class="explore-grid">
      <a class="explore-card" href="/samples/"><div class="ex-ico">🎬</div><b>Samples</b><p>Before &amp; after video, vertical reels, graphics, show notes and emails.</p><span class="ex-go">View samples</span></a>
      <a class="explore-card" href="/packages/"><div class="ex-ico">📦</div><b>Packages</b><p>Simple monthly plans, plus how it works and what every episode gets.</p><span class="ex-go">See plans</span></a>
      <a class="explore-card" href="/testimonials/"><div class="ex-ico">💬</div><b>Testimonials</b><p>What partners say about working together.</p><span class="ex-go">Read them</span></a>
      <a class="explore-card" href="/about/"><div class="ex-ico">👤</div><b>About</b><p>The person behind the edits, and why I do this solo.</p><span class="ex-go">Meet me</span></a>
    </div>
  </div>
</section>
${ctaBanner()}`;
}

// ================= SAMPLES =================
function samplesMain() {
  const c = SAMPLES.compare || {};
  const r = SAMPLES.reels || {};
  const g = SAMPLES.graphics || {};
  const sn = SAMPLES.show_notes || {};
  const em = SAMPLES.email || {};
  const chapters = arr(sn.sample && sn.sample.chapters).map(ch => `<div class="chap"><span class="ct">${esc(ch.time)}</span><span>${esc(ch.title)}</span></div>`).join('');
  return pageHero(SAMPLES.kicker || 'Work Samples', SAMPLES.title || 'Real production output', SAMPLES.subtitle || '') + `
<div class="wrap">
  ${(SAMPLES.featured && SAMPLES.featured.enabled && SAMPLES.featured.video) ? `<div style="background:var(--bg-surface-solid);border:1px solid var(--border-light);border-radius:20px;padding:32px;box-shadow:var(--shadow-sm);margin-bottom:32px;text-align:center"><div style="font-size:11.5px;font-weight:800;text-transform:uppercase;color:var(--accent-dark);letter-spacing:0.06em;margin-bottom:6px">Featured Work</div><iframe class="portfolio-media" height="380" src="${esc(SAMPLES.featured.video)}" title="Featured sample" frameborder="0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen style="width:100%;border-radius:16px;border:1px solid var(--border-light)"></iframe></div>` : ''}

  <div id="compare" style="background:var(--bg-surface-solid);border:1px solid var(--border-light);border-radius:20px;padding:40px;box-shadow:var(--shadow-sm);margin-bottom:32px">
    <div style="text-align:center;margin-bottom:32px">
      <div style="font-size:11.5px;font-weight:800;text-transform:uppercase;color:var(--accent-dark);letter-spacing:0.06em;margin-bottom:8px">${esc(c.label)}</div>
      <h3 style="font-size:22px;font-weight:800;color:var(--text-main)">${esc(c.headline)}</h3>
    </div>
    <div class="portfolio-grid">
      <div><div style="display:inline-block;background:#F3F0F2;color:var(--text-muted);font-size:12px;font-weight:700;padding:4px 12px;border-radius:6px;margin-bottom:12px">${esc(c.before_label)}</div><iframe class="portfolio-media" height="280" src="${esc(c.before_video)}" title="Raw Video" frameborder="0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe><p style="font-size:14px;color:var(--text-body);line-height:1.5">${inlineMD(c.before_caption || '')}</p></div>
      <div><div style="display:inline-block;background:var(--accent-soft);color:var(--accent-dark);font-size:12px;font-weight:800;padding:4px 12px;border-radius:6px;margin-bottom:12px">${esc(c.after_label)}</div><iframe class="portfolio-media" height="280" src="${esc(c.after_video)}" title="Edited Video" frameborder="0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe><p style="font-size:14px;color:var(--text-body);line-height:1.5">${inlineMD(c.after_caption || '')}</p></div>
    </div>
  </div>

  <div class="reel-grid" id="reels" style="background:var(--bg-surface-solid);border:1px solid var(--border-light);border-radius:20px;padding:40px;box-shadow:var(--shadow-sm);margin-bottom:32px">
    <div>
      <div style="font-size:11.5px;font-weight:800;text-transform:uppercase;color:var(--gold);letter-spacing:0.06em;margin-bottom:8px">${esc(r.label)}</div>
      <h3 style="font-size:24px;font-weight:800;color:var(--text-main);margin-bottom:16px">${esc(r.headline)}</h3>
      <p style="font-size:15px;color:var(--text-body);line-height:1.6;margin-bottom:16px">${esc(r.text)}</p>
      <ul style="list-style:none;display:flex;flex-direction:column;gap:10px">${strList(r.bullets).map(b => `<li style="display:flex;gap:10px;font-size:14.5px;color:var(--text-muted)"><span style="color:var(--accent);font-weight:800">✓</span> ${esc(b)}</li>`).join('')}</ul>
    </div>
    <div style="text-align:center"><iframe width="100%" style="max-width:280px;height:480px;border-radius:16px;border:4px solid var(--bg-card-soft);box-shadow:var(--shadow-md)" src="${esc(r.video)}" title="YouTube Short" frameborder="0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe></div>
  </div>

  <div id="graphics" style="background:var(--bg-surface-solid);border:1px solid var(--border-light);border-radius:20px;padding:40px;box-shadow:var(--shadow-sm);margin-bottom:32px">
    <div style="text-align:center;margin-bottom:32px"><div style="font-size:11.5px;font-weight:800;text-transform:uppercase;color:var(--gold);letter-spacing:0.06em;margin-bottom:8px">${esc(g.label)}</div><h3 style="font-size:22px;font-weight:800;color:var(--text-main)">${esc(g.headline)}</h3></div>
    <div class="samples-grid-3">${arr(g.items).map(it => {
      const imgEl = `<img src="${esc(asset(it.image))}" alt="${esc(it.alt)}" loading="lazy" style="width:100%;border-radius:12px;border:1px solid var(--border-light);box-shadow:var(--shadow-sm);margin-bottom:12px">`;
      return `<div>${it.link ? `<a href="${esc(it.link)}" target="_blank" rel="noopener" style="display:block;text-decoration:none">${imgEl}</a>` : imgEl}<p style="font-size:13.5px;color:var(--text-body);line-height:1.5;text-align:center">${inlineMD(it.caption || '')}</p></div>`;
    }).join('')}</div>
    <p style="font-size:13px;color:var(--text-muted);text-align:center;margin-top:20px">${esc(g.note)}</p>
  </div>

  <div id="show-notes" style="background:var(--bg-section-tint);border:1px solid var(--border-light);border-radius:20px;padding:40px;box-shadow:var(--shadow-sm);margin-bottom:32px">
    <div style="text-align:center;margin-bottom:28px"><div style="font-size:11.5px;font-weight:800;text-transform:uppercase;color:var(--accent-dark);letter-spacing:0.06em;margin-bottom:8px">${esc(sn.label)}</div><h3 style="font-size:22px;font-weight:800;color:var(--text-main)">${esc(sn.headline)}</h3><p style="font-size:14.5px;color:var(--text-body);max-width:60ch;margin:10px auto 0">${esc(sn.text)}</p></div>
    <div class="sample-doc" style="max-width:760px;margin:0 auto">
      <div class="doc-bar"><i class="d1"></i><i class="d2"></i><i class="d3"></i></div>
      <div class="doc-body">
        <h4>${esc((sn.sample && sn.sample.episode) || '')}</h4>
        <p class="doc-summary">${esc((sn.sample && sn.sample.summary) || '')}</p>
        <div class="chapter-list">${chapters}</div>
        <div class="doc-meta"><strong>Keywords:</strong> ${esc((sn.sample && sn.sample.keywords) || '')}</div>
      </div>
    </div>
    <p style="font-size:12.5px;color:var(--text-muted);text-align:center;margin-top:20px">${esc(sn.note)}</p>
  </div>

  <div id="email" style="background:var(--bg-section-tint);border:1px solid var(--border-light);border-radius:20px;padding:40px;box-shadow:var(--shadow-sm);margin-bottom:32px">
    <div style="text-align:center;margin-bottom:28px"><div style="font-size:11.5px;font-weight:800;text-transform:uppercase;color:var(--gold);letter-spacing:0.06em;margin-bottom:8px">${esc(em.label)}</div><h3 style="font-size:22px;font-weight:800;color:var(--text-main)">${esc(em.headline)}</h3><p style="font-size:14.5px;color:var(--text-body);max-width:60ch;margin:10px auto 0">${esc(em.text)}</p></div>
    <div class="sample-email" style="max-width:720px;margin:0 auto">
      <div class="email-head"><div class="subj">${esc((em.sample && em.sample.subject) || '')}</div><div class="prev">${esc((em.sample && em.sample.preview) || '')}</div></div>
      <div class="email-body"><h4>${esc((em.sample && em.sample.headline) || '')}</h4><p>${esc((em.sample && em.sample.body) || '')}</p></div>
    </div>
    <p style="font-size:12.5px;color:var(--text-muted);text-align:center;margin-top:20px">${esc(em.note)}</p>
  </div>

  <div class="distinction-note" style="margin-top:16px"><div class="dn-icon" aria-hidden="true">🎬</div><div class="dn-body"><span class="dn-label">Optional Extras</span><p><strong>B-roll and brand-specific styling can be added</strong> ${esc(SAMPLES.broll_note || '')}</p></div></div>

  <div class="distinction-note gold"><div class="dn-icon" aria-hidden="true">🎨</div><div class="dn-body"><span class="dn-label">${esc(SAMPLES.style_label || '')}</span><p><strong>What's shown above is our standard process</strong> ${esc(SAMPLES.style_note || '')}</p></div></div>
</div>
${ctaBanner()}`;
}

// ================= PACKAGES =================
function packagesMain() {
  return pageHero(PACKAGES.kicker || 'Packages', PACKAGES.title || 'Simple monthly plans', PACKAGES.subtitle || '') + `
<div class="wrap">
  <!-- PACKAGES / PRICING: right up top -->
  <div class="pkg-grid" style="margin-top:8px">${arr(PACKAGES.plans).map(p => {
    const pill = p.pill ? `<div class="pkg-pill ${p.pill_class || ''}">${esc(p.pill)}</div>` : '';
    const pop = p.pill_class === 'featured' ? `<div class="pkg-pop">Most popular</div>` : '';
    return `<div class="pkg-card ${p.pill_class === 'featured' ? 'featured' : (p.pill_class === 'gold' ? 'founder' : '')}">${pill}
      ${pop}
      <h3>${esc(p.name)}</h3><div class="pkg-desc">${esc(p.description)}</div>
      <div class="pkg-price">${esc(p.price)}<span> / month</span></div>
      <div class="founding-badge-inline">✦ ${esc(p.badge)}</div>
      <ul>${strList(p.features).map(f => `<li><span class="check">✓</span><span class="text">${esc(f)}</span></li>`).join('')}</ul>
      <a href="${esc(p.cta_link)}" target="_blank" rel="noopener" class="btn-pkg">${esc(p.cta)}</a>
    </div>`;
  }).join('')}</div>

  <div style="border:2px solid var(--accent-dark);border-radius:16px;padding:22px 28px;margin-top:32px;max-width:700px;margin-left:auto;margin-right:auto;background:var(--bg-surface-solid)">
    <div style="font-size:11.5px;font-weight:800;text-transform:uppercase;color:var(--accent-dark);letter-spacing:0.06em;margin-bottom:8px">${esc((PACKAGES.deposit_note || {}).label || '')}</div>
    <p style="font-size:14.5px;color:var(--text-main);line-height:1.6;margin:0"><strong>${esc((PACKAGES.deposit_note || {}).text || '')}</strong></p>
  </div>
  <p style="text-align:center;font-size:14px;color:var(--text-muted);max-width:620px;margin:28px auto 0;line-height:1.6">${esc(PACKAGES.style_note || '')}</p>

  <!-- How It Works + Asset Matrix + FAQ below the pricing -->
  <section id="how-it-works" style="padding:64px 0 8px;margin-top:48px;border-top:1px solid var(--border-light)">
    <div class="section-head">
      <div class="kicker">${esc(how.kicker || 'The Process')}</div>
      <h2>${esc(how.title || '')}</h2>
      <p class="section-sub">${esc(how.subtitle || '')}</p>
    </div>
    <div class="steps-grid">${arr(how.steps).map(s => `<div class="step-card"><div class="step-badge">${esc(s.badge)}</div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div>`).join('\n')}
    </div>
  </section>

  <div class="engine-showcase" id="deliverables" style="margin-top:40px">
    <div class="engine-title"><h3>${esc(matrix.title || '')}</h3><span>${esc(matrix.note || '')}</span></div>
    <div class="asset-matrix">${arr(matrix.items).map(m => `<div class="asset-item"><div class="asset-icon">${esc(m.num)}</div><div><b>${esc(m.name)}</b><small>${esc(m.text)}</small></div></div>`).join('\n')}
    </div>
  </div>

  <section id="faq" style="padding:64px 0 12px;margin-top:40px;border-top:1px solid var(--border-light)">
    <div class="section-head">
      <div class="kicker">${esc(faq.kicker || 'Questions')}</div>
      <h2>${esc(faq.title || '')}</h2>
    </div>
    <div class="faq-grid">${arr(faq.items).map(f => `<div class="faq-item"><h4>${esc(f.q)}</h4><p>${esc(f.a)}</p></div>`).join('\n')}
    </div>
  </section>
</div>
${ctaBanner()}`;
}

// ================= TESTIMONIALS =================
function initials(n) {
  return String(n || '').trim().split(/\s+/).map(w => w.charAt(0)).slice(0, 2).join('').toUpperCase() || '??';
}
function stars(n) {
  n = Number(n) || 0; if (n <= 0) return '';
  return `<div class="t-stars" aria-label="${n} out of 5">${'★'.repeat(Math.min(5, n))}${n < 5 ? '☆'.repeat(5 - n) : ''}</div>`;
}
function testimonialsMain() {
  const list = listRun(TEST_DIR).map(t => ({ ...t, _i: initials(t.data.name) }));
  // featured = first with featured:true, else first
  const feat = list.find(t => t.data.featured) || list[0] || null;
  const rest = list.filter(t => t !== feat);
  const card = (t) => {
    const q = esc(t.data.quote || t.body || '');
    return `<div class="t-card"><div class="quote-mark">“</div>${stars(t.data.rating)}<blockquote>${q}</blockquote>${t.data.result ? `<div class="t-result">${esc(t.data.result)}</div>` : ''}<div class="t-foot"><div class="tav">${t._i}</div><div class="t-block"><div class="t-name">${esc(t.data.name || 'Client')}</div>${t.data.role ? `<div class="t-role">${esc(t.data.role)}</div>` : ''}</div>${t.data.service ? `<span class="t-chip">${esc(t.data.service)}</span>` : ''}</div></div>`;
  };
  const featureBlock = feat ? `
  <div class="t-featured">
    <span class="quote-mark">“</span>
    <blockquote>${esc(feat.data.quote || feat.body || '')}</blockquote>
    ${feat.data.result ? `<div class="t-result">${esc(feat.data.result)}</div>` : ''}
    <div class="t-foot"><div class="tav">${feat._i}</div><div><div class="t-name">${esc(feat.data.name || 'Client')}</div>${feat.data.role ? `<div class="t-role">${esc(feat.data.role)}</div>` : ''}</div>${feat.data.service ? `<span class="t-chip">${esc(feat.data.service)}</span>` : ''}</div>
  </div>` : '';
  return pageHero('Testimonials', 'What partners say', 'This page is set up and ready to grow. Real words from real collaborators will fill it in as the studio takes on its first partners.') + `
<div class="wrap">
  <p class="t-cap" style="margin-bottom:34px">You're seeing how a testimonial will look, not a fabricated client. The card below is a labeled layout preview. When a genuine partner leaves a testimonial, it appears here with their name, role, and a measurable result.</p>
  ${featureBlock}
  ${list.length ? `<div class="testimonials-grid">${rest.length ? rest.map(card).join('') : (feat ? '' : card(feat))}</div>` : `<div class="t-cap">Client testimonials are coming soon once the first partners are onboarded.</div>`}
  <p class="t-cap" style="margin-top:34px">This section grows one testimonial at a time, as I take on my first partners. Book a discovery call to be the first.</p>
</div>
${ctaBanner()}`;
}

// ================= ABOUT =================
function aboutMain() {
  return pageHero(about.kicker || 'About the Producer', about.title || 'The person behind the edits', '') + `
<div class="wrap">
  <!-- About: single, clean section -->
  <section id="about" style="padding-top:12px;padding-bottom:16px">
    <div class="about-box">
      <div class="about-grid">
        <div class="about-portrait">
          <img src="${esc(asset(aport.image || 'images/producer-portrait.png'))}" alt="John Lloyd Sarez, founder of PlayPress Studio" loading="lazy" width="400" height="500">
          <div class="badge-name">${esc(aport.name || 'John Lloyd Sarez')}<small>${esc(aport.role || 'Founder & Producer')}</small></div>
        </div>
        <div class="about-text">
          <div class="kicker">${esc(about.kicker || 'About the Producer')}</div>
          <h2>${esc(about.title || '')}</h2>
          <div id="bio">${strList(about.bio).map(p => `<p>${inlineMD(p)}</p>`).join('\n          ')}</div>
          <div class="about-fun" id="fun-note">${inlineMD(afun.fun_note || '')}</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Credentials: own section, own heading, own card grid -->
  <section id="credentials" style="padding:8px 0 0">
    <div class="section-head">
      <div class="kicker">Credentials</div>
      <h2>What's behind the craft</h2>
    </div>
    <div class="creds-row">${arr(acreds.credentials).map(c => `<div class="cred-card${c.gold ? ' gold' : ''}"><div class="cred-card-head"><strong>${esc(c.title)}</strong><span class="cred-tag">${esc(c.tag)}</span></div><span>${esc(c.text)}</span></div>`).join('')}
    </div>
  </section>
</div>
${ctaBanner()}`;
}

// ================= BUILD =================
rmrf(DIST);
fs.mkdirSync(path.join(DIST, 'blog'), { recursive: true });
['images', 'samples', 'admin'].forEach(d => { if (fs.existsSync(path.join(ROOT, d))) fs.cpSync(path.join(ROOT, d), path.join(DIST, d), { recursive: true }); });
['favicon-16.png','favicon-32.png','favicon-48.png','favicon-180.png','favicon-512.png','logo-mark.png','og-image.png','robots.txt','sitemap.xml'].forEach(f => { if (fs.existsSync(path.join(ROOT, f))) fs.copyFileSync(path.join(ROOT, f), path.join(DIST, f)); });

write(`index.html`, shell({
  active: 'home', title: seo.title || NAME + ' | Podcasting, Done Right!',
  desc: DEFAULT_DESC, url: DOMAIN + '/', main: homeMain()
}));

write(`samples/index.html`, shell({
  active: 'samples', title: 'Samples | ' + NAME,
  desc: 'Before and after podcast edits, vertical reels, branded graphics, show notes, and email newsletters produced by ' + NAME + '.',
  url: DOMAIN + '/samples/', main: samplesMain()
}));

write(`packages/index.html`, shell({
  active: 'packages', title: 'Packages | ' + NAME,
  desc: 'Simple monthly podcast production plans: full audio and video edits, reels, show notes, graphics, and social scheduling.',
  url: DOMAIN + '/packages/', main: packagesMain()
}));

write(`testimonials/index.html`, shell({
  active: 'testimonials', title: 'Testimonials | ' + NAME,
  desc: 'What partners and collaborators say about working with ' + NAME + '.',
  url: DOMAIN + '/testimonials/', main: testimonialsMain()
}));

write(`about/index.html`, shell({
  active: 'about', title: 'About | ' + NAME,
  desc: 'Meet the solo producer behind ' + NAME + '. The story, the credentials, and how the studio works.',
  url: DOMAIN + '/about/', main: aboutMain()
}));

// ---- Blog listing ----
const posts = listRun(BLOG_DIR).sort((a, b) => (new Date(b.data.date || 0).getTime()) - (new Date(a.data.date || 0).getTime()));
const usedSlugs = {};
posts.forEach(p => {
  const base = slug(p.data.title || 'post');
  let s = base, n = 2;
  while (usedSlugs[s]) { s = base + '-' + (n++); }
  usedSlugs[s] = true; p._slug = s;
});
// Reactions: per-post, stored on-device (localStorage). Upgradable to a public
// count with a Cloudflare Worker + D1 later — see DEPLOY-README.
const REACTIONS = [
  { emoji: '👍', label: 'Helpful' },
  { emoji: '❤️', label: 'Love it' },
  { emoji: '🤯', label: 'Mind blown' },
  { emoji: '👏', label: 'Claps' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '🤔', label: 'Thinking' }
];
function reactionsHTML(slug) {
  const btns = REACTIONS.map(r => `<button class="reaction" data-emoji="${r.emoji}" aria-pressed="false" aria-label="${esc(r.label)}"><span class="r-emoji">${r.emoji}</span><span class="r-count">0</span></button>`).join('');
  return `<div class="reactions" data-slug="${esc(slug)}">
    <div class="r-head"><b>What did you think?</b><span>Tap to react</span></div>
    <div class="r-buttons">${btns}</div>
    <div class="r-note">Your reactions are saved on this device so they're there when you come back.</div>
  </div>`;
}
const card = (p, cls) => {
  const date = safeDate(p.data.date);
  const img = p.data.image ? `<div class="post-media"><img class="post-thumb" src="${esc(asset(p.data.image))}" alt="${esc(p.data.title)}" loading="lazy"></div>` : '';
  return `<a class="post-card ${cls || ''}" href="/blog/${p._slug}/">${img}<div class="post-card-body"><h3>${esc(p.data.title)}</h3>${date ? `<div class="post-date">${esc(date)}</div>` : ''}${p.data.excerpt ? `<p>${esc(p.data.excerpt)}</p>` : ''}<span class="post-card-more">Read article</span></div></a>`;
};
const featuredPost = posts[0];
const featHtml = featuredPost ? `
<div class="blog-featured">
  <a href="/blog/${featuredPost._slug}/" class="bf-media" style="display:block;text-decoration:none">${featuredPost.data.image ? `<img src="${esc(asset(featuredPost.data.image))}" alt="${esc(featuredPost.data.title)}" loading="lazy">` : ''}</a>
  <div class="bf-body"><div class="bf-tag">Latest</div><h2>${esc(featuredPost.data.title)}</h2><p>${esc(featuredPost.data.excerpt || '')}</p><span class="post-card-more">Read article</span></div>
</div>` : '';

write(`blog/index.html`, shell({
  active: 'blog', title: 'Blog | ' + NAME,
  desc: 'Notes on podcast editing, production, growth, and showing up consistently. Written by ' + NAME + '.',
  url: DOMAIN + '/blog/', main: pageHero('Blog', 'Notes from the studio', 'Practical takes on podcast editing, growth, and consistency.') + `
<div class="wrap"><div class="blog-wrap">
  ${featHtml}
  <div class="posts">${posts.slice(1).map(p => card(p)).join('') || '<p style="color:var(--text-muted)">No posts yet.</p>'}</div>
</div></div>`
}));

// ---- Blog posts ----
posts.forEach(p => {
  const dir = path.join(DIST, 'blog', p._slug);
  fs.mkdirSync(dir, { recursive: true });
  const t = p.data;
  const title = esc(t.title || 'Untitled');
  const body = renderBody(p.body);
  const img = p.data.image ? `<img class="post-hero" src="${esc(asset(p.data.image))}" alt="${esc(p.data.title)}">` : '';
  const idx = posts.findIndex(x => x._slug === p._slug);
  const prev = posts[idx + 1], next = posts[idx - 1];
  const postNav = `<div class="post-nav">${next ? `<a href="/blog/${next._slug}/">← ${esc(next.data.title)}</a>` : ''}${prev ? `<a href="/blog/${prev._slug}/">${esc(prev.data.title)} →</a>` : ''}</div>`;
  write(`blog/${p._slug}/index.html`, shell({
    active: 'blog', title: `${title} | ${NAME}`, desc: esc(t.excerpt || t.title || ''),
    url: DOMAIN + '/blog/' + p._slug + '/',
    ogimg: t.image ? asset(t.image) : DEFAULT_OG,
    main: `<div class="wrap"><div class="blog-wrap">
      <div style="padding:8px 0 0"><a href="/blog/" style="color:var(--text-muted);font-weight:600;text-decoration:none">← All posts</a></div>
      <article>
        <h1 class="post-title">${title}</h1>
        ${t.date ? `<div class="post-date">${esc(safeDate(t.date))}</div>` : ''}
        ${img}
        <div class="post-body">${body}</div>
        ${reactionsHTML(p._slug)}
      </article>
      ${postNav}
    </div></div>`
  }));
});

function write(rel, html) {
  const f = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, html);
}

console.log('Built site: home, samples, packages, testimonials, about + ' + posts.length + ' blog posts.');
