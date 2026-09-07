import { z } from 'zod'
import { ulidSchema } from './common'

/**
 * 班別結帳（重構規劃書 §10 P0「班別結帳」）。
 *
 * 單店單機情境（見規劃書 §3），這裡不做多終端班別隔離：同一時間全店
 * 只允許一個班別是 open 狀態，開帳／收班都是對「目前這一個班別」操作，
 * 不需要 terminalId 這類額外的區隔鍵。
 */

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

/**
 * cashSales／expectedCash／actualCash／variance 在班別還開著的時候都是
 * null——這幾個數字只有收班當下才算得出來（cashSales 要看整段區間的
 * 現金訂單，actualCash 要店員實際點鈔），不是開帳時就存在的資料。
 */
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
  expectedCash: z.number().int().nonnegative().nullable(),
  actualCash: z.number().int().nonnegative().nullable(),
  variance: z.number().int().nullable(),
  movements: z.array(cashMovementSchema),
})
export type Shift = z.infer<typeof shiftSchema>
