<template>
  <button
    type="button"
    class="border border-surface-300 bg-white text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100 dark:hover:bg-surface-800 md:text-[10px] text-[8px] font-bold rounded-lg mr-2 px-1 select-none 2xl:text-base xl:text-sm lg:text-xs"
    data-testid="parked-orders-button"
    @click="open = true"
  >
    掛單／取單<span v-if="parkedOrders.length > 0">（{{ parkedOrders.length }}）</span>
  </button>

  <ModalDialog :open="open" title="掛單／取單" @update:open="onOpenChange">
    <div class="flex flex-col gap-4">
      <div
        class="flex flex-col gap-2 rounded-lg border border-surface-200 p-3 dark:border-surface-700"
      >
        <p class="text-sm font-bold text-surface-700 dark:text-surface-300">
          掛起目前訂單
          <span class="font-normal text-surface-400 dark:text-surface-500"
            >（{{ catalogStore.currentItemCount }} 份，$ {{ catalogStore.cartTotalMoney }}）</span
          >
        </p>
        <input
          v-model="note"
          type="text"
          placeholder="備註（選填，例如：3號桌、王小姐）"
          class="w-full rounded-lg border border-surface-300 px-3 py-2 text-sm text-surface-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
        />
        <button
          type="button"
          :disabled="catalogStore.cartLines.length === 0"
          class="self-end rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
          data-testid="park-current-order"
          @click="parkCurrent"
        >
          掛起
        </button>
      </div>

      <div>
        <p class="mb-2 text-sm font-bold text-surface-700 dark:text-surface-300">目前掛單中</p>
        <p
          v-if="parkedOrders.length === 0"
          class="py-6 text-center text-sm text-surface-400 dark:text-surface-500"
        >
          目前沒有掛單
        </p>
        <div v-else class="flex flex-col gap-2">
          <div
            v-for="order in parkedOrders"
            :key="order.id"
            data-testid="parked-order-row"
            class="flex items-center justify-between rounded-lg border border-surface-200 p-3 dark:border-surface-700"
          >
            <div>
              <p class="text-sm font-bold text-surface-900 dark:text-surface-100">
                {{ order.note || '（無備註）' }}
              </p>
              <p class="text-xs text-surface-500 dark:text-surface-400">
                {{ formatTime(order.createdAt) }}．{{ itemCount(order) }} 份．$
                {{ totalPrice(order) }}
              </p>
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                class="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-primary-700"
                @click="resumeOrder(order)"
              >
                取單
              </button>
              <button
                type="button"
                class="rounded-lg border border-danger-200 px-3 py-1.5 text-xs font-bold text-danger-600 transition-colors hover:bg-danger-50 dark:border-danger-800 dark:text-danger-400 dark:hover:bg-danger-950"
                @click="removeOrder(order.id)"
              >
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
import { nextTick, ref, watch } from 'vue'
import ModalDialog from '@/components/ui/ModalDialog.vue'
import { useCatalogStore } from '@/stores/catalog'
import { useDiscountStore } from '@/stores/discount'
import { confirm } from '@/composables/useConfirm'
import { showToast } from '@/composables/useToast'
import { addParkedOrder, deleteParkedOrder, listParkedOrders } from '@/offline/parked-orders'
import type { ParkedOrder } from '@/offline/db'
import { ulid } from '@pos/domain'
import type { InvoiceCarrier } from '@pos/contract'
import type { OrderChannel } from '@/types'

const props = defineProps<{
  orderChannel: OrderChannel
  invoiceCarrier: InvoiceCarrier
  orderNote: string
}>()
const emit = defineEmits<{
  'update:orderChannel': [OrderChannel]
  'update:invoiceCarrier': [InvoiceCarrier]
  'update:orderNote': [string]
}>()

const catalogStore = useCatalogStore()
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

function itemCount(order: ParkedOrder) {
  return order.lines.reduce((sum, line) => sum + line.count, 0)
}

function totalPrice(order: ParkedOrder) {
  return Math.round(order.lines.reduce((sum, line) => sum + line.totalPrice, 0)) + order.bagCount
}

function formatTime(createdAt: number) {
  const date = new Date(createdAt)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 序列化為純物件儲存並透過 nextTick 確保清理通知旗標時序正確。
async function parkCurrent() {
  if (catalogStore.cartLines.length === 0) return

  await addParkedOrder({
    id: ulid(),
    createdAt: Date.now(),
    note: note.value.trim(),
    lines: JSON.parse(JSON.stringify(catalogStore.cartLines)),
    bagCount: catalogStore.currentBagCount,
    orderChannel: props.orderChannel,
    invoiceCarrier: JSON.parse(JSON.stringify(props.invoiceCarrier)),
    orderCouponId: discountStore.orderCouponId,
    currentDiscountName: discountStore.currentDiscountName,
    orderNote: props.orderNote
  })

  catalogStore.suppressClearedNotice = true
  catalogStore.cartLines = []
  await nextTick()
  catalogStore.suppressClearedNotice = false
  note.value = ''
  await refresh()
  showToast('已掛單', 'success')
}

async function resumeOrder(order: ParkedOrder) {
  if (catalogStore.cartLines.length > 0) {
    const result = await confirm({
      title: '取單',
      description: '目前待付款清單還有品項，取單會覆蓋目前清單，是否繼續？',
      confirmText: '繼續取單',
      cancelText: '取消',
      variant: 'danger'
    })
    if (result !== 'confirm') return
  }

  catalogStore.cartLines = JSON.parse(JSON.stringify(order.lines))
  catalogStore.currentBagCount = order.bagCount
  discountStore.orderCouponId = order.orderCouponId
  discountStore.currentDiscountName = order.currentDiscountName
  emit('update:orderChannel', order.orderChannel)
  emit('update:invoiceCarrier', order.invoiceCarrier)
  emit('update:orderNote', order.orderNote ?? '')

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
    variant: 'danger'
  })
  if (result !== 'confirm') return
  await deleteParkedOrder(id)
  await refresh()
  showToast('掛單已刪除', 'success')
}
</script>
