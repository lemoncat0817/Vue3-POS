CREATE TABLE `add_on_options` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`price` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `catalog_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `catalog_items` (
	`id` text PRIMARY KEY NOT NULL,
	`group_id` text NOT NULL,
	`name` text NOT NULL,
	`price_l` integer,
	`price_bottle` integer,
	`customized` text NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `catalog_groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `order_lines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` text NOT NULL,
	`name` text NOT NULL,
	`price` integer NOT NULL,
	`size` text NOT NULL,
	`count` integer NOT NULL,
	`discount` integer NOT NULL,
	`add_list` text NOT NULL,
	`add_list_price` integer NOT NULL,
	`total_price` integer NOT NULL,
	`current_discount_percent` real NOT NULL,
	`current_discount_money` real NOT NULL,
	`use_discount_percent` text NOT NULL,
	`use_discount_money` text NOT NULL,
	`use_discount_free` text NOT NULL,
	`free_discount` integer NOT NULL,
	`eco_discount` integer NOT NULL,
	`bottle_discount` integer NOT NULL,
	`often_use_discount_1` integer NOT NULL,
	`often_use_discount_2` integer NOT NULL,
	`often_use_discount_3` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`order_id` text PRIMARY KEY NOT NULL,
	`order_time` text NOT NULL,
	`order_status` text NOT NULL,
	`staff` text NOT NULL,
	`order_bag_count` integer NOT NULL,
	`order_cup_count` integer NOT NULL,
	`order_total_price` integer NOT NULL,
	`order_payment` text NOT NULL,
	`order_discount` integer NOT NULL,
	`order_payment_price` integer NOT NULL,
	`discount_name` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_idempotency_key_idx` ON `orders` (`idempotency_key`);--> statement-breakpoint
CREATE TABLE `staff` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`job_title` text NOT NULL,
	`account` text NOT NULL,
	`capabilities` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `staff_account_idx` ON `staff` (`account`);