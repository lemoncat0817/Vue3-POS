CREATE TABLE `payment_methods` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`disabled` integer NOT NULL,
	`use_method` text NOT NULL
);
