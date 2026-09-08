<template>
  <div class="flex w-full flex-col items-center overflow-y-auto bg-surface-50 dark:bg-surface-950 px-4 pb-10">
    <div class="mt-10 flex w-full max-w-6xl flex-col items-center">
      <h1 class="text-3xl font-black text-surface-900 dark:text-surface-100">訂單</h1>
      <p class="mt-1 text-sm text-surface-500 dark:text-surface-400">查看、篩選、管理已送出的訂單</p>

      <!-- 篩選功能：P8 重新設計——原本 5 個 el-popover，點按鈕才彈出「只有
           一個輸入框」的小面板，多按一次才能看到／改掉篩選內容。改成一次
           全部顯示在同一張卡片上，不需要額外的彈出層。 -->
      <div class="mt-6 grid w-full grid-cols-2 gap-3 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4 shadow-sm sm:grid-cols-3 lg:grid-cols-6">
        <label class="flex flex-col gap-1 text-xs font-bold text-surface-500 dark:text-surface-400">
          訂單編號
          <input
            v-model="filterOrderId"
            class="rounded-lg border border-surface-300 dark:border-surface-700 px-2 py-1.5 text-sm text-surface-900 dark:text-surface-100 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            placeholder="輸入訂單編號" />
        </label>
        <label class="flex flex-col gap-1 text-xs font-bold text-surface-500 dark:text-surface-400">
          訂單時間
          <input
            v-model="filterOrderTime"
            class="rounded-lg border border-surface-300 dark:border-surface-700 px-2 py-1.5 text-sm text-surface-900 dark:text-surface-100 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            placeholder="輸入訂單時間" />
        </label>
        <label class="flex flex-col gap-1 text-xs font-bold text-surface-500 dark:text-surface-400">
          服務人員
          <input
            v-model="filterOrderStaff"
            class="rounded-lg border border-surface-300 dark:border-surface-700 px-2 py-1.5 text-sm text-surface-900 dark:text-surface-100 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            placeholder="輸入服務人員" />
        </label>
        <label class="flex flex-col gap-1 text-xs font-bold text-surface-500 dark:text-surface-400">
          訂單狀態
          <input
            v-model="filterOrderStatus"
            class="rounded-lg border border-surface-300 dark:border-surface-700 px-2 py-1.5 text-sm text-surface-900 dark:text-surface-100 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            placeholder="輸入訂單狀態" />
        </label>
        <label class="flex flex-col gap-1 text-xs font-bold text-surface-500 dark:text-surface-400">
          付款方式
          <input
            v-model="filterOrderPayMethod"
            class="rounded-lg border border-surface-300 dark:border-surface-700 px-2 py-1.5 text-sm text-surface-900 dark:text-surface-100 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            placeholder="輸入付款方式" />
        </label>
        <div class="flex items-end">
          <button
            type="button"
            class="w-full rounded-lg border border-surface-300 dark:border-surface-700 px-2 py-1.5 text-sm font-bold text-surface-600 dark:text-surface-400 transition-colors hover:bg-surface-100 dark:hover:bg-surface-800"
            @click="resetFilter">
            重置篩選
          </button>
        </div>
      </div>
    </div>

    <!-- 訂單資料表格：P8 改用 TanStack Table（headless）取代 el-table，
         畫面本身用這個專案自己的 Tailwind token 從頭寫。 -->
    <div class="mt-6 w-full max-w-6xl overflow-hidden rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-surface-100 dark:bg-surface-800 text-xs font-bold uppercase tracking-wide text-surface-500 dark:text-surface-400">
            <tr>
              <th class="w-10 px-3 py-3" />
              <th v-for="header in leafHeaders" :key="header.id" class="px-3 py-3">
                {{ header.isPlaceholder ? '' : header.column.columnDef.header }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
            <template v-if="table.getRowModel().rows.length === 0">
              <tr>
                <td :colspan="leafHeaders.length + 1" class="px-3 py-10 text-center text-surface-400 dark:text-surface-500">目前無訂單</td>
              </tr>
            </template>
            <template v-for="row in table.getRowModel().rows" :key="row.id">
              <tr data-testid="order-row" class="transition-colors hover:bg-surface-50 dark:hover:bg-surface-950">
                <td class="px-3 py-3">
                  <button
                    type="button"
                    class="flex h-6 w-6 items-center justify-center rounded-full text-surface-500 dark:text-surface-400 transition-transform hover:bg-surface-100 dark:hover:bg-surface-800"
                    :class="{ 'rotate-90': expandedOrderId === row.original.orderId }"
                    :aria-label="expandedOrderId === row.original.orderId ? '收合明細' : '展開明細'"
                    @click="toggleExpand(row.original.orderId)">
                    ›
                  </button>
                </td>
                <td v-for="cell in row.getVisibleCells()" :key="cell.id" class="px-3 py-3 align-middle">
                  <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                </td>
              </tr>
              <tr v-if="expandedOrderId === row.original.orderId" class="bg-surface-50 dark:bg-surface-950">
                <td :colspan="leafHeaders.length + 1" class="px-4 py-4">
                  <div class="mb-3 flex flex-wrap gap-2">
                    <span class="rounded-full bg-white dark:bg-surface-900 px-3 py-1 text-xs font-bold text-surface-600 dark:text-surface-400 shadow-sm">
                      已買袋子數量：<span class="text-primary-600 dark:text-primary-400">{{ row.original.orderBagCount }}</span> 個
                    </span>
                    <span class="rounded-full bg-white dark:bg-surface-900 px-3 py-1 text-xs font-bold text-surface-600 dark:text-surface-400 shadow-sm">
                      飲料杯數：<span class="text-primary-600 dark:text-primary-400">{{ row.original.orderCupCount }}</span> 杯
                    </span>
                    <span class="rounded-full bg-white dark:bg-surface-900 px-3 py-1 text-xs font-bold text-surface-600 dark:text-surface-400 shadow-sm">
                      訂單原始金額：<span class="text-primary-600 dark:text-primary-400">${{ row.original.orderTotalPrice }}</span>
                    </span>
                    <span class="rounded-full bg-white dark:bg-surface-900 px-3 py-1 text-xs font-bold text-surface-600 dark:text-surface-400 shadow-sm">
                      已使用的優惠券：<span class="text-primary-600 dark:text-primary-400">{{ row.original.discountName }}</span>
                    </span>
                    <span class="rounded-full bg-white dark:bg-surface-900 px-3 py-1 text-xs font-bold text-surface-600 dark:text-surface-400 shadow-sm">
                      優惠券折抵：<span class="text-primary-600 dark:text-primary-400">${{ row.original.orderDiscount }}</span>
                    </span>
                    <span class="rounded-full bg-white dark:bg-surface-900 px-3 py-1 text-xs font-bold text-surface-600 dark:text-surface-400 shadow-sm">
                      顧客應付金額：<span class="text-primary-600 dark:text-primary-400">${{ row.original.orderPaymentPrice }}</span>
                    </span>
                    <span
v-if="(row.original.refundedAmount ?? 0) > 0"
                      class="rounded-full bg-warning-50 dark:bg-warning-950 px-3 py-1 text-xs font-bold text-warning-700 dark:text-warning-300 shadow-sm">
                      已退款：${{ row.original.refundedAmount }}
                    </span>
                    <span
v-if="row.original.voidReason"
                      class="rounded-full bg-danger-50 dark:bg-danger-950 px-3 py-1 text-xs font-bold text-danger-700 dark:text-danger-300 shadow-sm">
                      作廢原因：{{ row.original.voidReason }}（{{ row.original.voidedBy }}）
                    </span>
                  </div>
                  <div class="overflow-hidden rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
                    <table class="w-full text-center text-xs">
                      <thead class="bg-surface-100 dark:bg-surface-800 font-bold text-surface-500 dark:text-surface-400">
                        <tr>
                          <th class="px-2 py-2">序號</th>
                          <th class="px-2 py-2">商品</th>
                          <th class="px-2 py-2">單價</th>
                          <th class="px-2 py-2">加料</th>
                          <th class="px-2 py-2">配料金額</th>
                          <th class="px-2 py-2">數量</th>
                          <th class="px-2 py-2">折扣金額</th>
                          <th class="px-2 py-2">使用的折扣</th>
                          <th class="px-2 py-2">小計</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
                        <tr v-for="(line, index) in row.original.orderData" :key="index">
                          <td class="px-2 py-2">{{ index + 1 }}</td>
                          <td class="px-2 py-2">{{ line.name }}</td>
                          <td class="px-2 py-2">{{ line.price }} 元</td>
                          <td class="px-2 py-2">{{ line.addList }}</td>
                          <td class="px-2 py-2">{{ line.addListPrice }} 元</td>
                          <td class="px-2 py-2">{{ line.count }} 杯</td>
                          <td class="px-2 py-2">{{ line.discount }} 元</td>
                          <td class="px-2 py-2">
                            <div v-if="line.useDiscountPercent === '' && line.useDiscountMoney === '' && line.useDiscountFree === ''">
                              目前無使用折扣
                            </div>
                            <div v-else class="flex flex-wrap justify-center gap-1">
                              <span v-if="line.useDiscountFree != ''" class="rounded-full bg-info-100 px-2 py-0.5 text-info-700 dark:bg-info-950 dark:text-info-300">{{ line.useDiscountFree }}</span>
                              <span v-if="line.useDiscountPercent != ''" class="rounded-full bg-danger-100 px-2 py-0.5 text-danger-700 dark:bg-danger-950 dark:text-danger-300">{{ line.useDiscountPercent }}</span>
                              <span v-if="line.useDiscountMoney != ''" class="rounded-full bg-warning-100 px-2 py-0.5 text-warning-700 dark:bg-warning-950 dark:text-warning-300">{{ line.useDiscountMoney }}</span>
                            </div>
                          </td>
                          <td class="px-2 py-2 font-bold">{{ line.totalPrice }} 元</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- 分頁器：P8 改用 TanStack Table 內建的分頁 row model，取代原本
           手動 slice 的分頁邏輯。 -->
      <div class="flex flex-wrap items-center justify-between gap-3 border-t border-surface-200 dark:border-surface-800 px-4 py-3">
        <div class="text-sm text-surface-500 dark:text-surface-400">
          總共有 <span class="font-bold text-primary-600 dark:text-primary-400">{{ filterOrder.length }}</span> 筆訂單，
          當前頁面有 <span class="font-bold text-primary-600 dark:text-primary-400">{{ table.getRowModel().rows.length }}</span> 筆訂單
        </div>
        <div class="flex items-center gap-1">
          <button
            type="button"
            class="rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-1.5 text-sm font-bold text-surface-600 dark:text-surface-400 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="!table.getCanPreviousPage()"
            @click="table.previousPage()">
            上一頁
          </button>
          <span class="px-2 text-sm font-bold text-surface-700 dark:text-surface-300">
            {{ table.getState().pagination.pageIndex + 1 }} / {{ Math.max(table.getPageCount(), 1) }}
          </span>
          <button
            type="button"
            class="rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-1.5 text-sm font-bold text-surface-600 dark:text-surface-400 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="!table.getCanNextPage()"
            @click="table.nextPage()">
            下一頁
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h, ref } from 'vue'
import {
  FlexRender,
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  useVueTable,
} from '@tanstack/vue-table'
import { useOrderStore } from "@/stores/order"
const orderStore = useOrderStore()
import { useLoginStore } from "@/stores/login"
const loginStore = useLoginStore()
import { fromSelection } from '@/utils/selection'
import { deleteOrder as deleteOrderRequest, refundOrder as refundOrderRequest, updateOrderStatus } from '@/api/orders'
import { ApiError } from '@/api/http'
import { confirm } from '@/composables/useConfirm'
import { prompt } from '@/composables/usePrompt'
import { requestRefund } from '@/composables/useRefund'
import { showToast } from '@/composables/useToast'
import { ulid } from '@pos/domain'
import type { OrderRecord } from '@/types'

