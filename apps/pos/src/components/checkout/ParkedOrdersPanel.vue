<template>
  <button
type="button"
    class="border border-surface-300 bg-white text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100 dark:hover:bg-surface-800 md:text-[10px] text-[8px] font-bold rounded-lg mr-2 px-1 select-none 2xl:text-base xl:text-sm lg:text-xs"
    data-testid="parked-orders-button" @click="open = true">
    掛單／取單<span v-if="parkedOrders.length > 0">（{{ parkedOrders.length }}）</span>
  </button>

  <ModalDialog :open="open" title="掛單／取單" @update:open="onOpenChange">
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-2 rounded-lg border border-surface-200 p-3 dark:border-surface-700">
        <p class="text-sm font-bold text-surface-700 dark:text-surface-300">
          掛起目前訂單
          <span class="font-normal text-surface-400 dark:text-surface-500">（{{ drinkStore.currentDrinkCount }} 杯，$ {{ drinkStore.drinkTotalMoney }}）</span>
        </p>
        <input
v-model="note" type="text" placeholder="備註（選填，例如：3號桌、王小姐）"
          class="w-full rounded-lg border border-surface-300 px-3 py-2 text-sm text-surface-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100">
        <button
type="button" :disabled="drinkStore.drinkNotPay.length === 0"
          class="self-end rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
          data-testid="park-current-order" @click="parkCurrent">
          掛起
        </button>
      </div>

      <div>
        <p class="mb-2 text-sm font-bold text-surface-700 dark:text-surface-300">目前掛單中</p>
        <p v-if="parkedOrders.length === 0" class="py-6 text-center text-sm text-surface-400 dark:text-surface-500">目前沒有掛單</p>
        <div v-else class="flex flex-col gap-2">
          <div
v-for="order in parkedOrders" :key="order.id" data-testid="parked-order-row"
            class="flex items-center justify-between rounded-lg border border-surface-200 p-3 dark:border-surface-700">
            <div>
              <p class="text-sm font-bold text-surface-900 dark:text-surface-100">{{ order.note || '（無備註）' }}</p>
              <p class="text-xs text-surface-500 dark:text-surface-400">
                {{ formatTime(order.createdAt) }}．{{ cupCount(order) }} 杯．$ {{ totalPrice(order) }}
              </p>
            </div>
            <div class="flex gap-2">
              <button
type="button"
                class="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-primary-700"
                @click="resumeOrder(order)">
                取單
              </button>
              <button
type="button"
                class="rounded-lg border border-danger-200 px-3 py-1.5 text-xs font-bold text-danger-600 transition-colors hover:bg-danger-50 dark:border-danger-800 dark:text-danger-400 dark:hover:bg-danger-950"
                @click="removeOrder(order.id)">
                刪除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ModalDialog>
</template>

<script setup lang="ts">
// P14（規劃書 §10 P0「掛單取單」）：讓店員把還沒送出的購物車暫存
// 起來、先服務下一位客人，稍後再取單繼續——這個專案原本沒有這個
// 概念，客人多的時候只能被迫按順序處理，或是靠腦袋記著上一位點到
// 哪裡。掛單只存在本機（見 offline/db.ts 的 ParkedOrder 說明），不
// 是一筆真正的訂單，不會出現在訂單列表，也不會佔用訂單序號。
import { nextTick, ref, watch } from 'vue'
import ModalDialog from '@/components/ui/ModalDialog.vue'
import { useDrinkStore } from '@/stores/drink'
import { useDiscountStore } from '@/stores/discount'
import { confirm } from '@/composables/useConfirm'
import { showToast } from '@/composables/useToast'
import { addParkedOrder, deleteParkedOrder, listParkedOrders } from '@/offline/parked-orders'
import type { ParkedOrder } from '@/offline/db'
import { ulid } from '@pos/domain'
import type { InvoiceCarrier } from '@pos/contract'
import type { OrderChannel } from '@/types'

const props = defineProps<{ orderChannel: OrderChannel; invoiceCarrier: InvoiceCarrier }>()
const emit = defineEmits<{ 'update:orderChannel': [OrderChannel]; 'update:invoiceCarrier': [InvoiceCarrier] }>()

const drinkStore = useDrinkStore()
const discountStore = useDiscountStore()

const open = ref(false)
const note = ref('')
const parkedOrders = ref<ParkedOrder[]>([])

async function refresh() {
  parkedOrders.value = await listParkedOrders()
}

watch(open, (isOpen) => {
  if (isOpen) {
    note.value = ''
    void refresh()
  }
})

function onOpenChange(value: boolean) {
  open.value = value
}

function cupCount(order: ParkedOrder) {
  return order.lines.reduce((sum, line) => sum + line.count, 0)
}

function totalPrice(order: ParkedOrder) {
  return Math.round(order.lines.reduce((sum, line) => sum + line.totalPrice, 0)) + order.bagCount
}

