-- canSetAuthority 拆成「設定人員名單」canManageStaff 與「設定權限群組」
-- canManageRoles 兩把鑰匙（見 apps/pos/src/utils/authority.ts）。既有
-- 角色原本擁有 canSetAuthority 的，兩個新權限都保留，行為不變，之後
-- 管理者可在權限群組頁自行拆開分配。
UPDATE roles
SET capabilities = REPLACE(capabilities, '"canSetAuthority"', '"canManageStaff","canManageRoles"')
WHERE capabilities LIKE '%"canSetAuthority"%';