// P6：訂單還在離線佇列裡等待第一次同步時，伺服端根本沒有這筆訂單，
// 編輯狀態／刪除都會收到 404——用同一句話提示，不用另外做「排入佇列
// 稍後重試」（見 api/orders.ts 的說明）。
function orderApiErrorMessage(err: unknown): string {
  if (err instanceof ApiError && err.status === 404) {
    return '這筆訂單可能還在等待同步到伺服端，請稍後再試一次'
  }
  if (err instanceof ApiError) {
    return `操作失敗：${err.message}`
  }
  return '連不上伺服端，請確認網路連線'
}

// 訂單資料處理相關功能
const filterOrderId = ref('')
const filterOrderTime = ref('')
const filterOrderStaff = ref('')
const filterOrderStatus = ref('')
const filterOrderPayMethod = ref('')
// D-05：篩選字串含正規表示式特殊字元（如 "("）時，String.match() 會把它當
// pattern 編譯，丟出 SyntaxError 讓整頁掛掉。這裡只需要單純的子字串比對，
// 改用 includes() 就不會誤把使用者輸入當成正規表示式解析。
const filterOrder = computed(() => {
  return orderStore.order.filter(item => {
    return item.orderId.includes(filterOrderId.value) &&
      item.orderTime.includes(filterOrderTime.value) &&
      item.staff.includes(filterOrderStaff.value) &&
      item.orderStatus.includes(filterOrderStatus.value) &&
      item.orderPayment.includes(filterOrderPayMethod.value)
  })
})
const resetFilter = () => {
  filterOrderId.value = ''
  filterOrderTime.value = ''
  filterOrderStaff.value = ''
  filterOrderStatus.value = ''
  filterOrderPayMethod.value = ''
}

