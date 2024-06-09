import { ref, watch } from 'vue'
import { defineStore } from 'pinia'


export const useOrderStore = defineStore('order', () => {
  // 當前訂單編號
  const currentOrderNumber = ref(1)
  // 當前選擇的付款方式
  const currentSelectingPayment = ref('現金')
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
  const order = ref([])
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

  return { currentOrderNumber, order, payment, paymentList, currentSelectingPayment }
}, {
  persist: true,
})
