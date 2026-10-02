-- Media uploads, article bodies, video links and site settings.
-- One-time migration: ALTER TABLE has no IF NOT EXISTS in MySQL, so this
-- expects to run once against the schema created by 0000_init.sql.
-- Run with: mysql -u root kashmir_connect < drizzle/0001_media_settings_video.sql

ALTER TABLE `stories`
  ADD COLUMN `body` mediumtext,
  ADD COLUMN `hero_image_url` varchar(512),
  ADD COLUMN `video_url` varchar(512),
  ADD COLUMN `video_provider` varchar(32),
  ADD COLUMN `video_id` varchar(255),
  ADD COLUMN `video_title` varchar(255);

CREATE TABLE IF NOT EXISTS `media` (
  `id` char(36) NOT NULL,
  `kind` varchar(16) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `mime` varchar(127) NOT NULL,
  `size_bytes` bigint NOT NULL,
  `width` int,
  `height` int,
  `url` varchar(512) NOT NULL,
  `created_by` char(36),
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `media_filename_uq` (`filename`),
  KEY `media_created_idx` (`created_at`),
  KEY `media_kind_idx` (`kind`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `settings` (
  `key` varchar(64) NOT NULL,
  `value` json NOT NULL,
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
