CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`provider_account_id` text NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`avatar_url` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_provider_account_idx` ON `users` (`provider`,`provider_account_id`);--> statement-breakpoint
CREATE TABLE `web_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`token_salt` text NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL,
	`revoked_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `add_on_options` ADD `tenant_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `audit_logs` ADD `tenant_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `cash_movements` ADD `tenant_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `categories` ADD `tenant_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `devices` ADD `tenant_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `dining_tables` ADD `tenant_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `invoice_sequences` ADD `tenant_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `invoice_tracks` ADD `tenant_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `members` ADD `tenant_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `modifier_groups` ADD `tenant_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `modifier_options` ADD `tenant_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `operator_sessions` ADD `tenant_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `order_coupons` ADD `tenant_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `order_lines` ADD `tenant_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `order_refunds` ADD `tenant_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `order_sequences` ADD `tenant_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `order_tenders` ADD `tenant_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `orders` ADD `tenant_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `payment_methods` ADD `tenant_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `product_modifier_groups` ADD `tenant_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `products` ADD `tenant_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `quick_discounts` ADD `tenant_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `roles` ADD `tenant_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `shifts` ADD `tenant_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `staff` ADD `tenant_id` text REFERENCES users(id);