// 展開／收合明細：跟 TanStack Table 的 row model 分開管理（用 orderId
// 而不是 row index），篩選／換頁不會讓「展開中」的判斷跑掉。
const expandedOrderId = ref<string | null>(null)
function toggleExpand(orderId: string) {
  expandedOrderId.value = expandedOrderId.value === orderId ? null : orderId
}

const statusBadgeClass = (status: OrderRecord['orderStatus']) =>
  status === '已完成'
    ? 'rounded-full bg-success-100 px-2 py-0.5 text-xs font-bold text-success-700 dark:bg-success-950 dark:text-success-300'
    : 'rounded-full bg-surface-200 dark:bg-surface-800 px-2 py-0.5 text-xs font-bold text-surface-600 dark:text-surface-400'

// P12（規劃書 §10 P0「退款／作廢」）：refundedAmount 只有伺服端算過
// 一次才有真正的值（見 api/orders.ts 的 refundOrder 說明），golden
// orders 這類舊資料（見 stores/order.ts 的 GOLDEN_ORDERS）沒有這個
// 欄位，用 `?? 0` 兜底，不假設一定存在。
const refundedAmountOf = (order: OrderRecord) => order.refundedAmount ?? 0
const remainingRefundableOf = (order: OrderRecord) => Math.max(0, order.orderPaymentPrice - refundedAmountOf(order))

