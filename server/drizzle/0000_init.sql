-- Initial schema for the Kashmir Connect API.
-- Equivalent to what `npm run db:push` generates from src/db/schema.ts.
-- Run against a fresh database: mysql -u root kashmir_connect < drizzle/0000_init.sql

CREATE TABLE IF NOT EXISTS `stories` (
  `id` char(36) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `category` varchar(64) NOT NULL,
  `title` varchar(255) NOT NULL,
  `summary` text NOT NULL,
  `author` varchar(128) NOT NULL,
  `published_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `image_key` varchar(64) NOT NULL,
  `featured` boolean NOT NULL DEFAULT false,
  `display_order` int NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `stories_slug_uq` (`slug`),
  KEY `stories_order_idx` (`featured`, `display_order`, `published_at`),
  KEY `stories_category_idx` (`category`, `published_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `admins` (
  `id` char(36) NOT NULL,
  `email` varchar(191) NOT NULL,
  `name` varchar(128) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(32) NOT NULL DEFAULT 'admin',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `admins_email_uq` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
