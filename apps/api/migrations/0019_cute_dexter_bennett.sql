CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`capabilities` text NOT NULL,
	`is_system` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `roles_name_idx` ON `roles` (`name`);--> statement-breakpoint
ALTER TABLE `staff` ADD `role_id` text REFERENCES roles(id);