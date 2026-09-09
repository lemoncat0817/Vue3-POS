-- 既有員工（若有）依其目前的 capabilities 各自建立一個同義角色，一比一保留
-- 遷移當下的實際權限，不擅自套用到任何範本、避免遷移本身改變任何人的權限。
-- 之後管理者可在「權限群組」頁面把這些人手動改指到共用角色、或刪除多餘的
-- 個人角色。角色名稱用 account（唯一）組字串，避免撞上 roles_name_idx。
--
-- 三個系統內建權限群組範本（店長／值班經理／工讀生）不在這裡建立——那是
-- 展示用種子資料，跟 catalog.sql／payment-methods.sql 等其他業務種子資料
-- 一樣收在 seed/staff.sql，只在 `db:seed:local`／`db:seed:remote` 才會建立，
-- migration 只處理 schema 與既有資料的相容性回填。
INSERT INTO roles (id, name, capabilities, is_system)
SELECT 'role-migrated-' || staff.id, staff.account || ' 的權限', staff.capabilities, 0
FROM staff;

UPDATE staff SET role_id = 'role-migrated-' || staff.id;
