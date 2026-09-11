export const getDate = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()
  const format = (num: number) => (num < 10 ? `0${num}` : num)
  return `${year}/${format(month)}/${format(day)}`
}

export const getTime = () => {
  const now = new Date()
  const hour = now.getHours()
  const minute = now.getMinutes()
  const second = now.getSeconds()
  const format = (num: number) => (num < 10 ? `0${num}` : num)
  return `${format(hour)}:${format(minute)}:${format(second)}`
}

/** 'YYYY/MM/DD' 轉成 API 用的 YYYYMMDD 營業日格式。 */
export const toBusinessDate = (pickerDate: string): string => pickerDate.replaceAll('/', '')

/** YYYYMMDD 營業日格式轉回畫面顯示用的 'YYYY/MM/DD'。 */
export const formatBusinessDate = (businessDate: string): string =>
  `${businessDate.slice(0, 4)}/${businessDate.slice(4, 6)}/${businessDate.slice(6, 8)}`

/** 畫面內部的 'YYYY/MM/DD' 轉成 <input type="date"> 用的 'YYYY-MM-DD'。 */
export const toNativeDate = (slashDate: string): string => slashDate.replaceAll('/', '-')

/** <input type="date"> 的 'YYYY-MM-DD' 轉回畫面內部用的 'YYYY/MM/DD'。 */
export const fromNativeDate = (nativeDate: string): string => nativeDate.replaceAll('-', '/')
