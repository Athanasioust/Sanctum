CREATE TABLE `homebrew_feats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer NOT NULL,
	`name` text NOT NULL,
	`prerequisite` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `homebrew_spells` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer NOT NULL,
	`name` text NOT NULL,
	`level` integer DEFAULT 0 NOT NULL,
	`school` text DEFAULT '' NOT NULL,
	`casting_time` text DEFAULT '' NOT NULL,
	`range` text DEFAULT '' NOT NULL,
	`components` text DEFAULT '' NOT NULL,
	`duration` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`is_concentration` integer DEFAULT false NOT NULL,
	`classes` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `characters` ADD `weapon_masteries` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `magic_items` ADD `source` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `npcs` ADD `source` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `spells` ADD `source` text DEFAULT '' NOT NULL;