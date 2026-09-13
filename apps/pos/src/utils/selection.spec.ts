import { describe, expect, it } from 'vitest'
import { fromSelection, hasCapability } from './selection'

describe('selection utils', () => {
  describe('fromSelection', () => {
    it('空陣列代表未選取，轉為 undefined', () => {
      expect(fromSelection([])).toBeUndefined()
    })

    it('undefined 維持 undefined', () => {
      expect(fromSelection(undefined)).toBeUndefined()
    })

    it('正常物件原樣回傳', () => {
      const obj = { id: 'item-1', name: '測試' }
      expect(fromSelection(obj)).toBe(obj)
    })
  })

  describe('hasCapability', () => {
    it('空陣列或未選取時回傳 false', () => {
      expect(hasCapability([], 'canCheckout')).toBe(false)
      expect(hasCapability(undefined, 'canCheckout')).toBe(false)
    })

    it('具備指定權限時回傳 true', () => {
      const user = { authorityCheckList: ['canCheckout', 'canRefund'] as const }
      expect(hasCapability(user, 'canCheckout')).toBe(true)
      expect(hasCapability(user, 'canRefund')).toBe(true)
    })

    it('不具備指定權限時回傳 false', () => {
      const user = { authorityCheckList: ['canCheckout'] as const }
      expect(hasCapability(user, 'canVoidOrder')).toBe(false)
    })
  })
})
