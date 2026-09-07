export const getDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const format = (num: number) => num < 10 ? `0${num}` : num;
  return `${year}/${format(month)}/${format(day)}`;
}

export const getMoment = () => {
  const now = new Date();
  const hour = now.getHours();
  if (hour >= 8 && hour < 12) {
    return "早班"
  } else if (hour >= 12 && hour < 18) {
    return "中班"
  } else if (hour >= 18 && hour <= 22) {
    return "晚班"
  } else {
    return "休息中"
  }
}

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