CREATE TABLE `operator_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`staff_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`token_salt` text NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL,
	`revoked_at` text,
	FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action
);
