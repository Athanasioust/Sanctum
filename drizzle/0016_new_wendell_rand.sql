CREATE TABLE `clocks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer NOT NULL,
	`name` text NOT NULL,
	`segments` integer DEFAULT 4 NOT NULL,
	`filled` integer DEFAULT 0 NOT NULL,
	`color` text DEFAULT '#d4a017' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`reveal_to_players` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
