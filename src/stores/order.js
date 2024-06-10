import { ref, watch } from 'vue'
import { defineStore } from 'pinia'


export const useOrderStore = defineStore('order', () => {
  // 當前訂單編號
  const currentOrderNumber = ref(1)
  // 當前選擇的付款方式
  const currentSelectingPayment = ref('現金')
  // 當前選擇的付款方式的支付方法
  const currentSelectingUseMethod = ref('紙鈔')
  // 付款方式的支付方法
  const useMethod = ref('紙鈔')
  // 付款方式
  const payment = ref('現金')
  // 定義全部付款方式清單
  const paymentList = ref([{
    "id": 1,
    "name": '現金',
    "disabled": false,
    "useMethod": '紙鈔'
  },
  {
    "id": 2,
    "name": '信用卡',
    "disabled": false,
    "useMethod": '感應'
  },

  {
    "id": 3,
    "name": 'LinePay',
    "disabled": false,
    "useMethod": '掃描'

  },
  {
    "id": 4,
    "name": '街口支付',
    "disabled": false,
    "useMethod": '掃描'
  },
  {
    "id": 5,
    "name": '台灣Pay',
    "disabled": false,
    "useMethod": '掃描'
  },
  {
    "id": 6,
    "name": 'ApplePay',
    "disabled": false,
    "useMethod": '感應'
  },
  {
    "id": 7,
    "name": 'Pi錢包',
    "disabled": false,
    "useMethod": '掃描'
  },
  {
    "id": 8,
    "name": '全支付',
    "disabled": false,
    "useMethod": '掃描'
  },
  {
    "id": 9,
    "name": '悠遊付',
    "disabled": false,
    "useMethod": '掃描'
  }
  ])
  // 訂單資訊
  const order = ref([
    {
      "orderId": "202406102",
      "orderTime": "2024/06/10 12:19:19",
      "orderStatus": "已完成",
      "staff": "店長 - Lemon ",
      "orderData": [
        {
          "id": 1,
          "name": "芝芝芒果果粒",
          "price": 90,
          "size": "L",
          "count": 3,
          "discount": 0,
          "addList": "無添加配料",
          "addListPrice": 0,
          "totalPrice": 270,
          "currentDiscountPercent": 1,
          "currentDiscountMoney": 0,
          "useDiscountPercent": "",
          "useDiscountMoney": "",
          "useDiscountFree": "",
          "freeDiscount": false,
          "ecoDiscount": false,
          "bottleDiscount": false,
          "oftenUseDiscount1": false,
          "oftenUseDiscount2": false,
          "oftenUseDiscount3": false
        },
        {
          "id": 2,
          "name": "香橙果粒茶,一分/微冰,瓶裝",
          "price": 100,
          "size": "bottle",
          "count": 5,
          "discount": 50,
          "addList": "無添加配料",
          "addListPrice": 0,
          "totalPrice": 450,
          "currentDiscountPercent": 1,
          "currentDiscountMoney": 10,
          "useDiscountPercent": "",
          "useDiscountMoney": "瓶裝折扣",
          "useDiscountFree": "",
          "freeDiscount": false,
          "ecoDiscount": false,
          "bottleDiscount": true,
          "oftenUseDiscount1": false,
          "oftenUseDiscount2": false,
          "oftenUseDiscount3": false
        },
        {
          "id": 3,
          "name": "翡翠綠茶,無糖/微冰,L杯",
          "price": 30,
          "size": "L",
          "count": 3,
          "discount": 0,
          "addList": "無添加配料",
          "addListPrice": 0,
          "totalPrice": 90,
          "currentDiscountPercent": 1,
          "currentDiscountMoney": 0,
          "useDiscountPercent": "",
          "useDiscountMoney": "",
          "useDiscountFree": "",
          "freeDiscount": false,
          "ecoDiscount": false,
          "bottleDiscount": false,
          "oftenUseDiscount1": false,
          "oftenUseDiscount2": false,
          "oftenUseDiscount3": false
        },
        {
          "id": 4,
          "name": "金萱雙Q,三分/微冰,L杯",
          "price": 40,
          "size": "L",
          "count": 3,
          "discount": 0,
          "addList": "無添加配料",
          "addListPrice": 0,
          "totalPrice": 120,
          "currentDiscountPercent": 1,
          "currentDiscountMoney": 0,
          "useDiscountPercent": "",
          "useDiscountMoney": "",
          "useDiscountFree": "",
          "freeDiscount": false,
          "ecoDiscount": false,
          "bottleDiscount": false,
          "oftenUseDiscount1": false,
          "oftenUseDiscount2": false,
          "oftenUseDiscount3": false
        }
      ],
      "orderBagCount": 0,
      "orderCupCount": 14,
      "orderTotalPrice": 930,
      "orderPayment": "現金",
      "orderDiscount": 50,
      "orderPaymentPrice": 880,
      "discountName": "$50折價券"
    },
    {
      "orderId": "202406105",
      "orderTime": "2024/06/10 12:36:23",
      "orderStatus": "已完成",
      "staff": "店長 - Lemon ",
      "orderData": [
        {
          "id": 1,
          "name": "芝芝阿華田,一分/去冰,L杯",
          "price": 80,
          "size": "L",
          "count": 1,
          "discount": 5,
          "addList": "無添加配料",
          "addListPrice": 0,
          "totalPrice": 75,
          "currentDiscountPercent": 1,
          "currentDiscountMoney": 5,
          "useDiscountPercent": "",
          "useDiscountMoney": "環保折扣",
          "useDiscountFree": "",
          "freeDiscount": false,
          "ecoDiscount": true,
          "bottleDiscount": false,
          "oftenUseDiscount1": false,
          "oftenUseDiscount2": false,
          "oftenUseDiscount3": false
        }
      ],
      "orderBagCount": 0,
      "orderCupCount": 1,
      "orderTotalPrice": 75,
      "orderPayment": "ApplePay",
      "orderDiscount": 0,
      "orderPaymentPrice": 75,
      "discountName": "無"
    },
    {
      "orderId": "202406106",
      "orderTime": "2024/06/10 12:37:11",
      "orderStatus": "已完成",
      "staff": "店長 - Lemon ",
      "orderData": [
        {
          "id": 1,
          "name": "鐵觀音拿鐵,三分/微冰,L杯",
          "price": 60,
          "size": "L",
          "count": 2,
          "discount": 0,
          "addList": "無添加配料",
          "addListPrice": 0,
          "totalPrice": 120,
          "currentDiscountPercent": 1,
          "currentDiscountMoney": 0,
          "useDiscountPercent": "",
          "useDiscountMoney": "",
          "useDiscountFree": "",
          "freeDiscount": false,
          "ecoDiscount": false,
          "bottleDiscount": false,
          "oftenUseDiscount1": false,
          "oftenUseDiscount2": false,
          "oftenUseDiscount3": false
        },
        {
          "id": 2,
          "name": "柳橙芒果果粒茶,半糖/少冰,L杯",
          "price": 70,
          "size": "L",
          "count": 5,
          "discount": 0,
          "addList": "無添加配料",
          "addListPrice": 0,
          "totalPrice": 350,
          "currentDiscountPercent": 1,
          "currentDiscountMoney": 0,
          "useDiscountPercent": "",
          "useDiscountMoney": "",
          "useDiscountFree": "",
          "freeDiscount": false,
          "ecoDiscount": false,
          "bottleDiscount": false,
          "oftenUseDiscount1": false,
          "oftenUseDiscount2": false,
          "oftenUseDiscount3": false
        }
      ],
      "orderBagCount": 0,
      "orderCupCount": 7,
      "orderTotalPrice": 470,
      "orderPayment": "現金",
      "orderDiscount": 50,
      "orderPaymentPrice": 420,
      "discountName": "$50折價券"
    },
    {
      "orderId": "202406107",
      "orderTime": "2024/06/10 12:39:23",
      "orderStatus": "已完成",
      "staff": "店長 - Lemon ",
      "orderData": [
        {
          "id": 1,
          "name": "金萱三Q,三分/微冰,L杯",
          "price": 45,
          "size": "L",
          "count": 30,
          "discount": 135,
          "addList": "無添加配料",
          "addListPrice": 0,
          "totalPrice": 1215,
          "currentDiscountPercent": 0.9,
          "currentDiscountMoney": 0,
          "useDiscountPercent": "九折",
          "useDiscountMoney": "",
          "useDiscountFree": "",
          "freeDiscount": false,
          "ecoDiscount": false,
          "bottleDiscount": false,
          "oftenUseDiscount1": true,
          "oftenUseDiscount2": false,
          "oftenUseDiscount3": false
        },
        {
          "id": 2,
          "name": "阿華田,一分/微冰,L杯",
          "price": 60,
          "size": "L",
          "count": 15,
          "discount": 120,
          "addList": [
            "芝芝"
          ],
          "addListPrice": 20,
          "totalPrice": 1080,
          "currentDiscountPercent": 0.9,
          "currentDiscountMoney": 0,
          "useDiscountPercent": "九折",
          "useDiscountMoney": "",
          "useDiscountFree": "",
          "freeDiscount": false,
          "ecoDiscount": false,
          "bottleDiscount": false,
          "oftenUseDiscount1": true,
          "oftenUseDiscount2": false,
          "oftenUseDiscount3": false
        },
        {
          "id": 3,
          "name": "蜂蜜檸檬,三分/少冰,L杯",
          "price": 55,
          "size": "L",
          "count": 7,
          "discount": 63,
          "addList": [
            "三Q",
            "混珠",
            "椰果"
          ],
          "addListPrice": 35,
          "totalPrice": 567,
          "currentDiscountPercent": 0.9,
          "currentDiscountMoney": 0,
          "useDiscountPercent": "九折",
          "useDiscountMoney": "",
          "useDiscountFree": "",
          "freeDiscount": false,
          "ecoDiscount": false,
          "bottleDiscount": false,
          "oftenUseDiscount1": true,
          "oftenUseDiscount2": false,
          "oftenUseDiscount3": false
        }
      ],
      "orderBagCount": 0,
      "orderCupCount": 52,
      "orderTotalPrice": 2862,
      "orderPayment": "LinePay",
      "orderDiscount": 150,
      "orderPaymentPrice": 2712,
      "discountName": "$150折價券"
    }
  ])
  // 監聽當前日期是否改變
  // 是的話重置訂單編號
  // 獲取當前日期
  const getDate = () => {
    const date = new Date()
    return date.toISOString().split('T')[0]
  }
  const currentDate = ref(getDate())
  // 每分鐘檢查一次日期是否變更
  setInterval(() => {
    currentDate.value = getDate()
  }, 60 * 1000)
  // 監聽日期變化
  watch(currentDate, (newDate, oldDate) => {
    if (newDate !== oldDate) {
      currentOrderNumber.value = 1
    }
  })

  return { currentOrderNumber, order, payment, paymentList, currentSelectingPayment, currentSelectingUseMethod, useMethod }
}, {
  persist: true,
})
