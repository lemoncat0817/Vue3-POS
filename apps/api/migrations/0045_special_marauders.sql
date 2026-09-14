ALTER TABLE `operator_sessions` ADD `lookup_hash` text;--> statement-breakpoint
CREATE INDEX `operator_sessions_lookup_hash_idx` ON `operator_sessions` (`lookup_hash`);--> statement-breakpoint
ALTER TABLE `web_sessions` ADD `lookup_hash` text;--> statement-breakpoint
CREATE INDEX `web_sessions_lookup_hash_idx` ON `web_sessions` (`lookup_hash`);