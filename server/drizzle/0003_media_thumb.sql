-- A smaller copy of every uploaded image, so story cards do not download the
-- full-size file. NULL for videos, GIFs, and images already narrower than the
-- thumb width (or uploaded before this migration).
--
-- One-time migration: ALTER TABLE has no IF NOT EXISTS in MySQL, so this
-- expects to run once.
-- Run with: mysql -u root kashmir_connect < drizzle/0003_media_thumb.sql

ALTER TABLE `media`
  ADD COLUMN `thumb_url` varchar(512);
