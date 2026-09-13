-- 會員管理權限拆分：canCheckMembers 原本同時管「查看」跟「新增/編輯/刪除」，
-- 現在查看維持用 canCheckMembers（順便補上會員清單/明細原本完全沒有權限
-- 檢查的漏洞，見 routes/members.ts），寫入動作改用新的 canManageMembers。
-- 既有角色原本擁有 canCheckMembers 的，兩個權限都保留，行為不變。
UPDATE roles
SET capabilities = REPLACE(capabilities, '"canCheckMembers"', '"canCheckMembers","canManageMembers"')
WHERE capabilities LIKE '%"canCheckMembers"%' AND capabilities NOT LIKE '%"canManageMembers"%';
