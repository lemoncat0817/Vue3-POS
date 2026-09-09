import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { GOLDEN_ORDERS, getBusinessDate } from '@pos/domain'
import type { OrderRecord, PaymentMethod } from '@/types'

export const useOrderStore = defineStore('order', () => {
  const currentOrderNumber = ref(1)
  // 付款方式資料來源：初次啟動時自伺服端注入，後續以本機（含管理員異動）為準。
  const paymentSource = ref<'seed' | 'server'>('seed')
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
  // 歷史訂單：預設為黃金資料集基準，structuredClone 隔離物件圖。
  const order = ref<OrderRecord[]>(structuredClone(GOLDEN_ORDERS) as unknown as OrderRecord[])

  // 送單當下依 getBusinessDate() 計算營業日，記錄上次核發日以利跨日重置序號。
  const lastBusinessDate = ref(getBusinessDate(new Date()))
  // 預覽即將送出的單號。
  const nextOrderId = computed(() => {
    const today = getBusinessDate(new Date())
    const seq = today === lastBusinessDate.value ? currentOrderNumber.value : 1
    return `${today}${seq}`
  })
  // 正式核發訂單編號：跨營業日則重設序號。
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

  // 同步成功後回填伺服端正式 orderId 與發票號碼。
  const reconcileOrderId = (localOrderId: string, serverOrderId: string, invoiceNumber: string) => {
    const record = order.value.find((item) => item.orderId === localOrderId)
    if (record) {
      record.orderId = serverOrderId
      record.invoiceNumber = invoiceNumber
    }
  }

  // 僅在尚未同步過伺服端資料時套用，避免覆蓋本機編輯。
  const hydratePaymentMethodsFromServer = (methods: PaymentMethod[]) => {
    if (paymentSource.value === 'server') return
    paymentList.value = methods
    paymentSource.value = 'server'
  }

  return {
    currentOrderNumber, order, paymentList,
    paymentSource, hydratePaymentMethodsFromServer,
    nextOrderId, issueOrderId, reconcileOrderId,
  }
}, {
  persist: true,
})
