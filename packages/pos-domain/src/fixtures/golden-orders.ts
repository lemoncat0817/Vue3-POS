/**
 * 重構基準訂單（黃金資料集）。
 * 包含 4 筆原始歷史訂單，作為計價邏輯重算與迴歸比對的基準。
 */
export const GOLDEN_ORDERS = [
  {
    orderId: '202406102',
    orderTime: '2024/06/10 12:19:19',
    orderStatus: '已完成',
    staff: '店長 - Lemon ',
    orderData: [
      {
        id: 1,
        name: '芝芝芒果果粒',
        price: 90,
        count: 3,
        discount: 0,
        addList: '無添加配料',
        addListPrice: 0,
        totalPrice: 270,
        freeDiscount: false,
        quickDiscountId: null,
        quickDiscountName: ''
      },
      {
        id: 2,
        name: '香橙果粒茶,一分/微冰,瓶裝',
        price: 100,
        count: 5,
        discount: 50,
        addList: '無添加配料',
        addListPrice: 0,
        totalPrice: 450,
        freeDiscount: false,
        quickDiscountId: 'quick-2',
        quickDiscountName: '大宗採購優惠'
      },
      {
        id: 3,
        name: '翡翠綠茶,無糖/微冰,L杯',
        price: 30,
        count: 3,
        discount: 0,
        addList: '無添加配料',
        addListPrice: 0,
        totalPrice: 90,
        freeDiscount: false,
        quickDiscountId: null,
        quickDiscountName: ''
      },
      {
        id: 4,
        name: '金萱雙Q,三分/微冰,L杯',
        price: 40,
        count: 3,
        discount: 0,
        addList: '無添加配料',
        addListPrice: 0,
        totalPrice: 120,
        freeDiscount: false,
        quickDiscountId: null,
        quickDiscountName: ''
      }
    ],
    orderBagCount: 0,
    orderCupCount: 14,
    orderTotalPrice: 930,
    orderPayment: '現金',
    orderDiscount: 50,
    orderPaymentPrice: 880,
    discountName: '$50折價券'
  },
  {
    orderId: '202406105',
    orderTime: '2024/06/10 12:36:23',
    orderStatus: '已完成',
    staff: '店長 - Lemon ',
    orderData: [
      {
        id: 1,
        name: '芝芝阿華田,一分/去冰,L杯',
        price: 80,
        count: 1,
        discount: 5,
        addList: '無添加配料',
        addListPrice: 0,
        totalPrice: 75,
        freeDiscount: false,
        quickDiscountId: 'quick-1',
        quickDiscountName: '常客優惠'
      }
    ],
    orderBagCount: 0,
    orderCupCount: 1,
    orderTotalPrice: 75,
    orderPayment: 'ApplePay',
    orderDiscount: 0,
    orderPaymentPrice: 75,
    discountName: '無'
  },
  {
    orderId: '202406106',
    orderTime: '2024/06/10 12:37:11',
    orderStatus: '已完成',
    staff: '店長 - Lemon ',
    orderData: [
      {
        id: 1,
        name: '鐵觀音拿鐵,三分/微冰,L杯',
        price: 60,
        count: 2,
        discount: 0,
        addList: '無添加配料',
        addListPrice: 0,
        totalPrice: 120,
        freeDiscount: false,
        quickDiscountId: null,
        quickDiscountName: ''
      },
      {
        id: 2,
        name: '柳橙芒果果粒茶,半糖/少冰,L杯',
        price: 70,
        count: 5,
        discount: 0,
        addList: '無添加配料',
        addListPrice: 0,
        totalPrice: 350,
        freeDiscount: false,
        quickDiscountId: null,
        quickDiscountName: ''
      }
    ],
    orderBagCount: 0,
    orderCupCount: 7,
    orderTotalPrice: 470,
    orderPayment: '現金',
    orderDiscount: 50,
    orderPaymentPrice: 420,
    discountName: '$50折價券'
  },
  {
    orderId: '202406107',
    orderTime: '2024/06/10 12:39:23',
    orderStatus: '已完成',
    staff: '店長 - Lemon ',
    orderData: [
      {
        id: 1,
        name: '金萱三Q,三分/微冰,L杯',
        price: 45,
        count: 30,
        discount: 135,
        addList: '無添加配料',
        addListPrice: 0,
        totalPrice: 1215,
        freeDiscount: false,
        quickDiscountId: 'quick-3',
        quickDiscountName: '九折優惠'
      },
      {
        id: 2,
        name: '阿華田,一分/微冰,L杯',
        price: 60,
        count: 15,
        discount: 120,
        addList: ['芝芝'],
        addListPrice: 20,
        totalPrice: 1080,
        freeDiscount: false,
        quickDiscountId: 'quick-3',
        quickDiscountName: '九折優惠'
      },
      {
        id: 3,
        name: '蜂蜜檸檬,三分/少冰,L杯',
        price: 55,
        count: 7,
        discount: 63,
        addList: ['三Q', '混珠', '椰果'],
        addListPrice: 35,
        totalPrice: 567,
        freeDiscount: false,
        quickDiscountId: 'quick-3',
        quickDiscountName: '九折優惠'
      }
    ],
    orderBagCount: 0,
    orderCupCount: 52,
    orderTotalPrice: 2862,
    orderPayment: 'LinePay',
    orderDiscount: 150,
    orderPaymentPrice: 2712,
    discountName: '$150折價券'
  }
] as const
