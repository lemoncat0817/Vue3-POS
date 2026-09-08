-- 付款方式（P18：規劃書 §10 P18「菜單與權限管理接上伺服端」），跟
-- apps/pos 舊版 stores/order.ts 裡寫死的 paymentList 種子資料一一對應。

INSERT INTO payment_methods (id, name, disabled, use_method) VALUES ('pm-1', '現金', 0, '紙鈔');
INSERT INTO payment_methods (id, name, disabled, use_method) VALUES ('pm-2', '信用卡', 0, '感應');
INSERT INTO payment_methods (id, name, disabled, use_method) VALUES ('pm-3', 'LinePay', 0, '掃描');
INSERT INTO payment_methods (id, name, disabled, use_method) VALUES ('pm-4', '街口支付', 0, '掃描');
INSERT INTO payment_methods (id, name, disabled, use_method) VALUES ('pm-5', '台灣Pay', 0, '掃描');
INSERT INTO payment_methods (id, name, disabled, use_method) VALUES ('pm-6', 'ApplePay', 0, '感應');
INSERT INTO payment_methods (id, name, disabled, use_method) VALUES ('pm-7', 'Pi錢包', 0, '掃描');
INSERT INTO payment_methods (id, name, disabled, use_method) VALUES ('pm-8', '全支付', 0, '掃描');
INSERT INTO payment_methods (id, name, disabled, use_method) VALUES ('pm-9', '悠遊付', 0, '掃描');
