CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`points` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `members_phone_idx` ON `members` (`phone`);--> statement-breakpoint
ALTER TABLE `orders` ADD `member_id` text REFERENCES members(id);