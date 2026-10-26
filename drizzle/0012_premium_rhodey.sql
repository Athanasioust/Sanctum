ALTER TABLE `combat_participants` ADD `legendary_actions_max` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `combat_participants` ADD `legendary_actions_used` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `combat_participants` ADD `has_lair_action` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `combat_participants` ADD `reaction_available` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `encounters` ADD `lair_turn_active` integer DEFAULT false NOT NULL;