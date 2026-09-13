# POS機系統

這是一個使用Vue3、Vue-Router、Pinia、Element-Plus、Echarts和Vite構建的POS機系統，樣式編寫用TailWind CSS。

> **重構進行中**：本專案正依照重構規劃書分階段進行架構升級（TypeScript strict 化、pnpm workspace、伺服端與離線同步等），目前完成度為 P0（工程骨架）。畫面功能與行為與先前版本一致，尚未變動。
>
> **介紹圖片暫缺**：畫面正在進行整體改版，原本的介紹截圖已先移除，待改版完工後會補上最新畫面。

## Demo網站

[POS機系統 Demo](https://lemoncat0817.github.io/pos-system/)

## 開發功能

1. **登入頁面**

- 使用Vue-Router的路由守衛來避免未登入的狀態透過輸入網址進入頁面。

2. **點餐功能**

- 選擇分類、品項，依品項掛用的規格群組客製化（例如熟度、甜度/冰塊、容器大小），額外加購選項、數量、付款方式。不綁定單一餐飲品類，同一套模型可同時服務餐廳與飲料店。

3. **折扣系統**

- 招待、快速折扣（後台可自由新增/刪除任意筆數的折扣按鈕）、訂單折抵券套用功能。

4. **查看歷史訂單功能**

- 編輯訂單狀態、刪除訂單、查看訂單詳細內容，可依關鍵字、期間、通路、服務人員、訂單狀態、付款方式篩選訂單。

5. **後台設定功能**

- 商品管理：分類、品項、規格群組、加購選項的新增/刪除/修改。
- 優惠設定：現金折扣券、折數折扣券、快速折扣的新增/刪除/修改。
- 付款方式：新增、刪除、修改，並控制是否啟用。
- 電子發票字軌設定。

6. **數據分析功能**

- 選擇時間區間查看數據，以折線圖呈現營業額，排行榜呈現熱銷品項、分類別銷售佔比、熱門加購選項、常用付款方式。

7. **權限管理功能**

- 增加、刪除、修改員工名單，設定各別的權限。

## 使用技術

1. **Vue3 Composition API**
2. **TypeScript**（strict 模式）

- 型別檢查：`vue-tsc` / `tsc`。

3. **Vue-Router**

- 頁面切換及訪問權限控制

4. **Pinia**

- 資料管理。

5. **Element-Plus**

- UI組件庫。

6. **TailWind CSS**

- 快速樣式編寫，主要版型使用Flex和Grid布局。

7. **Vite**

- 專案建立與打包。

8. **ESLint 9**（flat config）

- 程式碼規範管理，含跨套件依賴邊界檢查。

9. **Prettier**

- 程式碼格式化。

10. **Vitest / Playwright**

- 單元測試與端對端測試。

11. **Git**

- 版本控制。

12. **Echarts**

- 數據分析圖表。

## 專案結構

本專案為 pnpm workspace monorepo：

```
apps/pos/          前端應用（Vue 3 + TypeScript，本專案的主要程式碼）
apps/api/          伺服端（Cloudflare Workers，規劃中，尚未實作）
packages/pos-domain/    領域邏輯與共用資料（純 TypeScript，規劃中）
packages/pos-contract/  API 契約定義（規劃中）
```

## 安裝與運行

確保你已安裝 Node.js（20.19 以上）和 pnpm。

### 安裝依賴

```sh
pnpm install
```

### 開發模式啟動服務器

```sh
pnpm dev
```

### 生產模式構建

```sh
pnpm build
```

### 其他常用指令

```sh
pnpm typecheck   # 對所有套件執行型別檢查
pnpm lint        # 執行 ESLint
pnpm test        # 執行 Vitest 單元測試
pnpm test:e2e    # 執行 Playwright 端對端測試
```

## CI/CD

`.github/workflows/ci.yml` 在 push／merge 到 `master`（以及手動 `workflow_dispatch`）時會：

1. 跑 `pnpm typecheck`、`pnpm lint`、`pnpm test`（不含 e2e）
2. 以 Actions 部署前端到 GitHub Pages（**不是** `gh-pages` 分支）
3. 以 wrangler 部署後端 Worker（**不會**自動跑 D1 migrate／seed）

打到 `master` 或 `refactor/modernization` 的 pull request 只跑品質檢查、不部署。

Repo **Settings → Pages → Source** 請設成 **GitHub Actions**。

### 需要的 GitHub Secrets / Variables

Secrets：

- `CLOUDFLARE_API_TOKEN`（wrangler 部署 Worker）

Variables：

- `VITE_API_BASE_URL`（例如 `https://pos-api.jimdeng0817.workers.dev`）
- `VITE_BASE_PATH`（GitHub Pages 專案站必須是 `/pos-system/`）
- `CLOUDFLARE_ACCOUNT_ID`（可選；wrangler 需要時設為 Cloudflare account id）
