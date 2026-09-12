-- 新增「設定營業日換日時間」canSetBusinessHours，沒有對應的舊行為可以延續
-- （這是全新功能，不是既有能力拆分），比照同樣屬於店務層級設定的
-- canSetPayMethod 分佈補上，既有租戶的店長角色才不用重新手動勾選。
UPDATE roles
SET capabilities = REPLACE(capabilities, '"canSetPayMethod"', '"canSetPayMethod","canSetBusinessHours"')
WHERE capabilities LIKE '%"canSetPayMethod"%' AND capabilities NOT LIKE '%"canSetBusinessHours"%';
