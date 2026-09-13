import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { FormNumeric, OrderCoupon, QuickDiscount } from '@/types'

export const useDiscountStore = defineStore(
  'discount',
  () => {
    const selectingOrderCouponId = ref<FormNumeric>(0)
    const orderCouponId = ref<FormNumeric>(0)
    const currentDiscountName = ref('')
    const orderCoupons = ref<OrderCoupon[]>([
      { id: 1, name: '$50折價券', kind: 'amount', value: 50 },
      { id: 2, name: '滿$300折$100元', kind: 'amount', value: 100 },
      { id: 3, name: '滿$500折$150元', kind: 'amount', value: 150 },
      { id: 4, name: '$200折價券', kind: 'amount', value: 200 },
      { id: 5, name: '整單95折', kind: 'percent', value: 0.95 },
      { id: 6, name: '週年慶整單88折', kind: 'percent', value: 0.88 },
      { id: 7, name: '滿千打7折', kind: 'percent', value: 0.7 },
      { id: 8, name: '滿萬打5折', kind: 'percent', value: 0.5 }
    ])
    const quickDiscounts = ref<QuickDiscount[]>([
      { id: 'quick-1', name: '常客優惠', kind: 'amount', value: 5 },
      { id: 'quick-2', name: '大宗採購優惠', kind: 'amount', value: 10 },
      { id: 'quick-3', name: '九折優惠', kind: 'percent', value: 0.9 },
      { id: 'quick-4', name: '八五折優惠', kind: 'percent', value: 0.85 },
      { id: 'quick-5', name: '員工優惠', kind: 'percent', value: 0.8 }
    ])

    const hydratePromotionsFromServer = (promotions: {
      orderCoupons: OrderCoupon[]
      quickDiscounts: QuickDiscount[]
    }) => {
      orderCoupons.value = promotions.orderCoupons
      quickDiscounts.value = promotions.quickDiscounts
    }

    return {
      hydratePromotionsFromServer,
      selectingOrderCouponId,
      orderCouponId,
      currentDiscountName,
      orderCoupons,
      quickDiscounts
    }
  },
  {
    persist: true
  }
)
