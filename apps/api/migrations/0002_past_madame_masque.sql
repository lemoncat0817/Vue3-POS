ALTER TABLE `staff` ADD `pin_hash` text NOT NULL;--> statement-breakpoint
ALTER TABLE `staff` ADD `pin_salt` text NOT NULL;--> statement-breakpoint
ALTER TABLE `staff` ADD `failed_pin_attempts` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `staff` ADD `locked_until` text;