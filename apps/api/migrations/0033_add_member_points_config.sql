ALTER TABLE `orders` ADD `points_earned` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `points_per_currency_unit` integer DEFAULT 10 NOT NULL;--> statement-breakpoint
-- 回填既有訂單的 points_earned：這個功能上線前比例固定是每 10 元 1 點（見
-- routes/orders.ts 原本寫死的 POINTS_PER_CURRENCY_UNIT），沒有掛會員的訂單維持 0。
UPDATE orders SET points_earned = order_payment_price / 10 WHERE member_id IS NOT NULL;