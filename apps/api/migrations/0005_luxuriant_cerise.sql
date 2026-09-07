CREATE TABLE `order_tenders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` text NOT NULL,
	`seq` integer NOT NULL,
	`method` text NOT NULL,
	`amount` integer NOT NULL,
	`received_amount` integer,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `change_due` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
-- 回填既有訂單：orderSchema 現在要求 tenders 至少 1 筆（見
-- @pos/contract 的說明），這個表是這次遷移才新增的，既有訂單在
-- order_tenders 裡一筆都沒有——不補的話，遷移完成後舊訂單會在
-- GET /api/orders 解析時直接被 orderSchema.parse() 擋下來。用舊的
-- order_payment／order_payment_price 各合成一筆 tender，找零視為 0
-- （舊資料本來就沒有實收金額的概念）。
insert into order_tenders (order_id, seq, method, amount)
select order_id, 0, order_payment, order_payment_price from orders;