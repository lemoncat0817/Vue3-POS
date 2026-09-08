import { z } from 'zod'

/**
 * 桌況管理（P24：規劃書 §10 P24「真實硬體整合與桌況管理」）。這部分
 * 不依賴硬體（不像 ESC/POS 印表機、錢櫃需要實體裝置才能真正介接，
 * 見規劃書「目前沒有介接硬體需求」的說明，那部分維持模擬），是真的
 * 做出來的功能。
 *
 * 桌況是店員手動維護的狀態（帶位時標成使用中、客人離開清理後標成
 * 空桌），不是由訂單生命週期自動推導——同一桌在結帳前可能加點好幾次、
 * 也可能客人入座還沒點餐，訂單狀態沒辦法可靠地反推「這桌現在能不能
 * 再帶位」，這是刻意的設計取捨，不是遺漏了自動化。
 */
export const tableStatusSchema = z.enum(['empty', 'occupied', 'reserved'])
export type TableStatus = z.infer<typeof tableStatusSchema>

export const diningTableSchema = z.object({
  id: z.string().min(1),
  tableNumber: z.string().min(1),
  seats: z.number().int().positive(),
  status: tableStatusSchema,
  note: z.string(),
})
export type DiningTable = z.infer<typeof diningTableSchema>

export const createTableRequestSchema = z.object({
  tableNumber: z.string().min(1),
  seats: z.number().int().positive(),
})
export type CreateTableRequest = z.infer<typeof createTableRequestSchema>

export const updateTableRequestSchema = createTableRequestSchema
export type UpdateTableRequest = z.infer<typeof updateTableRequestSchema>

export const updateTableStatusRequestSchema = z.object({
  status: tableStatusSchema,
  note: z.string().optional(),
})
export type UpdateTableStatusRequest = z.infer<typeof updateTableStatusRequestSchema>
