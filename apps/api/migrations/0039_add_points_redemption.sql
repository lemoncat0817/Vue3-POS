ALTER TABLE `orders` ADD `points_redeemed` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `points_redemption_rate` integer DEFAULT 10 NOT NULL;