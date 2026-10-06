CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`visitor_id` text NOT NULL,
	`occurred_at` integer NOT NULL,
	`received_at` integer NOT NULL,
	`type` text NOT NULL,
	`page` text NOT NULL,
	`cta_id` text,
	`label` text,
	`target` text,
	`language` text NOT NULL,
	`branch` text
);
--> statement-breakpoint
CREATE INDEX `events_time` ON `events` (`occurred_at`);--> statement-breakpoint
CREATE INDEX `events_session` ON `events` (`session_id`);--> statement-breakpoint
CREATE INDEX `events_visitor` ON `events` (`visitor_id`);--> statement-breakpoint
CREATE TABLE `media` (
	`id` text PRIMARY KEY NOT NULL,
	`object_key` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `members` (
	`user_id` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`display_name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`draft` text NOT NULL,
	`published` text,
	`version` integer DEFAULT 1 NOT NULL,
	`archived` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`published_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `posts_slug_unique` ON `posts` (`slug`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`visitor_id` text NOT NULL,
	`started_at` integer NOT NULL,
	`last_at` integer NOT NULL,
	`entry_path` text NOT NULL,
	`language` text NOT NULL,
	`device` text NOT NULL,
	`referrer` text,
	`link_id` text,
	`internal` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sessions_time` ON `sessions` (`started_at`);--> statement-breakpoint
CREATE INDEX `sessions_visitor` ON `sessions` (`visitor_id`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tracking_links` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`destination` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `visitors` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text,
	`kind` text NOT NULL,
	`first_seen` integer NOT NULL,
	`last_seen` integer NOT NULL
);
