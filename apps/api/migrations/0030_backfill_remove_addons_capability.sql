-- canSetAddOns 已經在 f8fc423 退役（加購 CRUD 端點跟這個權限鍵值一起移除），
-- authorityKeySchema 不再接受這個字串。既有角色資料如果還殘留這個舊鍵值，
-- 登入回應組 capabilities 陣列時 zod parse 會直接丟出未捕捉的例外，變成
-- operator-login 500——清掉舊資料裡殘留的鍵值，涵蓋它出現在陣列中間、
-- 開頭／結尾、或整個陣列僅此一個元素三種位置。
UPDATE roles
SET capabilities = REPLACE(
  REPLACE(
    REPLACE(capabilities, '"canSetAddOns",', ''),
    ',"canSetAddOns"', ''
  ),
  '["canSetAddOns"]', '[]'
)
WHERE capabilities LIKE '%"canSetAddOns"%';
