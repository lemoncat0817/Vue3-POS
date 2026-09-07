# @pos/api

Cloudflare Workers 伺服端（Hono + Drizzle ORM + D1）。對應重構規劃書
P2（伺服端）階段。

## 架構

```
src/
  app.ts          Hono 應用程式與路由（依賴 AnyDb，不綁定特定 driver）
  index.ts        Worker 入口（fetch handler），只有這裡碰真正的 D1 binding
  env.ts          Env 介面（wrangler binding 對應）
  db/
    schema.ts     Drizzle 資料表定義（純 schema，無 driver 依賴）
    client.ts     D1 專用的 db 工廠函式（只給 index.ts 用）
    types.ts      路由層看到的通用 db 型別（AnyDb）
migrations/       drizzle-kit 產生的 SQL migration（wrangler 直接套用這份，
                  不需要另外轉換，見 drizzle.config.ts 的說明）
test/
  helpers/db.ts   測試用 db：better-sqlite3 套用同一份 migration
  *.spec.ts       路由測試
```

### 為什麼測試不用 Miniflare 直接測 D1

`@cloudflare/vitest-pool-workers`（官方建議的 Miniflare 測試工具）要求
vitest ^4，會跟本專案其他套件用的 vitest 3.x 衝突。改用
`drizzle-orm/better-sqlite3` 在記憶體內套用同一份 migration SQL 測試路由
邏輯——D1 底層就是 SQLite，行為高度一致，足以驗證查詢與路由邏輯。

這不是 100% 等價（交易語意、少數限制不同），部署前建議照下面「本機驗證」
的步驟用真正的 `wrangler dev` + 本機 D1 手動跑一次，作為最後的一致性
確認。

## 本機開發

```sh
pnpm install
pnpm --filter @pos/api run db:generate     # 修改 schema.ts 後重新產生 migration
pnpm --filter @pos/api run db:migrate:local # 套用 migration 到本機 D1（wrangler 自動建立的本機 SQLite 檔案）
pnpm --filter @pos/api run dev              # wrangler dev，本機跑一個真正的 Worker + D1
pnpm --filter @pos/api run test             # 單元測試（better-sqlite3）
```

## 部署前需要的手動步驟（無法由 AI 代為執行）

以下步驟需要你自己的 Cloudflare 帳號，AI 助理沒有帳號存取權限，只能把
專案準備到「你登入後幾個指令就能部署」的狀態：

1. **登入**：`pnpm exec wrangler login`（會開瀏覽器走 OAuth）。
2. **建立 D1 資料庫**：
   ```sh
   pnpm exec wrangler d1 create maji-tea-pos-db
   ```
   指令會印出 `database_id`，貼到 `wrangler.jsonc` 的
   `d1_databases[0].database_id`（目前是佔位字串
   `REPLACE_AFTER_WRANGLER_D1_CREATE`）。
3. **套用 migration 到正式環境**：
   ```sh
   pnpm --filter @pos/api run db:migrate:remote
   ```
4. **部署**：
   ```sh
   pnpm --filter @pos/api run deploy
   ```

## 免費額度是否夠用（§12 效能預算）

規劃書把「免費額度換算成每日可支撐幾筆結帳」列為退出條件之一，但這需要
你實際帳號當下的方案數字（Cloudflare 的免費額度門檻會調整），無法在
沒有帳號的情況下確認。部署後建議查看
[Cloudflare Dashboard 的用量頁面](https://dash.cloudflare.com)，對照
`wrangler.jsonc` 目前的設定換算：

- Workers 每日請求數上限
- D1 每日讀／寫列數上限、資料庫總大小上限

單店單機的日結帳筆數通常是兩位數到三位數量級，正常情況下免費額度應有
數量級以上的餘裕；實際數字仍請以帳號當下方案為準。
