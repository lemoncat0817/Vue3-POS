# MAJI Tea POS機系統

這是一個使用Vue3、Vue-Router、Pinia、Element-Plus、Echarts和Vite構建的POS機系統，樣式編寫用TailWind CSS。

## Demo網站

[MAJI Tea POS機系統 Demo](https://lemoncat0817.github.io/Vue3-POS/)

## 功能介紹教學影片

[觀看功能介紹教學影片](https://youtu.be/4ELxt64heEs?si=Vx-REYNuS8zd2Sxz)

## 開發功能

1. **登入頁面**

- 使用Vue-Router的路由守衛來避免未登入的狀態透過輸入網址進入頁面。

![登入畫面](./MAJI%20Tea%20POS%E6%A9%9F%E7%B3%BB%E7%B5%B1%E4%BB%8B%E7%B4%B9%E5%9C%96%E7%89%87/%E7%99%BB%E5%85%A5%E4%BB%8B%E9%9D%A2.png)

2. **點餐功能**

- 選擇飲品類型、飲品名稱、糖度/冰塊、飲料容器大小、額外添加的配料、餐點數量，付款方式。

![點餐畫面](./MAJI%20Tea%20POS%E6%A9%9F%E7%B3%BB%E7%B5%B1%E4%BB%8B%E7%B4%B9%E5%9C%96%E7%89%87/%E9%BB%9E%E9%A4%90%E7%95%AB%E9%9D%A2.png)

3. **折扣系統**

- 免費招待、環保杯折扣、自帶瓶裝飲料杯折扣、優惠券套用功能。

4. **查看歷史訂單功能**

- 編輯訂單狀態、刪除訂單、查看訂單詳細內容、篩選顯示的訂單。

![查看訂單介面](./MAJI%20Tea%20POS%E6%A9%9F%E7%B3%BB%E7%B5%B1%E4%BB%8B%E7%B4%B9%E5%9C%96%E7%89%87/%E6%9F%A5%E7%9C%8B%E8%A8%82%E5%96%AE%E4%BB%8B%E9%9D%A2.png)


5. **後台設定功能**

- 商品管理：增加、刪除、修改飲品類型、飲料名稱、配料。
- 優惠設定：增加、刪除、修改現金折扣券、折數折扣券，編輯常用優惠的折價額度。

![後台設定編輯飲料畫面](./MAJI%20Tea%20POS%E6%A9%9F%E7%B3%BB%E7%B5%B1%E4%BB%8B%E7%B4%B9%E5%9C%96%E7%89%87/%E5%BE%8C%E5%8F%B0%E8%A8%AD%E5%AE%9A%E7%B7%A8%E8%BC%AF%E9%A3%B2%E6%96%99%E7%95%AB%E9%9D%A2.png)

![後台設定編輯折價券畫面](./MAJI%20Tea%20POS%E6%A9%9F%E7%B3%BB%E7%B5%B1%E4%BB%8B%E7%B4%B9%E5%9C%96%E7%89%87/%E5%BE%8C%E5%8F%B0%E8%A8%AD%E5%AE%9A%E7%B7%A8%E8%BC%AF%E6%8A%98%E5%83%B9%E6%8A%98%E6%89%A3%E5%88%B8%E7%95%AB%E9%9D%A2.png)


6. **數據分析功能**

- 選擇時間區間查看數據，以折線圖呈現營業額，以圓餅圖呈現熱門飲品、熱門配料、常用付款方式。

![數據分析顯示介面](./MAJI%20Tea%20POS%E6%A9%9F%E7%B3%BB%E7%B5%B1%E4%BB%8B%E7%B4%B9%E5%9C%96%E7%89%87/%E6%95%B8%E6%93%9A%E5%88%86%E6%9E%90%E7%86%B1%E9%96%80%E5%89%8D%E4%BA%94%E5%90%8D%E9%A3%B2%E6%96%99%E7%95%AB%E9%9D%A2.png)


7. **權限管理功能**

- 增加、刪除、修改員工名單，設定各別的權限。
- 設定付款方式：增加、刪除、修改，並且控制是否啟用。

![權限管理編輯員工畫面](./MAJI%20Tea%20POS%E6%A9%9F%E7%B3%BB%E7%B5%B1%E4%BB%8B%E7%B4%B9%E5%9C%96%E7%89%87/%E6%AC%8A%E9%99%90%E7%AE%A1%E7%90%86%E7%B7%A8%E8%BC%AF%E5%93%A1%E5%B7%A5%E7%95%AB%E9%9D%A2.png)


## 使用技術

1. **Vue3 Composition API**
2. **Vue-Router**
   
- 頁面切換及訪問權限控制

3. **Pinia**
  
- 資料管理。

4. **Element-Plus**
  
- UI組件庫。

5. **TailWind CSS**
  
- 快速樣式編寫，主要版型使用Flex和Grid布局。

6. **Vite**
  
- 專案建立與打包。

7. **ESLint**
  
- 程式碼規範管理。

8. **Prettier**
  
- 程式碼格式化。

9. **Git**
  
- 版本控制。

10. **Echarts**

- 數據分析圖表。

## 安裝與運行

確保你已安裝Node.js和pnpm。

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