const columnHelper = createColumnHelper<OrderRecord>()
const columns = [
  columnHelper.accessor('orderId', { header: '訂單編號' }),
  columnHelper.accessor('orderTime', { header: '訂單時間' }),
  columnHelper.accessor('staff', { header: '服務人員' }),
  columnHelper.accessor('orderStatus', {
    header: '訂單狀態',
    cell: (info) => {
      const order = info.row.original
      const badges = [h('span', { class: statusBadgeClass(info.getValue()) }, info.getValue())]
      if (refundedAmountOf(order) > 0) {
        badges.push(h(
          'span',
          { class: 'rounded-full bg-warning-100 px-2 py-0.5 text-xs font-bold text-warning-700 dark:bg-warning-950 dark:text-warning-300' },
          `已退款 $${refundedAmountOf(order)}`,
        ))
      }
      return h('div', { class: 'flex flex-wrap items-center gap-1' }, badges)
    },
  }),
  columnHelper.accessor('orderPaymentPrice', {
    header: '訂單金額',
    cell: (info) => `${info.getValue()} 元`,
  }),
  columnHelper.accessor('orderPayment', { header: '付款方式' }),
  columnHelper.display({
    id: 'actions',
    header: '操作',
    cell: (info) => {
      const order = info.row.original
      const canEditStatus = fromSelection(loginStore.userInfo)?.canEditOrderStatus === 'O'
      const canDelete = fromSelection(loginStore.userInfo)?.canDeleteOrder === 'O'
      // 退款沒有另外開一個授權欄位（見 types/staff.ts 的 AuthorityKey
      // 說明），沿用「編輯訂單狀態」這一格權限——能改訂單狀態的人，
      // 業務上本來就該有權限處理退款，兩者是同一個信任層級。
      const canRefund = canEditStatus && order.orderStatus === '已完成' && remainingRefundableOf(order) > 0
      return h('div', { class: 'flex flex-wrap justify-end gap-2' }, [
        h('button', {
          type: 'button',
          class: [
            'rounded-lg border border-surface-300 dark:border-surface-700 px-2 py-1 text-xs font-bold text-surface-700 dark:text-surface-300 transition-colors hover:bg-surface-100 dark:hover:bg-surface-800',
            canEditStatus ? '' : 'pointer-events-none opacity-40',
          ],
          onClick: () => editOrderStatus(order.orderId),
        }, '編輯訂單狀態'),
        h('button', {
          type: 'button',
          class: [
            'rounded-lg border border-warning-200 px-2 py-1 text-xs font-bold text-warning-700 transition-colors hover:bg-warning-50 dark:border-warning-800 dark:text-warning-400 dark:hover:bg-warning-950',
            canRefund ? '' : 'pointer-events-none opacity-40',
          ],
          onClick: () => refundOrder(order),
        }, '退款'),
        h('button', {
          type: 'button',
          class: [
            'rounded-lg border border-danger-200 px-2 py-1 text-xs font-bold text-danger-600 transition-colors hover:bg-danger-50 dark:border-danger-800 dark:text-danger-400 dark:hover:bg-danger-950',
            canDelete ? '' : 'pointer-events-none opacity-40',
          ],
          onClick: () => deleteOrder(order.orderId),
        }, '刪除訂單'),
      ])
    },
  }),
]

