import { describe, expect, it } from 'vitest'
import { AUTHORITY_FIELDS, cascadeAuthorityCheckList, groupAuthorityFields } from './authority'

describe('cascadeAuthorityCheckList', () => {
  it('取消母權限時，連帶取消所有依附在它底下的子權限', () => {
    const result = cascadeAuthorityCheckList([
      'canCheckOrder',
      'canEditOrderStatus',
      'canDeleteOrder',
      'canCompItem'
    ])
    expect(result).toEqual(['canCheckOrder', 'canEditOrderStatus', 'canDeleteOrder', 'canCompItem'])

    const cascaded = cascadeAuthorityCheckList([
      'canEditOrderStatus',
      'canDeleteOrder',
      'canCompItem'
    ])
    expect(cascaded).toEqual(['canCompItem'])
  })
})

describe('groupAuthorityFields', () => {
  it('每個依附欄位都被分進對應母權限的分組，孤立欄位進「其他」', () => {
    const groups = groupAuthorityFields()
    const flatChildren = groups.flatMap((g) => g.children.map((c) => c.value))
    const fieldsWithDependsOn = AUTHORITY_FIELDS.filter((f) => f.dependsOn).map((f) => f.value)
    expect(new Set(flatChildren)).toEqual(
      new Set([
        ...fieldsWithDependsOn,
        ...AUTHORITY_FIELDS.filter(
          (f) => !f.dependsOn && !AUTHORITY_FIELDS.some((c) => c.dependsOn === f.value)
        ).map((f) => f.value)
      ])
    )
    expect(groups.find((g) => g.title === '其他')).toBeTruthy()
  })
})
