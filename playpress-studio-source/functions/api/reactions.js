// Cloudflare Pages Function — blog post reactions (global, server-tallied)
// Endpoint: /api/reactions
//   GET  /api/reactions?slug=<post-slug>          -> { emoji: count, ... }
//   POST /api/reactions  body {slug, emoji, delta} -> { emoji: newCount }
//
// Requires a D1 database bound to this Pages project with the variable name `DB`.
// Schema (run in D1, see the migration file or "Run SQL" in the dashboard):
//   CREATE TABLE IF NOT EXISTS reactions (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     slug TEXT NOT NULL,
//     emoji TEXT NOT NULL,
//     count INTEGER NOT NULL DEFAULT 0,
//     UNIQUE(slug, emoji)
//   );

// Whitelist of emoji the site renders, so arbitrary strings can't be written.
const ALLOWED = ['👍', '❤️', '🤯', '👏', '🔥', '🤔'];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

// Sanitize a slug: lowercase, keep letters/digits/hyphens, cap length.
function cleanSlug(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 120);
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  try {
    // Resolve the slug once. For GET it comes from the query string; for POST we
    // read the JSON body first and prefer its slug, falling back to the query.
    let body = {};
    if (request.method === 'POST') {
      try { body = await request.clone().json(); } catch (e) { return json({ error: 'bad_json' }, 400); }
    }
    const slug = cleanSlug(url.searchParams.get('slug') || body.slug);
    if (!slug) return json({ error: 'bad_slug' }, 400);

    // GET — return current counts for this post.
    if (request.method === 'GET') {
      const res = await env.DB
        .prepare('SELECT emoji, count FROM reactions WHERE slug = ?')
        .bind(slug)
        .all();
      const counts = {};
      for (const r of res.results) counts[r.emoji] = r.count;
      return json(counts);
    }

    // POST — increment/decrement a reaction.
    if (request.method === 'POST') {
      const emoji = String(body.emoji || '').slice(0, 8);
      if (!ALLOWED.includes(emoji)) return json({ error: 'bad_emoji' }, 400);
      const delta = Number(body.delta) > 0 ? 1 : -1;

      // Upsert, never letting a count go below 0.
      await env.DB
        .prepare(
          `INSERT INTO reactions (slug, emoji, count) VALUES (?, ?, ?)
           ON CONFLICT(slug, emoji) DO UPDATE SET count = MAX(0, count + excluded.count)`
        )
        .bind(slug, emoji, delta)
        .run();

      const row = await env.DB
        .prepare('SELECT count FROM reactions WHERE slug = ? AND emoji = ?')
        .bind(slug, emoji)
        .first();

      return json({ [emoji]: row ? row.count : 0 });
    }

    return json({ error: 'method_not_allowed' }, 405);
  } catch (e) {
    return json({ error: 'db_error', detail: String(e && e.message || e) }, 500);
  }
}
