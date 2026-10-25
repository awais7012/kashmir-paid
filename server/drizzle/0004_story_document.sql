-- A PDF attached to a story, shown as a download on the article page.
-- Used mostly by Library entries, which are documents as often as they are
-- articles. Null means "no document".
ALTER TABLE `stories` ADD COLUMN `document_url` varchar(512) NULL AFTER `video_title`;
