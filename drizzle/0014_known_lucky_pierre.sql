CREATE TABLE `character_resources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`character_id` integer NOT NULL,
	`name` text NOT NULL,
	`max` integer DEFAULT 1 NOT NULL,
	`used` integer DEFAULT 0 NOT NULL,
	`recharge` text DEFAULT 'long' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE cascade
);
