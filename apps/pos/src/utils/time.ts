export const getDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const format = (num: number) => num < 10 ? `0${num}` : num;
  return `${year}/${format(month)}/${format(day)}`;
}

// P6：原本這裡的 getMoment() 依現在幾點回傳「早班／中班／晚班／休息中」
// 這種純裝飾性文字，跟真正的營運狀態無關，唯一的呼叫點（home/index.vue
// 的「班別」欄位）已經改用真正有開帳零用金、收班點鈔算帳差的班別結帳
// 功能（見 components/checkout/ShiftPanel.vue），這個函式沒有其他呼叫
// 點，直接刪除。

export const getTime = () => {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const second = now.getSeconds();
  const format = (num: number) => num < 10 ? `0${num}` : num;
  return `${format(hour)}:${format(minute)}:${format(second)}`;
}

// P7（D-15）：views/dataAnalysis/index.vue 改成呼叫 GET /api/reports/sales
// 之後，畫面用的日期格式（el-date-picker 的 'YYYY/MM/DD'）跟 API 用的
// 營業日格式（YYYYMMDD，見 @pos/contract 的 businessDateSchema）不一樣，
// 需要在兩者之間轉換。

/** el-date-picker 的 'YYYY/MM/DD' 轉成 API 用的 YYYYMMDD 營業日格式。 */
export const toBusinessDate = (pickerDate: string): string => pickerDate.replaceAll('/', '')

/** YYYYMMDD 營業日格式轉回畫面顯示用的 'YYYY/MM/DD'。 */
export const formatBusinessDate = (businessDate: string): string =>
  `${businessDate.slice(0, 4)}/${businessDate.slice(4, 6)}/${businessDate.slice(6, 8)}`

// P8：組件庫替換——dataAnalysis/index.vue 的 el-date-picker 改用原生
// <input type="date">，原生輸入框固定用 'YYYY-MM-DD'（連字號），跟畫面
// 內部沿用的 'YYYY/MM/DD'（斜線）不同，需要在兩者間轉換。

/** 畫面內部的 'YYYY/MM/DD' 轉成 <input type="date"> 用的 'YYYY-MM-DD'。 */
export const toNativeDate = (slashDate: string): string => slashDate.replaceAll('/', '-')

/** <input type="date"> 的 'YYYY-MM-DD' 轉回畫面內部用的 'YYYY/MM/DD'。 */
export const fromNativeDate = (nativeDate: string): string => nativeDate.replaceAll('-', '/')