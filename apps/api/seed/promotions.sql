-- 促銷資料（P5：規劃書 §10 的促銷引擎），對照 apps/pos 舊版
-- stores/discount.ts 的種子資料一次性搬過來——之後改由這裡（D1）當
-- 唯一來源，apps/pos 接上 API 後移除自己的重複副本。

INSERT INTO money_coupons (id, name, discount_money) VALUES ('money-1', '$50折價券', 50);
INSERT INTO money_coupons (id, name, discount_money) VALUES ('money-2', '滿$300折$100元', 100);
INSERT INTO money_coupons (id, name, discount_money) VALUES ('money-3', '滿$500折$150元', 150);
INSERT INTO money_coupons (id, name, discount_money) VALUES ('money-4', '$200折價券', 200);

INSERT INTO percent_coupons (id, name, discount_percent) VALUES ('percent-1', '整單95折', 0.95);
INSERT INTO percent_coupons (id, name, discount_percent) VALUES ('percent-2', '週年慶整單88折', 0.88);
INSERT INTO percent_coupons (id, name, discount_percent) VALUES ('percent-3', '滿千打7折', 0.7);
INSERT INTO percent_coupons (id, name, discount_percent) VALUES ('percent-4', '滿萬打5折', 0.5);

-- slot 固定 5 筆，0：環保折扣、1：瓶裝折扣（容器群組，互斥）、
-- 2～4：九折／八五折／員工八折（折數群組，互斥），見 @pos/domain 的
-- OftenUseRates 型別說明。
INSERT INTO often_use_rates (slot, name, discount_money, discount_percent) VALUES (0, '環保折扣', 5, 1);
INSERT INTO often_use_rates (slot, name, discount_money, discount_percent) VALUES (1, '瓶裝折扣', 10, 1);
INSERT INTO often_use_rates (slot, name, discount_money, discount_percent) VALUES (2, '九折', 0, 0.9);
INSERT INTO often_use_rates (slot, name, discount_money, discount_percent) VALUES (3, '八五折', 0, 0.85);
INSERT INTO often_use_rates (slot, name, discount_money, discount_percent) VALUES (4, '員工八折', 0, 0.8);
