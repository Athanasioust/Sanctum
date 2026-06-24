CREATE TABLE `backups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer,
	`file_path` text NOT NULL,
	`label` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `calendar_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`in_world_date` text,
	`real_date` text,
	`event_type` text DEFAULT 'other' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`setting` text DEFAULT '' NOT NULL,
	`in_world_calendar_type` text DEFAULT 'real' NOT NULL,
	`custom_calendar_config` text,
	`current_in_world_date` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `characters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer NOT NULL,
	`name` text NOT NULL,
	`race` text DEFAULT '' NOT NULL,
	`class` text DEFAULT '' NOT NULL,
	`subclass` text DEFAULT '' NOT NULL,
	`level` integer DEFAULT 1 NOT NULL,
	`background` text DEFAULT '' NOT NULL,
	`alignment` text DEFAULT '' NOT NULL,
	`experience_points` integer DEFAULT 0 NOT NULL,
	`proficiency_bonus` integer DEFAULT 2 NOT NULL,
	`str` integer DEFAULT 10 NOT NULL,
	`dex` integer DEFAULT 10 NOT NULL,
	`con` integer DEFAULT 10 NOT NULL,
	`int` integer DEFAULT 10 NOT NULL,
	`wis` integer DEFAULT 10 NOT NULL,
	`cha` integer DEFAULT 10 NOT NULL,
	`hp_max` integer DEFAULT 0 NOT NULL,
	`hp_current` integer DEFAULT 0 NOT NULL,
	`hp_temp` integer DEFAULT 0 NOT NULL,
	`armor_class` integer DEFAULT 10 NOT NULL,
	`speed` integer DEFAULT 30 NOT NULL,
	`initiative_bonus` integer DEFAULT 0 NOT NULL,
	`passive_perception` integer DEFAULT 10 NOT NULL,
	`saving_throw_proficiencies` text NOT NULL,
	`skill_proficiencies` text NOT NULL,
	`death_save_successes` integer DEFAULT 0 NOT NULL,
	`death_save_failures` integer DEFAULT 0 NOT NULL,
	`resistances` text NOT NULL,
	`immunities` text NOT NULL,
	`vulnerabilities` text NOT NULL,
	`languages` text NOT NULL,
	`features_and_traits` text NOT NULL,
	`ideals` text DEFAULT '' NOT NULL,
	`bonds` text DEFAULT '' NOT NULL,
	`flaws` text DEFAULT '' NOT NULL,
	`personality_traits` text DEFAULT '' NOT NULL,
	`feats` text NOT NULL,
	`multiclass_info` text NOT NULL,
	`conditions` text NOT NULL,
	`exhaustion_level` integer DEFAULT 0 NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `combat_participants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`encounter_id` integer NOT NULL,
	`entity_id` integer,
	`entity_type` text,
	`name` text NOT NULL,
	`initiative_roll` integer,
	`initiative_total` integer DEFAULT 0 NOT NULL,
	`hp_current` integer DEFAULT 0 NOT NULL,
	`hp_max` integer DEFAULT 0 NOT NULL,
	`hp_temp` integer DEFAULT 0 NOT NULL,
	`armor_class` integer DEFAULT 10 NOT NULL,
	`conditions` text NOT NULL,
	`exhaustion_level` integer DEFAULT 0 NOT NULL,
	`death_save_successes` integer DEFAULT 0 NOT NULL,
	`death_save_failures` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`turn_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`encounter_id`) REFERENCES `encounters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `encounters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`round_number` integer DEFAULT 1 NOT NULL,
	`current_turn_index` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `factions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`goals` text DEFAULT '' NOT NULL,
	`resources` text DEFAULT '' NOT NULL,
	`secrets` text DEFAULT '' NOT NULL,
	`relationship_with_players` text DEFAULT 'unknown' NOT NULL,
	`key_npc_ids` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `inventory_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_id` integer NOT NULL,
	`owner_type` text NOT NULL,
	`name` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`weight` real DEFAULT 0 NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`is_equipped` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `locations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`type` text DEFAULT 'location' NOT NULL,
	`parent_location_id` integer,
	`map_image_url` text,
	`map_pins` text NOT NULL,
	`grid_data` text,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`parent_location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`is_pinned` integer DEFAULT false NOT NULL,
	`color` text DEFAULT 'default' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `npcs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'npc' NOT NULL,
	`race` text DEFAULT '' NOT NULL,
	`class` text DEFAULT '' NOT NULL,
	`size` text DEFAULT 'Medium' NOT NULL,
	`alignment` text DEFAULT '' NOT NULL,
	`challenge_rating` text DEFAULT '' NOT NULL,
	`experience_points` integer DEFAULT 0 NOT NULL,
	`str` integer DEFAULT 10 NOT NULL,
	`dex` integer DEFAULT 10 NOT NULL,
	`con` integer DEFAULT 10 NOT NULL,
	`int` integer DEFAULT 10 NOT NULL,
	`wis` integer DEFAULT 10 NOT NULL,
	`cha` integer DEFAULT 10 NOT NULL,
	`hp_max` integer DEFAULT 0 NOT NULL,
	`hp_current` integer DEFAULT 0 NOT NULL,
	`armor_class` integer DEFAULT 10 NOT NULL,
	`speed` text DEFAULT '30 ft.' NOT NULL,
	`saving_throw_proficiencies` text NOT NULL,
	`skill_proficiencies` text NOT NULL,
	`resistances` text NOT NULL,
	`immunities` text NOT NULL,
	`vulnerabilities` text NOT NULL,
	`senses` text NOT NULL,
	`languages` text NOT NULL,
	`traits` text NOT NULL,
	`actions` text NOT NULL,
	`reactions` text NOT NULL,
	`legendary_actions` text NOT NULL,
	`lair_actions` text NOT NULL,
	`conditions` text NOT NULL,
	`exhaustion_level` integer DEFAULT 0 NOT NULL,
	`is_template` integer DEFAULT false NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `roll_tables` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`entries` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session_preps` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer NOT NULL,
	`session_number` integer,
	`session_date` text,
	`status` text DEFAULT 'planned' NOT NULL,
	`planned_encounters` text NOT NULL,
	`planned_npcs` text NOT NULL,
	`plot_points` text NOT NULL,
	`dm_notes` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `shop_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`shop_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`price` text DEFAULT '' NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`item_type` text DEFAULT '' NOT NULL,
	`rarity` text DEFAULT 'common' NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `shops` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`location_id` integer,
	`owner_npc_id` integer,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`owner_npc_id`) REFERENCES `npcs`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `spell_slots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_id` integer NOT NULL,
	`owner_type` text NOT NULL,
	`slot_level` integer NOT NULL,
	`total` integer DEFAULT 0 NOT NULL,
	`used` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `spells` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_id` integer NOT NULL,
	`owner_type` text NOT NULL,
	`name` text NOT NULL,
	`level` integer DEFAULT 0 NOT NULL,
	`school` text DEFAULT '' NOT NULL,
	`casting_time` text DEFAULT '' NOT NULL,
	`range` text DEFAULT '' NOT NULL,
	`components` text DEFAULT '' NOT NULL,
	`duration` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`is_prepared` integer DEFAULT false NOT NULL,
	`is_concentration` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `story_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer NOT NULL,
	`session_number` integer,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`event_type` text DEFAULT 'event' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`in_world_date` text,
	`real_date` text,
	`linked_npc_ids` text NOT NULL,
	`linked_location_ids` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
