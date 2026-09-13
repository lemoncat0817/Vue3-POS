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

export const toBusinessDate = (pickerDate: string): string => pickerDate.replaceAll('/', '')

export const formatBusinessDate = (businessDate: string): string =>
  `${businessDate.slice(0, 4)}/${businessDate.slice(4, 6)}/${businessDate.slice(6, 8)}`

export const toNativeDate = (slashDate: string): string => slashDate.replaceAll('/', '-')

export const fromNativeDate = (nativeDate: string): string => nativeDate.replaceAll('-', '/')

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

// 依瀏覽器本地時區格式化，避免 UTC 字串切片造成日期偏差
export const formatDateOnly = (value: string): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(0, 10)
  const format = (num: number) => (num < 10 ? `0${num}` : num)
  return `${date.getFullYear()}/${format(date.getMonth() + 1)}/${format(date.getDate())}`
}

// 依瀏覽器本地時區格式化，避免 UTC 字串切片造成時間偏差
export const formatTimeOnly = (value: string): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(11, 16)
  const format = (num: number) => (num < 10 ? `0${num}` : num)
  return `${format(date.getHours())}:${format(date.getMinutes())}`
}

// nowMs 由呼叫端傳入以便統一 tick 計算與測試
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
