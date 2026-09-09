import { describe, expect, it } from 'vitest'
import {
  AUTHORITY_FIELDS,
  STAFF_ROLE_PRESETS,
  cascadeAuthorityCheckList,
  deriveStaffRole,
  groupAuthorityFields,
} from './authority'

describe('deriveStaffRole', () => {
  it('三個角色範本各自對應到自己的角色名稱', () => {
    for (const [role, preset] of Object.entries(STAFF_ROLE_PRESETS)) {
      expect(deriveStaffRole(preset)).toBe(role)
    }
  })

  it('與 apps/api/seed/staff.sql 的三筆示範帳號權限組合一一對應', () => {
    // Lemon（店長）：全部 18 項權限。
    expect(deriveStaffRole(AUTHORITY_FIELDS.map((f) => f.value))).toBe('店長')
    // James（值班經理）。
    expect(deriveStaffRole([
      'canCompItem', 'canOpenCashier', 'canCheckOrder', 'canEditOrderStatus',
      'canCheckBackgroundSetting', 'canSetCategory', 'canSetProduct', 'canSetAddOns',
      'canCheckDataAnalysis',
    ])).toBe('值班經理')
    // Emily（工讀生）。
    expect(deriveStaffRole(['canCheckOrder', 'canEditOrderStatus', 'canCheckBackgroundSetting'])).toBe('工讀生')
  })

  it('少了或多了任何一項權限都不再是「已自訂」以外的角色', () => {
    const modified = STAFF_ROLE_PRESETS['值班經理'].filter((key) => key !== 'canCheckDataAnalysis')
    expect(deriveStaffRole(modified)).toBe('自訂')
  })

  it('空陣列不對應任何角色範本', () => {
    expect(deriveStaffRole([])).toBe('自訂')
  })
})

describe('cascadeAuthorityCheckList', () => {
  it('取消母權限時，連帶取消所有依附在它底下的子權限', () => {
    const result = cascadeAuthorityCheckList(['canCheckOrder', 'canEditOrderStatus', 'canDeleteOrder', 'canCompItem'])
    // 沒取消 canCheckOrder，子權限應該原封不動保留。
    expect(result).toEqual(['canCheckOrder', 'canEditOrderStatus', 'canDeleteOrder', 'canCompItem'])

    const cascaded = cascadeAuthorityCheckList(['canEditOrderStatus', 'canDeleteOrder', 'canCompItem'])
    expect(cascaded).toEqual(['canCompItem'])
  })
})

describe('groupAuthorityFields', () => {
  it('每個依附欄位都被分進對應母權限的分組，孤立欄位進「其他」', () => {
    const groups = groupAuthorityFields()
    const flatChildren = groups.flatMap((g) => g.children.map((c) => c.value))
    const fieldsWithDependsOn = AUTHORITY_FIELDS.filter((f) => f.dependsOn).map((f) => f.value)
    expect(new Set(flatChildren)).toEqual(new Set([
      ...fieldsWithDependsOn,
      ...AUTHORITY_FIELDS.filter((f) => !f.dependsOn && !AUTHORITY_FIELDS.some((c) => c.dependsOn === f.value)).map((f) => f.value),
    ]))
    expect(groups.find((g) => g.title === '其他')).toBeTruthy()
  })
})
