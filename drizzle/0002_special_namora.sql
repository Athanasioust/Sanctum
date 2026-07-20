CREATE TABLE `combat_log_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`encounter_id` integer NOT NULL,
	`round` integer DEFAULT 1 NOT NULL,
	`actor_name` text DEFAULT '' NOT NULL,
	`action` text DEFAULT '' NOT NULL,
	`details` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`encounter_id`) REFERENCES `encounters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `handouts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer NOT NULL,
	`title` text NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`image_url` text,
	`is_revealed` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `magic_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer NOT NULL,
	`character_id` integer,
	`name` text NOT NULL,
	`item_type` text DEFAULT 'wondrous' NOT NULL,
	`rarity` text DEFAULT 'common' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`requires_attunement` integer DEFAULT false NOT NULL,
	`is_attuned` integer DEFAULT false NOT NULL,
	`charges` integer,
	`charges_max` integer,
	`recharge_condition` text DEFAULT '' NOT NULL,
	`is_cursed` integer DEFAULT false NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `npc_relationships` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer NOT NULL,
	`source_npc_id` integer NOT NULL,
	`target_npc_id` integer NOT NULL,
	`relationship_type` text DEFAULT 'ally' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_npc_id`) REFERENCES `npcs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target_npc_id`) REFERENCES `npcs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `quests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`sub_objectives` text NOT NULL,
	`linked_npc_ids` text NOT NULL,
	`linked_location_ids` text NOT NULL,
	`reward` text DEFAULT '' NOT NULL,
	`session_number` integer,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `rumors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer NOT NULL,
	`text` text NOT NULL,
	`source` text DEFAULT '' NOT NULL,
	`source_location_id` integer,
	`source_npc_id` integer,
	`is_followed_up` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`source_npc_id`) REFERENCES `npcs`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
ALTER TABLE `characters` ADD `currency` text DEFAULT '{"pp":0,"gp":0,"ep":0,"sp":0,"cp":0}' NOT NULL;--> statement-breakpoint
ALTER TABLE `characters` ADD `hit_dice_total` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `characters` ADD `hit_dice_used` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `combat_participants` ADD `concentration_spell` text;