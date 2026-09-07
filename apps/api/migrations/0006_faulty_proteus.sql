CREATE TABLE `cash_movements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`shift_id` text NOT NULL,
	`type` text NOT NULL,
	`amount` integer NOT NULL,
	`reason` text NOT NULL,
	`operator` text NOT NULL,
	`at` text NOT NULL,
	FOREIGN KEY (`shift_id`) REFERENCES `shifts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `shifts` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`opened_by` text NOT NULL,
	`opened_at` text NOT NULL,
	`opening_float` integer NOT NULL,
	`closed_by` text,
	`closed_at` text,
	`cash_sales` integer,
	`expected_cash` integer,
	`actual_cash` integer,
	`variance` integer
);
