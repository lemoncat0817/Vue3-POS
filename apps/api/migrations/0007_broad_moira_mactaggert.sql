CREATE TABLE `order_refunds` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`amount` integer NOT NULL,
	`reason` text NOT NULL,
	`operator` text NOT NULL,
	`at` text NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `void_reason` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `voided_by` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `voided_at` text;