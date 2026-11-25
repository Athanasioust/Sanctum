CREATE TABLE `generator_lists` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer NOT NULL,
	`generator_id` text NOT NULL,
	`field_key` text NOT NULL,
	`entries` text NOT NULL,
	`mode` text DEFAULT 'mix' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `generator_lists_campaign_field_idx` ON `generator_lists` (`campaign_id`,`generator_id`,`field_key`);