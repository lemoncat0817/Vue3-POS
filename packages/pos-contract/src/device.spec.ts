import { describe, expect, it } from 'vitest'
import {
  createDeviceRequestSchema,
  createDeviceResponseSchema,
  deviceSchema,
  updateDeviceRequestSchema
} from './device'

describe('device contracts', () => {
  it('deviceSchema 接受正常與已撤銷的裝置紀錄', () => {
    expect(
      deviceSchema.safeParse({
        id: 'dev-1',
        name: '櫃檯機台 A',
        createdAt: '2025-01-01T00:00:00Z',
        revokedAt: null
      }).success
    ).toBe(true)

    expect(
      deviceSchema.safeParse({
        id: 'dev-1',
        name: '櫃檯機台 A',
        createdAt: '2025-01-01T00:00:00Z',
        revokedAt: '2025-02-01T00:00:00Z'
      }).success
    ).toBe(true)
  })

  it('createDeviceRequestSchema 驗證名稱不得為空', () => {
    expect(createDeviceRequestSchema.safeParse({ name: '機台 B' }).success).toBe(true)
    expect(createDeviceRequestSchema.safeParse({ name: '' }).success).toBe(false)
  })

  it('createDeviceResponseSchema 必須包含核發的 token', () => {
    expect(
      createDeviceResponseSchema.safeParse({
        id: 'dev-2',
        name: '機台 B',
        createdAt: '2025-01-01T00:00:00Z',
        revokedAt: null,
        token: 'dev_token_secret_123'
      }).success
    ).toBe(true)

    expect(
      createDeviceResponseSchema.safeParse({
        id: 'dev-2',
        name: '機台 B',
        createdAt: '2025-01-01T00:00:00Z',
        revokedAt: null
      }).success
    ).toBe(false)
  })

  it('updateDeviceRequestSchema 驗證更新名稱', () => {
    expect(updateDeviceRequestSchema.safeParse({ name: '改名後的機台' }).success).toBe(true)
    expect(updateDeviceRequestSchema.safeParse({ name: '' }).success).toBe(false)
  })
})
