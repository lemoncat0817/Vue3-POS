CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `modifier_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`selection_type` text NOT NULL,
	`required` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `modifier_options` (
	`id` text PRIMARY KEY NOT NULL,
	`group_id` text NOT NULL,
	`name` text NOT NULL,
	`price_delta` integer NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `modifier_groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `product_modifier_groups` (
	`product_id` text NOT NULL,
	`group_id` text NOT NULL,
	PRIMARY KEY(`product_id`, `group_id`),
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`group_id`) REFERENCES `modifier_groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	`name` text NOT NULL,
	`base_price` integer NOT NULL,
	`stock` integer,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `quick_discounts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`value` real NOT NULL
);
--> statement-breakpoint
DROP TABLE `catalog_groups`;--> statement-breakpoint
DROP TABLE `catalog_items`;--> statement-breakpoint
DROP TABLE `often_use_rates`;--> statement-breakpoint
ALTER TABLE `order_lines` ADD `quick_discount_id` text;--> statement-breakpoint
ALTER TABLE `order_lines` ADD `quick_discount_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `order_lines` DROP COLUMN `size`;--> statement-breakpoint
ALTER TABLE `order_lines` DROP COLUMN `current_discount_percent`;--> statement-breakpoint
ALTER TABLE `order_lines` DROP COLUMN `current_discount_money`;--> statement-breakpoint
ALTER TABLE `order_lines` DROP COLUMN `use_discount_percent`;--> statement-breakpoint
ALTER TABLE `order_lines` DROP COLUMN `use_discount_money`;--> statement-breakpoint
ALTER TABLE `order_lines` DROP COLUMN `use_discount_free`;--> statement-breakpoint
ALTER TABLE `order_lines` DROP COLUMN `eco_discount`;--> statement-breakpoint
ALTER TABLE `order_lines` DROP COLUMN `bottle_discount`;--> statement-breakpoint
ALTER TABLE `order_lines` DROP COLUMN `often_use_discount_1`;--> statement-breakpoint
ALTER TABLE `order_lines` DROP COLUMN `often_use_discount_2`;--> statement-breakpoint
ALTER TABLE `order_lines` DROP COLUMN `often_use_discount_3`;