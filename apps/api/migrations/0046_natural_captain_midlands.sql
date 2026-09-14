ALTER TABLE `devices` ADD `lookup_hash` text;--> statement-breakpoint
CREATE INDEX `devices_lookup_hash_idx` ON `devices` (`lookup_hash`);