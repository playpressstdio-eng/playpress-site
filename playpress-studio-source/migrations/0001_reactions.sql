-- Blog post reactions — initial schema for Cloudflare D1.
-- Run this once in the D1 dashboard ("Console" tab) or via wrangler:
--   npx wrangler d1 execute playpress-reactions --file=migrations/0001_reactions.sql

CREATE TABLE IF NOT EXISTS reactions (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  slug  TEXT    NOT NULL,
  emoji TEXT    NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  UNIQUE(slug, emoji)
);

CREATE INDEX IF NOT EXISTS idx_reactions_slug ON reactions(slug);
