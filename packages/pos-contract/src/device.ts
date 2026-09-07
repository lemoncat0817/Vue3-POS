import { z } from 'zod'

/**
 * 裝置憑證相關的 schema（P4：規劃書 §9 的身分系統）。
 *
 * 核發（POST /api/devices）回傳的 token 只會出現這一次，之後伺服端只
 * 存雜湊值——跟 GitHub personal access token 那類憑證同一種設計，這裡
 * 的 schema 因此明確拆成「一般列表看得到的欄位」跟「只有核發當下才有
 * 的明碼欄位」兩組，不是同一個 schema 選填。
 */
export const deviceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  createdAt: z.string(),
  revokedAt: z.string().nullable(),
})
export type Device = z.infer<typeof deviceSchema>

export const createDeviceRequestSchema = z.object({
  name: z.string().min(1),
})
export type CreateDeviceRequest = z.infer<typeof createDeviceRequestSchema>

export const createDeviceResponseSchema = deviceSchema.extend({
  /** 明碼裝置憑證，只在核發當下回傳這一次，之後無法再取得，只能撤銷重發。 */
  token: z.string().min(1),
})
export type CreateDeviceResponse = z.infer<typeof createDeviceResponseSchema>
