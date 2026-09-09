import { z } from 'zod'
import { ulidSchema } from './common'

/** 班別結帳 schema。單店情境下同一時間僅允許一個班別處於 open 狀態。 */

export const cashMovementTypeSchema = z.enum(['in', 'out'])
export type CashMovementType = z.infer<typeof cashMovementTypeSchema>

export const openShiftRequestSchema = z.object({
  shiftId: ulidSchema,
  operator: z.string().min(1),
  openingFloat: z.number().int().nonnegative(),
})
export type OpenShiftRequest = z.infer<typeof openShiftRequestSchema>

export const addCashMovementRequestSchema = z.object({
  type: cashMovementTypeSchema,
  amount: z.number().int().positive(),
  reason: z.string().min(1),
  operator: z.string().min(1),
})
export type AddCashMovementRequest = z.infer<typeof addCashMovementRequestSchema>

export const closeShiftRequestSchema = z.object({
  operator: z.string().min(1),
  actualCash: z.number().int().nonnegative(),
})
export type CloseShiftRequest = z.infer<typeof closeShiftRequestSchema>

export const cashMovementSchema = z.object({
  id: z.number().int(),
  type: cashMovementTypeSchema,
  amount: z.number().int().positive(),
  reason: z.string().min(1),
  operator: z.string().min(1),
  at: z.string(),
})
export type CashMovement = z.infer<typeof cashMovementSchema>

export const shiftStatusSchema = z.enum(['open', 'closed'])
export type ShiftStatus = z.infer<typeof shiftStatusSchema>

// cashSales/refunds/expectedCash/actualCash/variance 於開班期間為 null，待收班點鈔後結算。
export const shiftSchema = z.object({
  id: z.string(),
  status: shiftStatusSchema,
  openedBy: z.string(),
  openedAt: z.string(),
  openingFloat: z.number().int().nonnegative(),
  closedBy: z.string().nullable(),
  closedAt: z.string().nullable(),
  cashSales: z.number().int().nonnegative().nullable(),
  cashIn: z.number().int().nonnegative(),
  cashOut: z.number().int().nonnegative(),
  /** 班別期間的退款總額。 */
  refunds: z.number().int().nonnegative().nullable(),
  expectedCash: z.number().int().nonnegative().nullable(),
  actualCash: z.number().int().nonnegative().nullable(),
  variance: z.number().int().nullable(),
  movements: z.array(cashMovementSchema),
})
export type Shift = z.infer<typeof shiftSchema>
