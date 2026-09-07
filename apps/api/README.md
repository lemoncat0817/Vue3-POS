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
4. **設定核發密鑰**（見下方「裝置憑證」說明）：
   ```sh
   pnpm exec wrangler secret put PROVISIONING_SECRET
   ```
   本機開發（`wrangler dev`）用 `.dev.vars` 檔案設定同一個變數，例如
   `PROVISIONING_SECRET=dev-provisioning-secret`（`.dev.vars` 已加進
   .gitignore，不會被提交）。
5. **部署**：
   ```sh
   pnpm --filter @pos/api run deploy
   ```
6. **核發第一台裝置的憑證**（部署完成、拿到正式 API 網址之後）：
   ```sh
   curl -X POST https://<你的 Workers 網址>/api/devices \
     -H "Content-Type: application/json" \
     -H "X-Provisioning-Secret: <上面設定的 PROVISIONING_SECRET>" \
     -d '{"name":"前台收銀機"}'
   ```
   回應裡的 `token` 只會出現這一次，之後即使是資料庫本身也還原不出來
   （只存雜湊值，見 `src/auth/hash.ts`），要記得馬上存到 apps/pos 建置
   時用的 `VITE_DEVICE_TOKEN` 環境變數。弄丟了沒關係，用
   `POST /api/devices/:id/revoke` 撤銷這台、重新核發一台新的即可。

## 身分系統（P4：規劃書 §9）

裝置憑證取代了 P2 的單一固定字串：`devices` 資料表存每台終端機的憑證
雜湊值＋鹽（`src/auth/hash.ts` 的 PBKDF2-SHA256），核發／清單／撤銷見
`src/routes/devices.ts`。異動性的端點（`POST /api/orders`、
`POST /api/staff`）都要求 `X-Device-Token` 標頭能對應到一台「還沒被
撤銷」的裝置，見 `src/middleware/require-device-token.ts`。

核發本身（`POST /api/devices`）用另一把獨立的密鑰
（`PROVISIONING_SECRET`）防護，不能用裝置憑證保護「核發裝置憑證」這件
事本身——你要核發的正是還沒有憑證的那台新終端機，用裝置憑證會是先有
雞還是先有蛋的問題。這把密鑰只在建置初期使用，日常營運用不到。

操作員 PIN（辨識「現在是哪位員工在操作」，跟裝置憑證是分開的兩件事）
見 `POST /api/auth/operator-login`（`src/routes/auth.ts`）：帳號＋4～6碼
PIN，一樣要先有有效的裝置憑證才能嘗試（PIN 遠比裝置憑證短，這一層先
擋掉沒有終端機憑證的用戶端整條暴力猜測路徑），連續錯誤 5 次鎖定 5
分鐘。`seed/staff.sql` 有三個示範帳號（跟 apps/pos 舊版
`stores/authorityManagement.ts` 的三個 demo 帳號權限對應）：
`lemon`／PIN `1234`（店長，全權限）、`james`／PIN `2345`（值班經理）、
`emily`／PIN `3456`（工讀生）——PIN 明碼只出現在這裡跟 seed 檔案的
註解裡，資料庫本身只有雜湊值。

## 多終端情境（P6：規劃書 §3）

訂單序號（`orderId` = 營業日 + 序號）改用 `order_sequences` 表的原子
計數器核發（`INSERT ... ON CONFLICT DO UPDATE ... RETURNING`，見
`src/routes/orders.ts` 的 `nextOrderSequence()`），取代 P2～P5「查同一
營業日已有幾筆訂單、+1」的作法——後者在兩台終端幾乎同時送單時可能算出
同一個序號，其中一筆會直接因為 `orderId` 撞到 primary key 失敗。已經用
`wrangler dev` 對本機 D1 真的同時送出多筆並發請求驗證過，全部核發到不同
序號、沒有任何一筆失敗。

`order_sequences` 表是這個階段才新增的：如果套用這個 migration 時
`orders` 表已經有資料（用舊版算法累積的），第一次核發某個營業日的序號
不會從 1 開始，而是接續現有資料的最大序號（見 `nextOrderSequence()`
的說明）——這是實際套用到本機 D1（累積了先前所有階段測試留下的訂單）
時親自撞到、修正過的情境，不是憑空想像的邊界案例。

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