const table = useVueTable({
  get data() { return filterOrder.value },
  columns,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  initialState: { pagination: { pageSize: 10 } },
})
// 表頭只有一層（沒有分組欄位），直接取第一個 header group 的 leaf headers。
const leafHeaders = computed(() => table.getHeaderGroups()[0]?.headers ?? [])

// 訂單操作相關功能
// 編輯訂單狀態（P6：改成真的呼叫伺服端，見 api/orders.ts 的說明；P8：
// 確認框改用 composables/useConfirm.ts，見該檔案對「確定／取消」語意的
// 說明——這裡是它存在的原因：這個對話框其實不是單純的「確定要做嗎」，
// 而是拿confirm／cancel兩個按鈕代表「已完成」／「已取消」兩個真正的
// 業務選項，ESC／點外面關閉則代表「兩個都不選」）。
// 目前登入操作員的顯示字串，跟 ShiftPanel.vue 的 operator prop、
// home/index.vue 的 staff 欄位用同一種組法（「職稱 - 姓名」），保持
// 一致——伺服端的 voidedBy／operator 這類欄位只是顯示用的自由文字，
// 不是要對應到某個帳號 id。
const currentOperator = () => `${fromSelection(loginStore.userInfo)?.jobTitle} - ${fromSelection(loginStore.userInfo)?.name}`

// P12（規劃書 §10 P0「退款／作廢」）：改成「已取消」現在是真正的
// 作廢操作，一定要交代原因——選了「已取消」之後，再彈一次
// PromptDialogHost（見 composables/usePrompt.ts）要求輸入理由，使用者
// 在這一步按取消／不填就整個操作取消，不會送出任何請求（不會出現
// 「已經選了已取消、但沒有理由」這種中間狀態）。改成「已完成」則不需要
// 理由，直接送出。
const editOrderStatus = async (id: string) => {
  const result = await confirm({
    title: '修改訂單狀態',
    description: '請選擇當前的訂單狀態',
    confirmText: '已完成',
    cancelText: '已取消',
  })
  if (result === 'dismiss') return
  const nextStatus = result === 'confirm' ? '已完成' : '已取消'

  let reason: string | undefined
  if (nextStatus === '已取消') {
    const voidReason = await prompt({
      title: '作廢原因',
      description: '這筆訂單將被標記為作廢，班別結算不會再計入這筆訂單的現金收入',
      label: '原因',
      placeholder: '例如：客人臨時取消、重複建單',
      confirmText: '確認作廢',
    })
    if (voidReason === null) return
    reason = voidReason
  }

  try {
    const updated = await updateOrderStatus(id, nextStatus, currentOperator(), reason)
    const local = orderStore.order.find(item => item.orderId === id)!
    local.orderStatus = updated.orderStatus
    local.voidReason = updated.voidReason
    local.voidedBy = updated.voidedBy
    local.voidedAt = updated.voidedAt
    showToast(`訂單狀態已設定為${nextStatus}`, 'success')
  } catch (err) {
    showToast(orderApiErrorMessage(err), 'error')
  }
}
// 退款（P12：規劃書 §10 P0「退款／作廢」）。跟作廢不同，退款不改變
// 訂單狀態——訂單仍是「已完成」，只是多記一筆退款紀錄，見 api/orders.ts
// 的 refundOrder 說明。
const refundOrder = async (order: OrderRecord) => {
  const max = remainingRefundableOf(order)
  if (max <= 0) return
  const result = await requestRefund({ max })
  if (result === null) return
  try {
    const updated = await refundOrderRequest(order.orderId, {
      refundId: ulid(),
      amount: result.amount,
      reason: result.reason,
      operator: currentOperator(),
    })
    const local = orderStore.order.find(item => item.orderId === order.orderId)!
    local.refundedAmount = updated.refundedAmount
    showToast(`退款成功，已退 $${result.amount}`, 'success')
  } catch (err) {
    showToast(orderApiErrorMessage(err), 'error')
  }
}
// 刪除訂單（P6：改成真的呼叫伺服端，見 api/orders.ts 的說明）
const deleteOrder = async (id: string) => {
  const result = await confirm({
    title: '警告',
    description: '是否要刪除該筆訂單？',
    confirmText: '確定',
    cancelText: '取消',
    variant: 'danger',
  })
  if (result !== 'confirm') return
  try {
    await deleteOrderRequest(id)
    orderStore.order = orderStore.order.filter(item => item.orderId != id)
    showToast('刪除成功', 'success')
  } catch (err) {
    showToast(orderApiErrorMessage(err), 'error')
  }
}
</script>

<style scoped></style>
