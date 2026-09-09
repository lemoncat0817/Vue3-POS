-- 促銷資料。訂單折價券與快速折扣皆可在後台自由新增／刪除任意筆數，
-- 這裡只是示範用的起始資料，不是系統寫死的固定清單。

INSERT INTO order_coupons (id, name, kind, value) VALUES ('coupon-1', '$50折價券', 'amount', 50);
INSERT INTO order_coupons (id, name, kind, value) VALUES ('coupon-2', '滿$300折$100元', 'amount', 100);
INSERT INTO order_coupons (id, name, kind, value) VALUES ('coupon-3', '滿$500折$150元', 'amount', 150);
INSERT INTO order_coupons (id, name, kind, value) VALUES ('coupon-4', '$200折價券', 'amount', 200);
INSERT INTO order_coupons (id, name, kind, value) VALUES ('coupon-5', '整單95折', 'percent', 0.95);
INSERT INTO order_coupons (id, name, kind, value) VALUES ('coupon-6', '週年慶整單88折', 'percent', 0.88);
INSERT INTO order_coupons (id, name, kind, value) VALUES ('coupon-7', '滿千打7折', 'percent', 0.7);
INSERT INTO order_coupons (id, name, kind, value) VALUES ('coupon-8', '滿萬打5折', 'percent', 0.5);

INSERT INTO quick_discounts (id, name, kind, value) VALUES ('quick-1', '常客優惠', 'amount', 5);
INSERT INTO quick_discounts (id, name, kind, value) VALUES ('quick-2', '大宗採購優惠', 'amount', 10);
INSERT INTO quick_discounts (id, name, kind, value) VALUES ('quick-3', '九折優惠', 'percent', 0.9);
INSERT INTO quick_discounts (id, name, kind, value) VALUES ('quick-4', '八五折優惠', 'percent', 0.85);
INSERT INTO quick_discounts (id, name, kind, value) VALUES ('quick-5', '員工優惠', 'percent', 0.8);
