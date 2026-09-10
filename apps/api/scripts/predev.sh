#!/usr/bin/env bash
# pkill -f 用完整命令列字串比對，若寫進 package.json script 值，pattern 字串會出現在呼叫它的 shell cmdline 裡導致自殺，因此獨立成腳本檔
pkill -f 'Vue3-POS/apps/api/node_modules/.bin/wrangler' 2>/dev/null
pkill -f 'Vue3-POS/node_modules/.pnpm/wrangler@' 2>/dev/null
sleep 0.3
kill-port 8787