function formatTime(createdAt: number) {
  const date = new Date(createdAt)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 掛起目前訂單：把購物車、袋子數量、套用中的優惠券（見 stores/
// discount.ts 對應欄位的說明）連同備註存進 Dexie，再清空購物車——
// 清空這件事本身會觸發 drink.ts 的 cartClearedNotice watch（重置
// 袋子數量、優惠券選取狀態），這裡用 suppressClearedNotice 抑制那個
// watch 原本會彈的「已無品項」提示，改成下面自己的「已掛單」toast，
// 見 stores/drink.ts 的說明。
//
// suppressClearedNotice 設回 false 之前一定要 await nextTick()：Vue
// 的 watch() 預設是 pre-flush（排進微任務佇列、不是同步執行），如果
// 直接同步「設 true → 清空 drinkNotPay → 設 false」，drink.ts 那個
// watch 實際跑的時候看到的已經是 false（三行同步程式碼跑完，微任務
// 才輪到），等於完全沒抑制到，alert() 還是會跳出來——而且會用
// AlertDialog 蓋掉目前這個 ModalDialog（兩個 Reka 對話框的 hideOthers
// 互相干擾，導致這個對話框整個被標記 aria-hidden，畫面上看不出來但
// 所有互動都會被判定為「隱藏元素」而找不到，是實際踩過的 bug）。
//
// drinkNotPay 是 Pinia（Vue reactivity）的 reactive proxy，直接對它
// 呼叫 structuredClone() 會丟 DataCloneError（reactive proxy 本身不是
// structured-clone 演算法認得的型別）——這裡的品項全部是計價引擎已經
// 算好的純資料（數字／字串／陣列，見 CartLineItem 的定義），用
// JSON 序列化一輪繞過這個限制即可，不需要真正的 structuredClone。
async function parkCurrent() {
  if (drinkStore.drinkNotPay.length === 0) return

  await addParkedOrder({
    id: ulid(),
    createdAt: Date.now(),
    note: note.value.trim(),
    lines: JSON.parse(JSON.stringify(drinkStore.drinkNotPay)),
    bagCount: drinkStore.currentBagCount,
    orderChannel: props.orderChannel,
    // props.invoiceCarrier 是 ref<object> 的值，一樣是 reactive proxy
    // ——跟 drinkNotPay 同一個 DataCloneError 陷阱（見上面的說明），一併
    // 用 JSON 序列化繞過。
    invoiceCarrier: JSON.parse(JSON.stringify(props.invoiceCarrier)),
    moneyDiscountId: discountStore.moneyDiscountId,
    percentDiscountId: discountStore.percentDiscountId,
    currentMoneyDiscount: discountStore.currentMoneyDiscount,
    currentPercentDiscount: discountStore.currentPercentDiscount,
    currentDiscountName: discountStore.currentDiscountName,
  })

  drinkStore.suppressClearedNotice = true
  drinkStore.drinkNotPay = []
  await nextTick()
  drinkStore.suppressClearedNotice = false
  note.value = ''
  await refresh()
  showToast('已掛單', 'success')
}

// 取單：如果目前購物車還有品項，先確認是否要覆蓋——真的覆蓋掉還沒
// 送出的品項是不可逆的，值得跟結帳／作廢一樣的確認框（見
// composables/useConfirm.ts 的 danger variant 說明）。
async function resumeOrder(order: ParkedOrder) {
  if (drinkStore.drinkNotPay.length > 0) {
    const result = await confirm({
      title: '取單',
      description: '目前待付款清單還有品項，取單會覆蓋目前清單，是否繼續？',
      confirmText: '繼續取單',
      cancelText: '取消',
      variant: 'danger',
    })
    if (result !== 'confirm') return
  }

  // order.lines 是從 Dexie 讀回來的資料，本身不是 reactive proxy，
  // structuredClone() 在這個方向不會有上面說的問題；這裡仍然用同一種
  // 方式複製只是保持兩個方向的寫法一致，不是必要的防禦。
  drinkStore.drinkNotPay = JSON.parse(JSON.stringify(order.lines))
  drinkStore.currentBagCount = order.bagCount
  discountStore.moneyDiscountId = order.moneyDiscountId
  discountStore.percentDiscountId = order.percentDiscountId
  discountStore.currentMoneyDiscount = order.currentMoneyDiscount
  discountStore.currentPercentDiscount = order.currentPercentDiscount
  discountStore.currentDiscountName = order.currentDiscountName
  emit('update:orderChannel', order.orderChannel)
  emit('update:invoiceCarrier', order.invoiceCarrier)

  await deleteParkedOrder(order.id)
  await refresh()
  open.value = false
  showToast('已取單', 'success')
}

async function removeOrder(id: string) {
  const result = await confirm({
    title: '刪除掛單',
    description: '確定要刪除這筆掛單嗎？刪除後無法復原。',
    confirmText: '確定刪除',
    cancelText: '取消',
    variant: 'danger',
  })
  if (result !== 'confirm') return
  await deleteParkedOrder(id)
  await refresh()
  showToast('掛單已刪除', 'success')
}
</script>
