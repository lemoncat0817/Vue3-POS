CREATE TABLE `devices` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`token_hash` text NOT NULL,
	`token_salt` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`revoked_at` text
);
