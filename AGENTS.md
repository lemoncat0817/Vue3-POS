## 專案概述

多租戶餐飲/飲料店 POS 系統：點餐結帳、會員行銷、後台管理、數據分析。pnpm workspace monorepo。

## 常用指令

```sh
pnpm install
cp apps/api/.dev.vars.example apps/api/.dev.vars   # 填入 OAuth client id/secret
pnpm dev                                           # 前後端並行啟動，前端 http://localhost:5173
```

| 指令              | 說明                                     |
| ----------------- | ---------------------------------------- |
| `pnpm build`      | 建置所有套件                             |
| `pnpm typecheck`  | 全套件型別檢查（各套件各自的 tsc/vue-tsc）|
| `pnpm lint`       | ESLint（含跨套件依賴邊界檢查）+ 色階 token 檢查 |
| `pnpm test`       | 全套件 Vitest 單元測試                   |
| `pnpm test:e2e`   | Playwright 端對端測試                    |

單一套件開發：`pnpm --filter @pos/app dev`、`pnpm --filter @pos/api dev`。

跑單一測試檔或單一案例（在對應套件目錄下，或用 `--filter`）：

```sh
pnpm --filter @pos/app exec vitest run src/stores/catalog.spec.ts
pnpm --filter @pos/domain exec vitest run -t "測試名稱關鍵字"
pnpm exec playwright test e2e/login.spec.ts
```

`apps/api` 本機開發依賴 wrangler + D1；`pnpm --filter @pos/api dev` 的 `predev` 會自動 `wrangler d1 migrations apply pos-db --local`，schema 改動後不需手動套用。

## 架構

```
apps/pos/       前端（Vue 3 + PWA，離線優先）
apps/api/       後端（Hono + Cloudflare Workers + D1 + Drizzle ORM）
packages/       pos-domain（純領域邏輯）、pos-contract（前後端共用的 Zod 契約 + 型別）
e2e/            Playwright 端對端測試（跨 apps/pos 與 apps/api）
```

### 分層邊界（ESLint 強制）

`packages/pos-domain`、`packages/pos-contract`、`apps/api` 三者禁止依賴 Vue／UI 框架（`eslint.config.js` 的 `FRAMEWORK_IMPORT_RESTRICTIONS`）。`pos-domain` 是純 TypeScript 領域邏輯（金額計算、折扣、班別、退款等），`pos-contract` 是 Zod schema + 衍生型別，兩者同時被 `apps/pos` 與 `apps/api` 引用，是前後端行為一致性的唯一真相來源——新增欄位或驗證規則先改這裡，而不是各自在前後端重複定義。

### 認證與授權模型（三種憑證，各自獨立）

- **裝置憑證**（`X-Device-Token`，`require-device-token.ts`）：識別一台 POS 終端機屬於哪個租戶（`tenantId`），登入頁之前就需要，核發流程見 `apps/api/src/routes/devices.ts`。
- **操作員 session**（`X-Operator-Session`，PIN 登入）：識別哪位員工在操作，`require-capability.ts` 依 `staff.roleId → roles.capabilities`（`AuthorityKey[]`）做細粒度授權檢查。
- **Web/OAuth session**（`X-Web-Session`）：租戶擁有者的後台登入，`requireCapability(key, { allowWebSession: true })` 允許租戶擁有者在忘記操作員 PIN 時繞過操作員 session（`isTenantOwnerViaWebSession`）。

三者在 `apps/api/src/app.ts` 的 CORS `allowHeaders` 中並列，但語意互不取代——加新路由時要判斷該端點該用哪一種（或哪幾種）憑證檢查，不能假設有裝置憑證就等於有操作員身份。

RBAC 能力清單定義在 `packages/pos-contract/src/staff.ts` 的 `authorityKeySchema`。**從這個 enum 移除一個 key 時，必須同步寫一份 D1 migration 去 backfill 既有 `roles` 資料表裡引用該 key 的資料**，否則舊角色資料在下次操作員登入時解析 `capabilities` 會直接 500。

### 多租戶隔離

D1 是單一資料庫多租戶（非 database-per-tenant）。查詢一律要帶 `tenantId` 過濾；`apps/api/src/db/tenant-scope.ts` 的 `tenantFilter()` 對 `tenantId === null` 特判為 `isNull()` 比對，這是過渡期資料（遷移前建立、尚未綁定租戶）的相容處理，不是可以忽略的邊界情況。

### 離線優先架構（apps/pos/src/offline）

前端用 Dexie（IndexedDB）暫存訂單，`outbox.ts` 管理待同步佇列，`sync-worker.ts` 用指數退避＋隨機抖動輪詢同步、監聽 `online` 事件。新增任何「送出訂單」相關功能時，要考慮離線佇列與線上直送兩條路徑是否都覆蓋到，而不是只改 `apps/pos/src/api/orders.ts` 的線上呼叫。

### UI 色彩 token

`apps/pos` 頁面與元件層禁止直接寫 Tailwind 原生色階（如 `bg-emerald-500`），一律用 `tailwind.config.js` 定義的語意 token（`success`/`info`/`accent`/`warning`/`danger`/`surface`/`primary`）；由 `pnpm lint` 內的 `check:tokens` script 檢查並擋下 CI。`teal` 是刻意保留的例外（內用／外帶通路分類色，非狀態語意，見 `scripts/check-color-tokens.sh` 內註解）。

### E2E 測試的裝置憑證依賴

`e2e/global.setup.ts` 會先核發一組裝置憑證存進 `storageState`，其餘測試 project 都 `dependencies: ['setup']` 依賴它——裝置憑證不是 build-time 塞進前端的環境變數，重建本機 D1 會使既有憑證失效。`shift.spec.ts` 獨立成 `chromium-shift` project、依賴 `chromium` project 跑完才開始，避免平行送單干擾全域班別的收班現金帳差計算。

## 程式碼註解規範

預設不寫註解。只有在解釋「非顯而易見的原因」時才寫——例如刻意的取捨、已知的陷阱、繞過某個限制的理由、或一個容易被誤改的邏輯背後的動機。程式碼本身在做什麼，交給程式碼自己表達，不要用註解重述。

禁止：逐行敘述邏輯（如「迴圈遍歷使用者」）、重複函式簽名或型別、變更日誌式註解（如「已修復 X」「根據需求更新」）、引用規劃書／設計文件的章節編號（這類引用之後容易失效）。

單行原則：一則註解最多一行；不寫多段式 docstring 或多行註解區塊。

這條規範優先於「比照周圍程式碼的註解密度」這種預設傾向——即使既有程式碼註解很多，新寫或修改的程式碼仍套用上述標準，不要照抄舊密度。

若既有程式碼裡有明顯冗餘、不符合上述標準的舊註解，且改動範圍剛好經過該處，可以順手精簡，不必等使用者特別要求。
