/**
 * 給 type="text" + inputmode="numeric" 欄位用的輸入過濾。原本 type="number"
 * 會在瀏覽器層擋掉字母、符號這些不像數字的字元；改成 type="text" 之後瀏覽器
 * 什麼都不擋了，得自己在 @input 時過濾掉，不然使用者打錯字送出後，只會在
 * 伺服端收到一個「資料格式有誤」卻不知道是哪個欄位的提示。
 */
export function digitsOnly(raw: string): string {
  return raw.replace(/[^0-9]/g, '')
}

/** 轉成非負整數；空字串代表使用者清空了欄位，回傳 null 交給呼叫端決定要不要當作未填。 */
export function parseOptionalInt(raw: string): number | null {
  const digits = digitsOnly(raw)
  return digits === '' ? null : Number(digits)
}

/** 轉成非負整數，且不允許「未填」這個狀態——清空或整段刪掉都當作 0。 */
export function parseRequiredInt(raw: string, options?: { max?: number }): number {
  const digits = digitsOnly(raw)
  const value = digits === '' ? 0 : Number(digits)
  return options?.max !== undefined ? Math.min(value, options.max) : value
}
