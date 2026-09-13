#!/usr/bin/env bash
# pkill -f 用完整命令列字串比對，若寫進 package.json script 值，pattern 字串會出現在呼叫它的 shell cmdline 裡導致自殺，因此獨立成腳本檔
pkill -f 'pos-system/apps/api/node_modules/.bin/wrangler' 2>/dev/null
pkill -f 'pos-system/node_modules/.pnpm/wrangler@' 2>/dev/null
sleep 0.3
kill-port 8787

# 本機 D1 是獨立於 migrations/*.sql 的一份 sqlite 檔案，schema 改動 commit 進來後
# 不會自動套用，忘記手動跑 db:migrate:local 就會在真的用起來時撞到「no such
# column」500 錯誤（新欄位在程式碼裡有、本機資料庫裡沒有）。每次啟動都先套用一次
# 未套用的 migration，避免這個一直重演的手動步驟被漏掉。
wrangler d1 migrations apply pos-db --local
