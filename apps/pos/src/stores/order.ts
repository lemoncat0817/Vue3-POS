import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { GOLDEN_ORDERS, getBusinessDate } from '@pos/domain'
import type { OrderRecord, PaymentMethod, PaymentUseMethod } from '@/types'

export const useOrderStore = defineStore('order', () => {
  // 當前訂單編號
  const currentOrderNumber = ref(1)
  // 當前選擇的付款方式
  const currentSelectingPayment = ref('現金')
  // 當前選擇的付款方式的支付方法
  const currentSelectingUseMethod = ref<PaymentUseMethod>('紙鈔')
  // 付款方式的支付方法
  const useMethod = ref<PaymentUseMethod>('紙鈔')
  // 付款方式
  const payment = ref('現金')
  // 定義全部付款方式清單
  const paymentList = ref<PaymentMethod[]>([{
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
  // 資料來自 @pos/domain 的黃金資料集（見重構規劃書 §12），與 P1 的計價
  // 迴歸測試共用同一份基準內容；structuredClone 避免多個 store 實例共享
  // 同一份可變物件（保留原本每次 setup 都建立全新物件圖的行為）。
  const order = ref<OrderRecord[]>(structuredClone(GOLDEN_ORDERS) as unknown as OrderRecord[])

  // 訂單編號相關功能（修復 D-03、D-08）
  // 原本用 setInterval 每分鐘輪詢 UTC 日期（toISOString()）是否改變來
  // 重置訂單編號，換日時機因此落在台北時間 08:00（UTC 與本地時間差
  // 8 小時），且從未考慮跨夜營業。現在改為「送單當下用 getBusinessDate()
  // 現算」，不需要背景輪詢，也不會有 UTC／本地時間不一致的問題。
  // 記錄上一次核發訂單編號時的營業日，用來判斷是否要歸零。
  const lastBusinessDate = ref(getBusinessDate(new Date()))
  // 預覽用：畫面顯示「即將送出的單號」，但不會改變任何狀態。
  const nextOrderId = computed(() => {
    const today = getBusinessDate(new Date())
    const seq = today === lastBusinessDate.value ? currentOrderNumber.value : 1
    return `${today}${seq}`
  })
  // 正式核發訂單編號：換日則歸零計數器，接著遞增，回傳送出訂單當下要用的編號。
  const issueOrderId = () => {
    const today = getBusinessDate(new Date())
    if (today !== lastBusinessDate.value) {
      currentOrderNumber.value = 1
      lastBusinessDate.value = today
    }
    const id = `${today}${currentOrderNumber.value}`
    currentOrderNumber.value++
    return id
  }

  return {
    currentOrderNumber, order, payment, paymentList, currentSelectingPayment, currentSelectingUseMethod, useMethod,
    nextOrderId, issueOrderId,
  }
}, {
  persist: true,
})
