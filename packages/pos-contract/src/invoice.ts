import { z } from 'zod'

/** 電子發票字軌與上傳狀態 schema。字軌由後台設定管理；平台介接維持模擬以備未來串接實體憑證。 */
export const invoiceTrackSchema = z.object({
  id: z.string().min(1),
  trackCode: z.string().regex(/^[A-Z]{2}$/, '字軌代號需為 2 碼大寫英文字母'),
  periodLabel: z.string().min(1),
  rangeStart: z.number().int().positive(),
  rangeEnd: z.number().int().positive(),
  currentNumber: z.number().int().nonnegative(),
  isActive: z.boolean(),
})
export type InvoiceTrack = z.infer<typeof invoiceTrackSchema>

export const createInvoiceTrackRequestSchema = z
  .object({
    trackCode: z.string().regex(/^[A-Z]{2}$/, '字軌代號需為 2 碼大寫英文字母'),
    periodLabel: z.string().min(1),
    rangeStart: z.number().int().positive(),
    rangeEnd: z.number().int().positive(),
  })
  .refine((input) => input.rangeEnd > input.rangeStart, {
    message: '結束號碼必須大於起始號碼',
    path: ['rangeEnd'],
  })
export type CreateInvoiceTrackRequest = z.infer<typeof createInvoiceTrackRequestSchema>

/** 發票上傳狀態（issued: 已開立, submitted: 模擬上傳成功, voided: 已作廢）。 */
export const invoiceStatusSchema = z.enum(['issued', 'submitted', 'voided'])
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>

export const submitInvoicesResponseSchema = z.object({
  submittedCount: z.number().int().nonnegative(),
  submittedAt: z.string(),
})
export type SubmitInvoicesResponse = z.infer<typeof submitInvoicesResponseSchema>
