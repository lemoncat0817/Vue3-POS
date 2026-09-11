DROP INDEX `members_phone_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `members_tenant_phone_idx` ON `members` (`tenant_id`,`phone`);--> statement-breakpoint
DROP INDEX `orders_idempotency_key_idx`;--> statement-breakpoint
DROP INDEX `orders_order_time_idx`;--> statement-breakpoint
DROP INDEX `orders_order_status_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `orders_tenant_idempotency_key_idx` ON `orders` (`tenant_id`,`idempotency_key`);--> statement-breakpoint
CREATE INDEX `orders_tenant_order_time_idx` ON `orders` (`tenant_id`,`order_time`);--> statement-breakpoint
CREATE INDEX `orders_tenant_order_status_idx` ON `orders` (`tenant_id`,`order_status`);--> statement-breakpoint
DROP INDEX `roles_name_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `roles_tenant_name_idx` ON `roles` (`tenant_id`,`name`);--> statement-breakpoint
DROP INDEX `staff_account_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `staff_tenant_account_idx` ON `staff` (`tenant_id`,`account`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_order_sequences` (
	`tenant_id` text,
	`business_date` text NOT NULL,
	`counter` integer NOT NULL,
	PRIMARY KEY(`tenant_id`, `business_date`),
	FOREIGN KEY (`tenant_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_order_sequences`("tenant_id", "business_date", "counter") SELECT "tenant_id", "business_date", "counter" FROM `order_sequences`;--> statement-breakpoint
DROP TABLE `order_sequences`;--> statement-breakpoint
ALTER TABLE `__new_order_sequences` RENAME TO `order_sequences`;--> statement-breakpoint
PRAGMA foreign_keys=ON;