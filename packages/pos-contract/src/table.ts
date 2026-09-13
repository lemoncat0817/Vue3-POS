import { z } from 'zod'

/**
 * 桌況管理 schema。狀態切換本身仍由店員手動確認（含結帳自動連動觸發的切換，
 * 見 routes/orders.ts），避免一桌多次加點時單靠訂單事件反推狀態不準確；
 * 但轉成 occupied／reserved 附帶的入座時間、人數、預約資訊改由伺服端依
 * 轉換規則自動填寫或清空，不用店員自己對時間。
 */
export const tableStatusSchema = z.enum(['empty', 'occupied', 'reserved'])
export type TableStatus = z.infer<typeof tableStatusSchema>

/**
 * 預約聯絡電話格式：手機（09 開頭共 10 碼）或市話（區碼＋6~8碼、可加一個連字號）。
 * 訂位常見用市話回電，不能比照 memberPhoneSchema 只收手機號碼。
 */
export const reservationPhoneSchema = z
  .string()
  .trim()
  .regex(/^09\d{8}$|^0\d{1,2}-?\d{6,8}$/, '請輸入正確的電話號碼格式（例如：0912345678 或 02-12345678）')

export const diningTableSchema = z.object({
  id: z.string().min(1),
  tableNumber: z.string().min(1),
  seats: z.number().int().positive(),
  status: tableStatusSchema,
  note: z.string(),
  /** 目前用餐人數；只有 occupied 才有值，其餘狀態一律 null。 */
  guestCount: z.number().int().positive().nullable(),
  /** 轉成 occupied 當下的時間戳（ISO），用來算「已入座多久」；其餘狀態一律 null。 */
  occupiedAt: z.string().nullable(),
  /** 已預約狀態的聯絡電話；只有 reserved 才有值，其餘狀態一律 null。 */
  reservationPhone: z.string().nullable(),
  /** 預約時間（ISO）；只有 reserved 才有值，其餘狀態一律 null。 */
  reservationTime: z.string().nullable()
})
export type DiningTable = z.infer<typeof diningTableSchema>

export const createTableRequestSchema = z.object({
  tableNumber: z.string().min(1),
  seats: z.number().int().positive()
})
export type CreateTableRequest = z.infer<typeof createTableRequestSchema>

export const updateTableRequestSchema = createTableRequestSchema
export type UpdateTableRequest = z.infer<typeof updateTableRequestSchema>

export const updateTableStatusRequestSchema = z.object({
  status: tableStatusSchema,
  note: z.string().optional(),
  /** 手動編輯用餐人數（例如中途加人）；只在轉成／維持 occupied 時有意義。 */
  guestCount: z.number().int().positive().nullable().optional(),
  reservationPhone: reservationPhoneSchema.nullable().optional(),
  reservationTime: z.string().nullable().optional()
})
export type UpdateTableStatusRequest = z.infer<typeof updateTableStatusRequestSchema>
