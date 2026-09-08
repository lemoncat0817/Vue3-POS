CREATE TABLE `invoice_sequences` (
	`id` text PRIMARY KEY NOT NULL,
	`counter` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `invoice_number` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `invoice_carrier_type` text DEFAULT '無載具' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `invoice_carrier_value` text;