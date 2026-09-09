-- 促銷資料。訂單折抵券（現金／折數）與快速折扣皆可在後台自由新增／刪除
-- 任意筆數，這裡只是示範用的起始資料，不是系統寫死的固定清單。

INSERT INTO money_coupons (id, name, discount_money) VALUES ('money-1', '$50折價券', 50);
INSERT INTO money_coupons (id, name, discount_money) VALUES ('money-2', '滿$300折$100元', 100);
INSERT INTO money_coupons (id, name, discount_money) VALUES ('money-3', '滿$500折$150元', 150);
INSERT INTO money_coupons (id, name, discount_money) VALUES ('money-4', '$200折價券', 200);

INSERT INTO percent_coupons (id, name, discount_percent) VALUES ('percent-1', '整單95折', 0.95);
INSERT INTO percent_coupons (id, name, discount_percent) VALUES ('percent-2', '週年慶整單88折', 0.88);
INSERT INTO percent_coupons (id, name, discount_percent) VALUES ('percent-3', '滿千打7折', 0.7);
INSERT INTO percent_coupons (id, name, discount_percent) VALUES ('percent-4', '滿萬打5折', 0.5);

INSERT INTO quick_discounts (id, name, kind, value) VALUES ('quick-1', '常客優惠', 'amount', 5);
INSERT INTO quick_discounts (id, name, kind, value) VALUES ('quick-2', '大宗採購優惠', 'amount', 10);
INSERT INTO quick_discounts (id, name, kind, value) VALUES ('quick-3', '九折優惠', 'percent', 0.9);
INSERT INTO quick_discounts (id, name, kind, value) VALUES ('quick-4', '八五折優惠', 'percent', 0.85);
INSERT INTO quick_discounts (id, name, kind, value) VALUES ('quick-5', '員工優惠', 'percent', 0.8);
