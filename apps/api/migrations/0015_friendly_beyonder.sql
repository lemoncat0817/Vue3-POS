CREATE TABLE `invoice_tracks` (
	`id` text PRIMARY KEY NOT NULL,
	`track_code` text NOT NULL,
	`period_label` text NOT NULL,
	`range_start` integer NOT NULL,
	`range_end` integer NOT NULL,
	`current_number` integer NOT NULL,
	`is_active` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `invoice_status` text DEFAULT 'issued' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `invoice_submitted_at` text;