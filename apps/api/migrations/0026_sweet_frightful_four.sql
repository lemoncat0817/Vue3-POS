CREATE INDEX `order_lines_order_id_idx` ON `order_lines` (`order_id`);--> statement-breakpoint
CREATE INDEX `order_refunds_order_id_idx` ON `order_refunds` (`order_id`);--> statement-breakpoint
CREATE INDEX `order_tenders_order_id_idx` ON `order_tenders` (`order_id`);--> statement-breakpoint
CREATE INDEX `orders_order_time_idx` ON `orders` (`order_time`);--> statement-breakpoint
CREATE INDEX `orders_order_status_idx` ON `orders` (`order_status`);