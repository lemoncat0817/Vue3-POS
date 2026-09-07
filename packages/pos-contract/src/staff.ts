import { z } from 'zod'

/**
 * 權限能力鍵值，取代 apps/pos 現行的 16 個獨立 `'O'/'X'` 欄位加一份平行
 * `authorityCheckList` 陣列的雙重來源（D-10）。伺服端只有一份陣列。
 */
export const authorityKeySchema = z.enum([
  'canFreeDrink',
  'canOpenCashier',
  'canCheckOrder',
  'canEditOrderStatus',
  'canDeleteOrder',
  'canCheckBackgroundSetting',
  'canSetDrinkType',
  'canSetDrink',
  'canSetIngredients',
  'canSetMoneyDiscount',
  'canSetPercentDiscount',
  'canSetOftenUseDiscount',
  'canCheckDataAnalysis',
  'canCheckAuthority',
  'canSetAuthority',
  'canSetPayMethod',
])
export type AuthorityKey = z.infer<typeof authorityKeySchema>

/**
 * 員工資料。刻意不含密碼／憑證欄位——身分驗證（裝置憑證＋操作員登入）
 * 是 P4 的範圍，P2 這裡只先有「名單與權限」這份資料本身。
 */
export const staffSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  jobTitle: z.string().min(1),
  account: z.string().min(1),
  capabilities: z.array(authorityKeySchema),
})
export type Staff = z.infer<typeof staffSchema>

export const createStaffRequestSchema = staffSchema.omit({ id: true })
export type CreateStaffRequest = z.infer<typeof createStaffRequestSchema>
