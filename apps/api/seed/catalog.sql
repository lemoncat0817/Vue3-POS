-- 展示用菜單：跨品類的餐飲示範資料（主餐、輕食、飲品、甜點），示範這套
-- 目錄模型不綁定單一產業——熟度、甜度/冰塊/容器大小等客製化選項一律透過
-- 可重複掛用的規格群組（modifier_groups）表達，不是寫死在品項欄位裡。

INSERT INTO categories (id, name) VALUES ('cat-1', '主餐');
INSERT INTO categories (id, name) VALUES ('cat-2', '輕食');
INSERT INTO categories (id, name) VALUES ('cat-3', '飲品');
INSERT INTO categories (id, name) VALUES ('cat-4', '甜點');

INSERT INTO modifier_groups (id, name, selection_type, required) VALUES ('mg-doneness', '熟度', 'single', 1);
INSERT INTO modifier_options (id, group_id, name, price_delta) VALUES ('mo-doneness-1', 'mg-doneness', '五分熟', 0);
INSERT INTO modifier_options (id, group_id, name, price_delta) VALUES ('mo-doneness-2', 'mg-doneness', '七分熟', 0);
INSERT INTO modifier_options (id, group_id, name, price_delta) VALUES ('mo-doneness-3', 'mg-doneness', '全熟', 0);

INSERT INTO modifier_groups (id, name, selection_type, required) VALUES ('mg-sweetness', '甜度', 'single', 1);
INSERT INTO modifier_options (id, group_id, name, price_delta) VALUES ('mo-sweetness-1', 'mg-sweetness', '無糖', 0);
INSERT INTO modifier_options (id, group_id, name, price_delta) VALUES ('mo-sweetness-2', 'mg-sweetness', '半糖', 0);
INSERT INTO modifier_options (id, group_id, name, price_delta) VALUES ('mo-sweetness-3', 'mg-sweetness', '正常糖', 0);

INSERT INTO modifier_groups (id, name, selection_type, required) VALUES ('mg-ice', '冰塊', 'single', 1);
INSERT INTO modifier_options (id, group_id, name, price_delta) VALUES ('mo-ice-1', 'mg-ice', '去冰', 0);
INSERT INTO modifier_options (id, group_id, name, price_delta) VALUES ('mo-ice-2', 'mg-ice', '少冰', 0);
INSERT INTO modifier_options (id, group_id, name, price_delta) VALUES ('mo-ice-3', 'mg-ice', '正常冰', 0);

INSERT INTO modifier_groups (id, name, selection_type, required) VALUES ('mg-size', '容器大小', 'single', 1);
INSERT INTO modifier_options (id, group_id, name, price_delta) VALUES ('mo-size-1', 'mg-size', '中杯', 0);
INSERT INTO modifier_options (id, group_id, name, price_delta) VALUES ('mo-size-2', 'mg-size', '大杯', 10);

INSERT INTO products (id, category_id, name, base_price, stock) VALUES ('prod-1', 'cat-1', '招牌牛肉漢堡', 180, 30);
INSERT INTO products (id, category_id, name, base_price, stock) VALUES ('prod-2', 'cat-1', '烤雞三明治', 150, 30);
INSERT INTO products (id, category_id, name, base_price, stock) VALUES ('prod-3', 'cat-1', '奶油培根義大利麵', 190, NULL);
INSERT INTO products (id, category_id, name, base_price, stock) VALUES ('prod-4', 'cat-2', '凱薩沙拉', 120, NULL);
INSERT INTO products (id, category_id, name, base_price, stock) VALUES ('prod-5', 'cat-2', '薯條', 60, NULL);
INSERT INTO products (id, category_id, name, base_price, stock) VALUES ('prod-6', 'cat-2', '雞塊六入', 80, NULL);
INSERT INTO products (id, category_id, name, base_price, stock) VALUES ('prod-7', 'cat-3', '翡翠綠茶', 30, 100);
INSERT INTO products (id, category_id, name, base_price, stock) VALUES ('prod-8', 'cat-3', '鮮奶紅茶拿鐵', 60, 100);
INSERT INTO products (id, category_id, name, base_price, stock) VALUES ('prod-9', 'cat-3', '美式咖啡', 50, NULL);
INSERT INTO products (id, category_id, name, base_price, stock) VALUES ('prod-10', 'cat-3', '現榨柳橙汁', 70, 40);
INSERT INTO products (id, category_id, name, base_price, stock) VALUES ('prod-11', 'cat-4', '提拉米蘇', 90, 15);
INSERT INTO products (id, category_id, name, base_price, stock) VALUES ('prod-12', 'cat-4', '布朗尼', 75, 15);

INSERT INTO product_modifier_groups (product_id, group_id) VALUES ('prod-1', 'mg-doneness');
INSERT INTO product_modifier_groups (product_id, group_id) VALUES ('prod-7', 'mg-sweetness');
INSERT INTO product_modifier_groups (product_id, group_id) VALUES ('prod-7', 'mg-ice');
INSERT INTO product_modifier_groups (product_id, group_id) VALUES ('prod-7', 'mg-size');
INSERT INTO product_modifier_groups (product_id, group_id) VALUES ('prod-8', 'mg-sweetness');
INSERT INTO product_modifier_groups (product_id, group_id) VALUES ('prod-8', 'mg-ice');
INSERT INTO product_modifier_groups (product_id, group_id) VALUES ('prod-8', 'mg-size');
INSERT INTO product_modifier_groups (product_id, group_id) VALUES ('prod-10', 'mg-ice');
INSERT INTO product_modifier_groups (product_id, group_id) VALUES ('prod-10', 'mg-size');

INSERT INTO add_on_options (id, name, price) VALUES ('addon-1', '加起司', 20);
INSERT INTO add_on_options (id, name, price) VALUES ('addon-2', '加蛋', 15);
INSERT INTO add_on_options (id, name, price) VALUES ('addon-3', '加培根', 25);
INSERT INTO add_on_options (id, name, price) VALUES ('addon-4', '珍珠', 10);
INSERT INTO add_on_options (id, name, price) VALUES ('addon-5', '布丁', 15);
INSERT INTO add_on_options (id, name, price) VALUES ('addon-6', '椰果', 10);
