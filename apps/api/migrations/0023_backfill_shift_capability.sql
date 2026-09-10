-- 新增「管理班別／現金」canManageShift，原本開收銀機（canOpenCashier）連帶
-- 能開班/收班/動用現金抽屜，行為不變，只是拆成獨立可勾選的權限——沿用跟
-- canOpenCashier 一樣的分佈，避免既有角色突然不能開班收班。
UPDATE roles
SET capabilities = REPLACE(capabilities, '"canOpenCashier"', '"canOpenCashier","canManageShift"')
WHERE capabilities LIKE '%"canOpenCashier"%' AND capabilities NOT LIKE '%"canManageShift"%';
