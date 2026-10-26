ALTER TABLE `encounters` ADD `is_template` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `roll_tables` ADD `location_id` integer REFERENCES locations(id) ON DELETE set null;