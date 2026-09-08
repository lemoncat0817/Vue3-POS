# POS機系統

這是一個使用Vue3、Vue-Router、Pinia、Element-Plus、Echarts和Vite構建的POS機系統，樣式編寫用TailWind CSS。

> **重構進行中**：本專案正依照重構規劃書分階段進行架構升級（TypeScript strict 化、pnpm workspace、伺服端與離線同步等），目前完成度為 P0（工程骨架）。畫面功能與行為與先前版本一致，尚未變動。
>
> **介紹圖片暫缺**：畫面正在進行整體改版，原本的介紹截圖已先移除，待改版完工後會補上最新畫面。

## Demo網站

[POS機系統 Demo](https://lemoncat0817.github.io/Vue3-POS/)

## 功能介紹教學影片

[觀看功能介紹教學影片](https://youtu.be/4ELxt64heEs?si=Vx-REYNuS8zd2Sxz)

## 開發功能

1. **登入頁面**

- 使用Vue-Router的路由守衛來避免未登入的狀態透過輸入網址進入頁面。

2. **點餐功能**

- 選擇飲品類型、飲品名稱、糖度/冰塊、飲料容器大小、額外添加的配料、餐點數量，付款方式。

3. **折扣系統**

- 免費招待、環保杯折扣、自帶瓶裝飲料杯折扣、優惠券套用功能。

4. **查看歷史訂單功能**

- 編輯訂單狀態、刪除訂單、查看訂單詳細內容、篩選顯示的訂單。

5. **後台設定功能**

- 商品管理：增加、刪除、修改飲品類型、飲料名稱、配料。
- 優惠設定：增加、刪除、修改現金折扣券、折數折扣券，編輯常用優惠的折價額度。

6. **數據分析功能**

- 選擇時間區間查看數據，以折線圖呈現營業額，以圓餅圖呈現熱門飲品、熱門配料、常用付款方式。

7. **權限管理功能**

- 增加、刪除、修改員工名單，設定各別的權限。
- 設定付款方式：增加、刪除、修改，並且控制是否啟用。

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
