import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getBusinessDate } from '@pos/domain'
import type { OrderRecord, PaymentMethod } from '@/types'

export const useOrderStore = defineStore(
  'order',
  () => {
    const currentOrderNumber = ref(1)
    const paymentList = ref<PaymentMethod[]>([
      {
        id: 1,
        name: '現金',
        disabled: false,
        useMethod: '紙鈔'
      },
      {
        id: 2,
        name: '信用卡',
        disabled: false,
        useMethod: '感應'
      },

      {
        id: 3,
        name: 'LinePay',
        disabled: false,
        useMethod: '掃描'
      },
      {
        id: 4,
        name: '街口支付',
        disabled: false,
        useMethod: '掃描'
      },
      {
        id: 5,
        name: '台灣Pay',
        disabled: false,
        useMethod: '掃描'
      },
      {
        id: 6,
        name: 'ApplePay',
        disabled: false,
        useMethod: '感應'
      },
      {
        id: 7,
        name: 'Pi錢包',
        disabled: false,
        useMethod: '掃描'
      },
      {
        id: 8,
        name: '全支付',
        disabled: false,
        useMethod: '掃描'
      },
      {
        id: 9,
        name: '悠遊付',
        disabled: false,
        useMethod: '掃描'
      }
    ])
    // 歷史訂單：本機持久化清單，預設空陣列。GOLDEN_ORDERS 只是計價迴歸測試
    // 基準（見 packages/pos-domain/src/fixtures/golden-orders.ts），不該當成
    // 正式環境的初始訂單歷史種進每個使用者的 localStorage。
    const order = ref<OrderRecord[]>([])

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
    const reconcileOrderId = (
      localOrderId: string,
      serverOrderId: string,
      invoiceNumber: string
    ) => {
      const record = order.value.find((item) => item.orderId === localOrderId)
      if (record) {
        record.orderId = serverOrderId
        record.invoiceNumber = invoiceNumber
      }
    }

    // 開機每次拿到伺服端資料都整份覆蓋，本機資料只在離線／連不上時當 fallback。
    const hydratePaymentMethodsFromServer = (methods: PaymentMethod[]) => {
      paymentList.value = methods
    }

    return {
      currentOrderNumber,
      order,
      paymentList,
      hydratePaymentMethodsFromServer,
      nextOrderId,
      issueOrderId,
      reconcileOrderId
    }
  },
  {
    persist: true
  }
)
