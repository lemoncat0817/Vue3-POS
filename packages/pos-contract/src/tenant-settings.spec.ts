import { describe, expect, it } from 'vitest'
import {
  tenantSettingsSchema,
  updateTenantSettingsRequestSchema
} from './tenant-settings'

describe('tenantSettingsSchema & updateTenantSettingsRequestSchema', () => {
  const validSettings = {
    businessDayStartHour: 4,
    pointsPerCurrencyUnit: 100,
    pointsRedemptionRate: 1,
    pointsExpiryMonths: 12,
    autoOccupyTableOnCheckout: true
  }

  it('tenantSettingsSchema 接受完整合法營業設定', () => {
    expect(tenantSettingsSchema.safeParse(validSettings).success).toBe(true)
    expect(tenantSettingsSchema.safeParse({ ...validSettings, pointsExpiryMonths: null }).success).toBe(
      true
    )
  })

  it('換日時間限制在 0~23 小時整數', () => {
    expect(tenantSettingsSchema.safeParse({ ...validSettings, businessDayStartHour: 0 }).success).toBe(
      true
    )
    expect(tenantSettingsSchema.safeParse({ ...validSettings, businessDayStartHour: 23 }).success).toBe(
      true
    )
    expect(tenantSettingsSchema.safeParse({ ...validSettings, businessDayStartHour: 24 }).success).toBe(
      false
    )
    expect(tenantSettingsSchema.safeParse({ ...validSettings, businessDayStartHour: -1 }).success).toBe(
      false
    )
  })

  it('updateTenantSettingsRequestSchema 支援部分欄位更新', () => {
    expect(updateTenantSettingsRequestSchema.safeParse({}).success).toBe(true)
    expect(
      updateTenantSettingsRequestSchema.safeParse({
        autoOccupyTableOnCheckout: false
      }).success
    ).toBe(true)
    expect(
      updateTenantSettingsRequestSchema.safeParse({
        businessDayStartHour: 5
      }).success
    ).toBe(true)
  })
})
