CREATE TABLE `money_coupons` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`discount_money` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `often_use_rates` (
	`slot` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`discount_money` integer NOT NULL,
	`discount_percent` real NOT NULL
);
--> statement-breakpoint
CREATE TABLE `percent_coupons` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`discount_percent` real NOT NULL
);
