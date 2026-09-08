-- 電子發票字軌（P23：規劃書 §10 P23「電子發票平台串接」，見
-- db/schema.ts 的 invoiceTracks 說明）。這是示範用的預設字軌，
-- 部署到真正的店面前記得換成財政部實際配發的字軌代號與號碼區間
-- （後台「電子發票字軌」頁可以新增新一期字軌，新增時會自動停用
-- 舊字軌）。

INSERT INTO invoice_tracks (id, track_code, period_label, range_start, range_end, current_number, is_active)
VALUES ('track-default', 'AA', '示範期別（部署前請改成實際配發的字軌）', 1, 50000000, 0, 1);
