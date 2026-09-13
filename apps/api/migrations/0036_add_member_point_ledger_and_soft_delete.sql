CREATE TABLE `member_point_ledger` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text,
	`member_id` text NOT NULL,
	`delta` integer NOT NULL,
	`reason` text NOT NULL,
	`order_id` text,
	`operator` text,
	`note` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `member_point_ledger_tenant_member_idx` ON `member_point_ledger` (`tenant_id`,`member_id`);--> statement-breakpoint
ALTER TABLE `members` ADD `deleted_at` text;