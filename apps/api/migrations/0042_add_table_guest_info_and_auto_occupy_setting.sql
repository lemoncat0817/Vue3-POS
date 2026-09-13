ALTER TABLE `dining_tables` ADD `guest_count` integer;--> statement-breakpoint
ALTER TABLE `dining_tables` ADD `occupied_at` text;--> statement-breakpoint
ALTER TABLE `dining_tables` ADD `reservation_phone` text;--> statement-breakpoint
ALTER TABLE `dining_tables` ADD `reservation_time` text;--> statement-breakpoint
ALTER TABLE `users` ADD `auto_occupy_table_on_checkout` integer DEFAULT true NOT NULL;