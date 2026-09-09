import { z } from 'zod'

/** 桌況管理 schema。桌況採店員手動維護，避免入座未點或多次加點造成訂單狀態無法可靠反推。 */
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
