CREATE TABLE `order_coupons` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`value` real NOT NULL
);
--> statement-breakpoint
DROP TABLE `money_coupons`;--> statement-breakpoint
DROP TABLE `percent_coupons`;