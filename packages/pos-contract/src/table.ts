import { z } from 'zod'
import { memberPhoneSchema } from './member'

export const tableStatusSchema = z.enum(['empty', 'occupied', 'reserved'])
export type TableStatus = z.infer<typeof tableStatusSchema>

export const reservationPhoneSchema = memberPhoneSchema

export const diningTableSchema = z.object({
  id: z.string().min(1),
  tableNumber: z.string().min(1),
  seats: z.number().int().positive(),
  status: tableStatusSchema,
  note: z.string(),
  guestCount: z.number().int().positive().nullable(),
  occupiedAt: z.string().nullable(),
  reservationPhone: z.string().nullable(),
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
  guestCount: z.number().int().positive().nullable().optional(),
  reservationPhone: reservationPhoneSchema.nullable().optional(),
  reservationTime: z.string().nullable().optional()
})
export type UpdateTableStatusRequest = z.infer<typeof updateTableStatusRequestSchema>
