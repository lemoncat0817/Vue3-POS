import type { QuickDiscount } from '../pricing'

export const DEFAULT_QUICK_DISCOUNTS: QuickDiscount[] = [
  { id: 'quick-1', name: '常客優惠', kind: 'amount', value: 5 },
  { id: 'quick-2', name: '大宗採購優惠', kind: 'amount', value: 10 },
  { id: 'quick-3', name: '九折優惠', kind: 'percent', value: 0.9 },
  { id: 'quick-4', name: '八五折優惠', kind: 'percent', value: 0.85 },
  { id: 'quick-5', name: '員工優惠', kind: 'percent', value: 0.8 }
]
