import { z } from 'zod'

export const deviceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  createdAt: z.string(),
  revokedAt: z.string().nullable()
})
export type Device = z.infer<typeof deviceSchema>

export const createDeviceRequestSchema = z.object({
  name: z.string().min(1)
})
export type CreateDeviceRequest = z.infer<typeof createDeviceRequestSchema>

export const createDeviceResponseSchema = deviceSchema.extend({
  token: z.string().min(1)
})
export type CreateDeviceResponse = z.infer<typeof createDeviceResponseSchema>

export const updateDeviceRequestSchema = z.object({
  name: z.string().min(1)
})
export type UpdateDeviceRequest = z.infer<typeof updateDeviceRequestSchema>
