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
  // P22（規劃書 §10 P22「會員與顧客經營」）：會員管理是新的一個
  // 分頁，需要獨立的權限鍵值，不能沿用其他分頁的權限（跟
  // canCheckDataAnalysis／canCheckAuthority 是同樣的「一個分頁一個
  // 權限鍵」慣例）。
  'canCheckMembers',
  // P24（規劃書 §10 P24「真實硬體整合與桌況管理」）：桌況管理也是
  // 新的一個分頁，同樣的「一個分頁一個權限鍵」慣例。
  'canManageTables',
])
export type AuthorityKey = z.infer<typeof authorityKeySchema>

/**
 * 員工資料。刻意不含密碼／憑證欄位——這是給列表／登入回應用的公開形狀，
 * PIN 雜湊值只存在伺服端資料庫（見 apps/api/src/db/schema.ts），永遠
 * 不會出現在任何 API 回應裡。
 */
export const staffSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  jobTitle: z.string().min(1),
  account: z.string().min(1),
  capabilities: z.array(authorityKeySchema),
})
export type Staff = z.infer<typeof staffSchema>

/** 操作員 PIN：4～6 碼數字，供實體終端機的數字鍵盤輸入（P4：規劃書 §9）。 */
export const pinSchema = z.string().regex(/^\d{4,6}$/, 'PIN 必須是 4 到 6 碼數字')

export const createStaffRequestSchema = staffSchema.omit({ id: true }).extend({ pin: pinSchema })
export type CreateStaffRequest = z.infer<typeof createStaffRequestSchema>

/**
 * 編輯員工（P18：規劃書 §10 P18「菜單與權限管理接上伺服端」）。pin
 * 是選填——大多數編輯只是改權限或職稱，不需要每次都重設 PIN；有填
 * 才會重新雜湊存入，見 routes/staff.ts 的說明。
 */
export const updateStaffRequestSchema = staffSchema.omit({ id: true }).extend({ pin: pinSchema.optional() })
export type UpdateStaffRequest = z.infer<typeof updateStaffRequestSchema>

/**
 * 操作員登入請求。pin 這裡不用 pinSchema 的格式限制——格式不對跟格式對
 * 但驗證失敗，都要走同一個「帳號或 PIN 錯誤」的 401，不要讓格式驗證
 * 錯誤本身洩漏「這個帳號存不存在」以外的額外資訊。
 */
export const operatorLoginRequestSchema = z.object({
  account: z.string().min(1),
  pin: z.string().min(1),
})
export type OperatorLoginRequest = z.infer<typeof operatorLoginRequestSchema>

export const operatorLoginResponseSchema = staffSchema
export type OperatorLoginResponse = z.infer<typeof operatorLoginResponseSchema>
