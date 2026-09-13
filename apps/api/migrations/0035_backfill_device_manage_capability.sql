-- 新增「管理裝置憑證」canManageDevices：撤銷裝置（POST /api/devices/:id/revoke）
-- 原本完全沒有權限檢查，任何裝置憑證都能撤銷同租戶下的任何一台裝置
-- （見 routes/devices.ts）。這不是既有能力拆分，沒有對應的舊行為可以延續，
-- 比照店家管理者的代表能力 canManageRoles 補上，避免既有店長角色反而
-- 因為這次補漏洞而失去管理裝置的能力。
UPDATE roles
SET capabilities = REPLACE(capabilities, '"canManageRoles"', '"canManageRoles","canManageDevices"')
WHERE capabilities LIKE '%"canManageRoles"%' AND capabilities NOT LIKE '%"canManageDevices"%';
