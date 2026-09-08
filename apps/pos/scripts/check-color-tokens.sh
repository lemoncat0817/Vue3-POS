#!/usr/bin/env bash
# UI-1（規劃書 §8「驗收標準」#5）：頁面層與元件層禁止直接寫 Tailwind
# 原生色階（emerald/blue/indigo/slate/amber/rose/sky），一律走
# tailwind.config.js 定義的語意 token（success/info/accent/warning/
# danger/surface/primary）。teal 是刻意保留的例外——home/index.vue 與
# order/index.vue 用它做「內用／外帶」通路類型的分類色，不是狀態語意，
# 沒有對應的語意 token 可以取代。
set -euo pipefail
cd "$(dirname "$0")/.."

PATTERN='\b(dark:)?(hover:)?(bg|text|border|ring|from|to)-(emerald|blue|indigo|slate|amber|rose|sky)-[0-9]+'
MATCHES=$(grep -rnE "$PATTERN" src/views src/components src/layout --include='*.vue' --include='*.ts' 2>/dev/null || true)

if [ -n "$MATCHES" ]; then
  echo "發現繞過語意 token 的原生 Tailwind 色階（見規劃書 §4.3）："
  echo "$MATCHES"
  echo ""
  echo "請改用 success/info/accent/warning/danger/surface/primary 這幾個語意 token。"
  exit 1
fi

echo "沒有發現繞過語意 token 的原生色階。"
