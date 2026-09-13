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

/**
 * 訂單時間可能是伺服端回傳的 ISO UTC 字串，也可能是本機尚未同步、用
 * getDate()+getTime() 組出的 'YYYY/MM/DD HH:mm:ss'；統一格式化成後者這種
 * 使用者易讀的樣式，並把 ISO 的 UTC 時間換算成瀏覽器所在時區顯示。
 */
export const formatDateTime = (value: string): string => {
  if (!value.includes('T')) return value
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const format = (num: number) => (num < 10 ? `0${num}` : num)
  return (
    `${date.getFullYear()}/${format(date.getMonth() + 1)}/${format(date.getDate())} ` +
    `${format(date.getHours())}:${format(date.getMinutes())}:${format(date.getSeconds())}`
  )
}

/**
 * 只需要顯示日期時使用，例如會員建立日期；避免直接 slice ISO 字串前 10
 * 碼——那是 UTC 日期，在 UTC+8 這類時區可能跟本地日期差一天。
 */
export const formatDateOnly = (value: string): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(0, 10)
  const format = (num: number) => (num < 10 ? `0${num}` : num)
  return `${date.getFullYear()}/${format(date.getMonth() + 1)}/${format(date.getDate())}`
}

// 只需要顯示時間時使用，例如班別開帳時間；避免直接 slice ISO 字串的 11~16 碼，那是 UTC 時間。
export const formatTimeOnly = (value: string): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(11, 16)
  const format = (num: number) => (num < 10 ? `0${num}` : num)
  return `${format(date.getHours())}:${format(date.getMinutes())}`
}

// nowMs 由呼叫端傳入（而非內部呼叫 Date.now()），方便用同一個 tick 計算多張桌卡，也方便測試。
export const formatElapsedMinutes = (occupiedAtIso: string, nowMs: number): string => {
  const from = new Date(occupiedAtIso).getTime()
  if (Number.isNaN(from)) return ''
  const minutes = Math.max(0, Math.floor((nowMs - from) / 60_000))
  if (minutes < 1) return '剛入座'
  if (minutes < 60) return `已入座 ${minutes} 分鐘`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder === 0 ? `已入座 ${hours} 小時` : `已入座 ${hours} 小時 ${remainder} 分`
}
