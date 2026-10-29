CREATE TABLE `atlas_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#d4a017' NOT NULL,
	`icon` text DEFAULT 'map-pin' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `atlas_maps` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer NOT NULL,
	`name` text NOT NULL,
	`image_url` text,
	`width` integer DEFAULT 0 NOT NULL,
	`height` integer DEFAULT 0 NOT NULL,
	`parent_map_id` integer,
	`source_location_id` integer,
	`reveal_to_players` integer DEFAULT false NOT NULL,
	`revealed_at` integer,
	`fog_enabled` integer DEFAULT false NOT NULL,
	`fog` text NOT NULL,
	`player_image_url` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`parent_map_id`) REFERENCES `atlas_maps`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`source_location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `atlas_markers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`map_id` integer NOT NULL,
	`x` real NOT NULL,
	`y` real NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`dm_notes` text DEFAULT '' NOT NULL,
	`category_id` integer,
	`icon` text,
	`color` text,
	`link_type` text,
	`link_id` integer,
	`portal_map_id` integer,
	`hidden` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`map_id`) REFERENCES `atlas_maps`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `atlas_categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`portal_map_id`) REFERENCES `atlas_maps`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
-- Carry the old World image maps into the atlas. Nothing in `locations` is
-- changed or dropped: locations stay records, and their old map columns are
-- left exactly as they were (grid_data included) for safety.
INSERT INTO `atlas_maps` (`campaign_id`, `name`, `image_url`, `width`, `height`, `source_location_id`, `fog`, `created_at`, `updated_at`)
SELECT `campaign_id`, `name`, `map_image_url`, 0, 0, `id`, '[]', `created_at`, `updated_at`
FROM `locations`
WHERE `map_image_url` IS NOT NULL AND trim(`map_image_url`) != '';
--> statement-breakpoint
-- Nesting: a map's parent is the map of its nearest ancestor location that had one.
UPDATE `atlas_maps` SET `parent_map_id` = (
  WITH RECURSIVE `anc`(`ancestor_id`, `depth`) AS (
    SELECT `l`.`parent_location_id`, 1 FROM `locations` `l` WHERE `l`.`id` = `atlas_maps`.`source_location_id`
    UNION ALL
    SELECT `l`.`parent_location_id`, `anc`.`depth` + 1
    FROM `anc` JOIN `locations` `l` ON `l`.`id` = `anc`.`ancestor_id`
    WHERE `anc`.`depth` < 64
  )
  SELECT `pm`.`id` FROM `anc` JOIN `atlas_maps` `pm` ON `pm`.`source_location_id` = `anc`.`ancestor_id`
  ORDER BY `anc`.`depth` LIMIT 1
)
WHERE `source_location_id` IS NOT NULL;
--> statement-breakpoint
-- Pins become markers. Pins were already stored as 0–1 fractions of the image.
INSERT INTO `atlas_markers` (`map_id`, `x`, `y`, `title`, `description`, `color`, `created_at`, `updated_at`)
SELECT
  `m`.`id`,
  min(max(coalesce(CAST(json_extract(`p`.`value`, '$.x') AS REAL), 0.5), 0), 1),
  min(max(coalesce(CAST(json_extract(`p`.`value`, '$.y') AS REAL), 0.5), 0), 1),
  coalesce(json_extract(`p`.`value`, '$.label'), ''),
  coalesce(json_extract(`p`.`value`, '$.description'), ''),
  json_extract(`p`.`value`, '$.color'),
  `l`.`updated_at`,
  `l`.`updated_at`
FROM `atlas_maps` `m`
JOIN `locations` `l` ON `l`.`id` = `m`.`source_location_id`
JOIN json_each(CASE WHEN json_valid(`l`.`map_pins`) THEN `l`.`map_pins` ELSE '[]' END) `p`
WHERE json_type(`p`.`value`) = 'object';
