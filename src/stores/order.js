import { ref } from 'vue'
import { defineStore } from 'pinia'


export const useOrderStore = defineStore('order', () => {
  // 當前訂單編號
  const currentOrderNumber = ref(1)
  // 當前選擇的付款方式
  const currentSelectingPayment = ref('現金')
  // 付款方式
  const payment = ref('現金')
  // 定義全部付款方式清單
  const paymentList = ref(['現金', '信用卡', 'LinePay', '街口支付', '台灣Pay', 'ApplePay', 'Pi錢包', '全支付', '悠遊付'])
  // 訂單資訊
  const order = ref([])

  return { currentOrderNumber, order, payment, paymentList, currentSelectingPayment }
}, {
  persist: true,
})
