import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { GOLDEN_ORDERS, getBusinessDate } from '@pos/domain'
import type { OrderRecord, PaymentMethod } from '@/types'

export const useOrderStore = defineStore('order', () => {
  // 當前訂單編號
  const currentOrderNumber = ref(1)
  // P6（規劃書 §10 P0「混合支付」）：原本這裡的 payment／
  // currentSelectingPayment／currentSelectingUseMethod／useMethod 四個
  // ref 是「整張訂單只能選一種付款方式」的單選狀態——結帳流程改用
  // components/checkout/PaymentPanel.vue 之後，「這次結帳用了哪些付款
  // 方式、各分擔多少」變成每次結帳當下組出來的一組 tenders（見
  // views/home/index.vue 的 submitPayment()），不再是需要跨元件共用、
  // 需要長期持有的 store 狀態，四個 ref 直接刪除。paymentList（可選用
  // 的付款方式清單本身）仍是要跨頁面共用的設定資料，保留。
  //
  // P18（規劃書 §10 P18「菜單與權限管理接上伺服端」）：paymentList 原本
  // 是純本機寫死的陣列，authorityManagement/permissionManagement 頁面
  // 的新增／編輯／刪除也只改這個本機陣列，從沒呼叫過任何 API。現在
  // apps/api 有真正的 payment_methods 表（見 api/payment-methods.ts），
  // paymentSource 跟 stores/drink.ts 的 catalogSource 是同一套邏輯：
  // 只在「這個瀏覽器從來沒同步過伺服端付款方式清單」時套用一次
  // hydratePaymentMethodsFromServer() 的結果，之後永遠以本機（可能已被
  // 管理員編輯過）的資料為準，避免每次啟動都用伺服端資料覆蓋掉剛做的
  // 異動。
  const paymentSource = ref<'seed' | 'server'>('seed')
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

  // P3：離線送單先用本機序號（issueOrderId()）顯示，SyncWorker 同步成功
  // 後把伺服端算出的正式 orderId（見 apps/api/src/routes/orders.ts：
  // 同一營業日訂單數 + 1）回填——單店單機情境下兩者通常相同，但佇列
  // 裡有多筆等待同步、或同一營業日內曾經有過從未同步成功的失敗訂單時
  // 可能不同，以伺服端為準（見 src/offline/sync-worker.ts 的說明）。
  //
  // P15（規劃書 §10 P0「發票」）：發票號碼只有伺服端配發過才存在，
  // 送單當下本機記錄一律是空字串（見 views/home/index.vue 的
  // submitPayment），這裡順便一起回填，不是另外開一個「找到這筆訂單、
  // 更新它」的第二套機制。
  const reconcileOrderId = (localOrderId: string, serverOrderId: string, invoiceNumber: string) => {
    const record = order.value.find((item) => item.orderId === localOrderId)
    if (record) {
      record.orderId = serverOrderId
      record.invoiceNumber = invoiceNumber
    }
  }

  // 見上方 paymentSource 的說明：只在第一次（本機從未同步過伺服端付款
  // 方式清單）時套用，之後就算重新呼叫也不會再覆蓋本機資料。
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
