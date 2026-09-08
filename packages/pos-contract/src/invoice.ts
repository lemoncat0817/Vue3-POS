import { z } from 'zod'

/**
 * 電子發票字軌與上傳狀態（P23：規劃書 §10 P23「電子發票平台串接」）。
 *
 * 真正的統一發票字軌（兩碼英文字母前綴＋號碼區間）由財政部每兩個月
 * 配發一次，商家要先跟財政部申請下一期的字軌／號碼區間，不是系統
 * 自己決定的——這裡因此設計成「字軌是後台手動輸入的設定資料」，不是
 * 系統自動產生，跟真實流程一致；P15 當時簡化成單一固定前綴、永遠
 * 遞增，這裡才是真正補上字軌輪替與號碼區間管理。
 *
 * 上傳到財政部電子發票整合服務平台需要真正的平台介接憑證，這個專案
 * 沒有——見規劃書「目前沒有介接硬體需求」同樣精神的說明，這裡把資料
 * 模型與流程做好（哪些發票還沒上傳、上傳動作長什麼樣子），實際呼叫
 * 平台 API 的那一步保持模擬（見 routes/invoices.ts 的 submitInvoices
 * 說明），之後拿到真正的介接憑證只需要替換那一小段。
 */
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

/** 這張發票的上傳狀態——見上方說明，`submitted` 目前是模擬的批次上傳結果，不是真的打過財政部平台。 */
export const invoiceStatusSchema = z.enum(['issued', 'submitted', 'voided'])
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>

export const submitInvoicesResponseSchema = z.object({
  submittedCount: z.number().int().nonnegative(),
  submittedAt: z.string(),
})
export type SubmitInvoicesResponse = z.infer<typeof submitInvoicesResponseSchema>
