-- Per-story language.
--
-- Urdu stories live in the same columns as English ones; this flag is what
-- tells the site to render a story right-to-left in an Urdu typeface. Existing
-- rows default to 'en', so nothing already published changes.
--
-- One-time migration: ALTER TABLE has no IF NOT EXISTS in MySQL, so this
-- expects to run once.
-- Run with: mysql -u root kashmir_connect < drizzle/0002_story_language.sql

ALTER TABLE `stories`
  ADD COLUMN `language` varchar(8) NOT NULL DEFAULT 'en' AFTER `summary`;
