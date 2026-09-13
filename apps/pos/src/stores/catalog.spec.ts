import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCatalogStore } from './catalog'
import { useDiscountStore } from './discount'
import type { CartLineItem } from '@/types'

describe('useCatalogStore cart and pricing operations', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('初始種子資料載入正常', () => {
    const store = useCatalogStore()
    expect(store.categories.length).toBeGreaterThan(0)
    expect(store.products.length).toBeGreaterThan(0)
    expect(store.modifierGroups.length).toBeGreaterThan(0)
  })

  it('productCurrentTotal 根據選取的商品底價、規格加價與數量計算', () => {
    const store = useCatalogStore()
    const product = store.products.find((p) => p.name === '招牌牛肉漢堡')!
    store.selectedProduct = product
    store.productCount = '2'

    expect(store.productCurrentTotal).toBe(360)

    store.selectedModifiers = {
      'mg-burger-topping': ['mo-burger-topping-1']
    }
    expect(store.productCurrentTotal).toBe(400)
  })

  it('cartTotalMoney 與 currentItemCount 計算正確', () => {
    const store = useCatalogStore()
    const line1: CartLineItem = {
      id: 1,
      name: '招牌牛肉漢堡',
      price: '180',
      count: 2,
      discount: 0,
      addList: '無添加配料',
      addListPrice: 0,
      totalPrice: 360,
      freeDiscount: false,
      quickDiscountId: null,
      quickDiscountName: ''
    }
    const line2: CartLineItem = {
      id: 2,
      name: '經典薯條',
      price: '50',
      count: 1,
      discount: 0,
      addList: '無添加配料',
      addListPrice: 0,
      totalPrice: 50,
      freeDiscount: false,
      quickDiscountId: null,
      quickDiscountName: ''
    }

    store.cartLines = [line1, line2]
    store.currentBagCount = 2

    expect(store.currentItemCount).toBe(3)
    expect(store.cartTotalMoney).toBe(412)
  })

  it('cartPayPrice 與 useDiscountPrice 在套用整單折價券時計算正確', () => {
    const store = useCatalogStore()
    const discountStore = useDiscountStore()

    store.cartLines = [
      {
        id: 1,
        name: '牛排餐',
        price: '500',
        count: 1,
        discount: 0,
        addList: '無添加配料',
        addListPrice: 0,
        totalPrice: 500,
        freeDiscount: false,
        quickDiscountId: null,
        quickDiscountName: ''
      }
    ]
    store.currentBagCount = 0

    discountStore.orderCouponId = 1
    expect(store.cartPayPrice).toBe(450)
    expect(store.useDiscountPrice).toBe(50)

    discountStore.orderCouponId = 5
    expect(store.cartPayPrice).toBe(475)
    expect(store.useDiscountPrice).toBe(25)
  })

  it('startEditLine() 讀取購物車品項進入編輯狀態', () => {
    const store = useCatalogStore()
    const targetProduct = store.products[0]!
    const line: CartLineItem = {
      id: 1,
      productId: targetProduct.id,
      name: targetProduct.name,
      price: targetProduct.basePrice,
      count: 3,
      discount: 0,
      addList: '無添加配料',
      addListPrice: 0,
      totalPrice: Number(targetProduct.basePrice) * 3,
      freeDiscount: false,
      quickDiscountId: null,
      quickDiscountName: ''
    }

    const success = store.startEditLine(line)
    expect(success).not.toBe(false)
    expect(store.editingLine).toEqual(line)
    expect(store.productCount).toBe('3')
  })
})
