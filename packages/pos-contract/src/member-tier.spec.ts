import { describe, expect, it } from 'vitest'
import {
  createMemberTierRequestSchema,
  memberTierSchema,
  memberTierStatusSchema,
  updateMemberTierRequestSchema
} from './member-tier'

describe('member tier contracts', () => {
  it('memberTierSchema 接受合法等級定義', () => {
    expect(
      memberTierSchema.safeParse({
        id: 'tier-gold',
        name: '黃金會員',
        minSpend: 5000
      }).success
    ).toBe(true)

    expect(
      memberTierSchema.safeParse({
        id: 'tier-gold',
        name: '黃金會員',
        minSpend: -1
      }).success
    ).toBe(false)
  })

  it('createMemberTierRequestSchema 與 updateMemberTierRequestSchema 拒絕空白名稱或負數門檻', () => {
    expect(
      createMemberTierRequestSchema.safeParse({
        name: '白金會員',
        minSpend: 10000
      }).success
    ).toBe(true)

    expect(
      updateMemberTierRequestSchema.safeParse({
        name: '白金會員',
        minSpend: 10000
      }).success
    ).toBe(true)

    expect(
      createMemberTierRequestSchema.safeParse({
        name: '   ',
        minSpend: 10000
      }).success
    ).toBe(false)
  })

  it('memberTierStatusSchema 允許 tier 為 null（無達標等級）或物件', () => {
    expect(
      memberTierStatusSchema.safeParse({
        tier: null,
        lifetimeSpend: 500
      }).success
    ).toBe(true)

    expect(
      memberTierStatusSchema.safeParse({
        tier: { id: 'tier-1', name: '一般會員', minSpend: 0 },
        lifetimeSpend: 500
      }).success
    ).toBe(true)
  })
})
