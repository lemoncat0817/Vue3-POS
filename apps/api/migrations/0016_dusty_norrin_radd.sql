CREATE TABLE `dining_tables` (
	`id` text PRIMARY KEY NOT NULL,
	`table_number` text NOT NULL,
	`seats` integer NOT NULL,
	`status` text DEFAULT 'empty' NOT NULL,
	`note` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `table_number` text;