-- 新增「查看操作紀錄」canCheckAuditLog：GET /api/audit-logs 原本沒有任何
-- 權限把關，任何一台已核發裝置都能讀到全店稽核紀錄。這不是既有能力拆分，
-- 沒有對應的舊行為可以延續，比照跟操作紀錄同等敏感層級（會揭露人員/權限
-- 異動）的 canCheckAuthority，以及涵蓋退款/作廢等職務的 canManageShift，
-- 補上此權限，避免既有角色反而因為這次補漏洞而失去查看能力。
UPDATE roles
SET capabilities = REPLACE(capabilities, '"canCheckAuthority"', '"canCheckAuthority","canCheckAuditLog"')
WHERE capabilities LIKE '%"canCheckAuthority"%' AND capabilities NOT LIKE '%"canCheckAuditLog"%';

UPDATE roles
SET capabilities = REPLACE(capabilities, '"canManageShift"', '"canManageShift","canCheckAuditLog"')
WHERE capabilities LIKE '%"canManageShift"%' AND capabilities NOT LIKE '%"canCheckAuditLog"%';
