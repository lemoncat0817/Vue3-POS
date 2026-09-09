PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_staff` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`job_title` text NOT NULL,
	`account` text NOT NULL,
	`role_id` text NOT NULL,
	`pin_hash` text NOT NULL,
	`pin_salt` text NOT NULL,
	`failed_pin_attempts` integer DEFAULT 0 NOT NULL,
	`locked_until` text,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_staff`("id", "name", "job_title", "account", "role_id", "pin_hash", "pin_salt", "failed_pin_attempts", "locked_until") SELECT "id", "name", "job_title", "account", "role_id", "pin_hash", "pin_salt", "failed_pin_attempts", "locked_until" FROM `staff`;--> statement-breakpoint
DROP TABLE `staff`;--> statement-breakpoint
ALTER TABLE `__new_staff` RENAME TO `staff`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `staff_account_idx` ON `staff` (`account`);