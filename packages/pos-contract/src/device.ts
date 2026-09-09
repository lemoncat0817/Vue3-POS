import { z } from 'zod'

/** 裝置憑證 schema。核發 token 僅回傳一次且後端僅存雜湊，故拆分列表與核發回應兩種 schema。 */
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
