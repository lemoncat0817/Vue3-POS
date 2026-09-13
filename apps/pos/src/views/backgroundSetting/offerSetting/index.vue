<template>
  <div class="w-full flex flex-col">
    <div
      class="flex items-center gap-1.5 rounded-xl bg-surface-100 dark:bg-surface-800 p-1 mb-4 self-start"
    >
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="rounded-lg px-4 py-2 text-xs lg:text-sm font-bold transition-all select-none"
        :class="
          activeTab === tab.key
            ? 'bg-white dark:bg-surface-900 text-primary-600 dark:text-primary-400 shadow-sm'
            : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200'
        "
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 訂單折價券 -->
    <div v-if="activeTab === 'orderCoupons'" class="flex flex-col">
      <div
        class="overflow-hidden rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm flex flex-col justify-between min-h-[540px]"
      >
        <div
          class="flex items-center justify-between border-b border-surface-100 dark:border-surface-800 px-5 py-3.5"
        >
          <div>
            <span class="text-sm font-black text-surface-900 dark:text-surface-100">
              訂單折價券
            </span>
            <p class="mt-0.5 text-[11px] text-surface-400">
              結帳時整張訂單套用一張，例如「$50折價券」「整單95折」
            </p>
          </div>
          <button
            type="button"
            class="pos-btn pos-btn-primary px-3 py-1.5 text-xs"
            :class="{ 'opacity-50 pointer-events-none': !canSetOrderCoupon }"
            @click="openAddOrderCouponDialog"
          >
            ＋ 新增折價券
          </button>
        </div>

        <div class="overflow-x-auto flex-1">
          <table class="w-full text-left text-sm">
            <thead
              class="border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400"
            >
              <tr>
                <th class="px-4 py-3.5 text-left">折價券名稱</th>
                <th class="px-4 py-3.5 text-center">類型</th>
                <th class="px-4 py-3.5 text-right">折抵值</th>
                <th class="px-4 py-3.5 text-center">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
              <tr v-if="sliceOrderCoupons.length === 0">
                <td
                  colspan="4"
                  class="px-4 py-16 text-center text-surface-400 dark:text-surface-500"
                >
                  <div class="flex flex-col items-center justify-center gap-2">
                    <Ticket class="h-10 w-10 text-surface-300 dark:text-surface-700" />
                    <span class="text-base font-semibold text-surface-700 dark:text-surface-300"
                      >無折價券</span
                    >
                    <span class="text-xs text-surface-400 dark:text-surface-500"
                      >尚未建立折價券，可點選上方「＋ 新增折價券」</span
                    >
                  </div>
                </td>
              </tr>
              <tr
                v-for="row in sliceOrderCoupons"
                :key="row.id"
                class="transition-colors hover:bg-surface-50/80 dark:hover:bg-surface-800/40"
              >
                <td
                  class="px-4 py-3.5 align-middle text-left font-bold text-surface-900 dark:text-surface-100"
                >
                  {{ row.name }}
                </td>
                <td class="px-4 py-3.5 align-middle text-center">
                  <span
                    class="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold"
                    :class="
                      row.kind === 'amount'
                        ? 'bg-success-50 text-success-600 dark:bg-success-950/40 dark:text-success-400'
                        : 'bg-info-50 text-info-600 dark:bg-info-950/40 dark:text-info-400'
                    "
                  >
                    {{ row.kind === 'amount' ? '定額' : '折數' }}
                  </span>
                </td>
                <td
                  class="px-4 py-3.5 align-middle text-right font-mono font-bold"
                  :class="
                    row.kind === 'amount'
                      ? 'text-success-600 dark:text-success-400'
                      : 'text-info-600 dark:text-info-400'
                  "
                >
                  {{ row.kind === 'amount' ? `-$${row.value}` : row.value }}
                </td>
                <td class="px-4 py-3.5 align-middle text-center">
                  <div class="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      class="pos-btn pos-btn-secondary px-2.5 py-1 text-xs"
                      :class="{ 'opacity-50 pointer-events-none': !canSetOrderCoupon }"
                      @click="openEditOrderCouponDialog(row)"
                    >
                      編輯
                    </button>
                    <button
                      type="button"
                      class="pos-btn pos-btn-danger px-2.5 py-1 text-xs"
                      :class="{ 'opacity-50 pointer-events-none': !canSetOrderCoupon }"
                      @click="removeOrderCoupon(row)"
                    >
                      刪除
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <TablePagination
          :page="orderCouponPage"
          :page-count="orderCouponPageCount"
          :total="discountStore.orderCoupons.length"
          :current-count="sliceOrderCoupons.length"
          unit="張折價券"
          @update:page="(v) => (orderCouponPage = v)"
        />
      </div>
    </div>

    <!-- 快速折扣 -->
    <div v-if="activeTab === 'quickDiscounts'" class="flex flex-col">
      <div
        class="overflow-hidden rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm flex flex-col justify-between min-h-[540px]"
      >
        <div
          class="flex items-center justify-between border-b border-surface-100 dark:border-surface-800 px-5 py-3.5"
        >
          <div>
            <span class="text-sm font-black text-surface-900 dark:text-surface-100">
              快速折扣
            </span>
            <p class="mt-0.5 text-[11px] text-surface-400">
              點餐頁購物車勾選品項後可直接套用的快捷折扣按鈕
            </p>
          </div>
          <button
            type="button"
            class="pos-btn pos-btn-primary px-3 py-1.5 text-xs"
            :class="{ 'opacity-50 pointer-events-none': !canSetQuickDiscount }"
            @click="openAddQuickDiscountDialog"
          >
            ＋ 新增快速折扣
          </button>
        </div>

        <div class="overflow-x-auto flex-1">
          <table class="w-full text-left text-sm">
            <thead
              class="border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400"
            >
              <tr>
                <th class="px-4 py-3.5 text-left">優惠名稱</th>
                <th class="px-4 py-3.5 text-center">類型</th>
                <th class="px-4 py-3.5 text-right">折抵值</th>
                <th class="px-4 py-3.5 text-center">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
              <tr v-if="sliceQuickDiscount.length === 0">
                <td
                  colspan="4"
                  class="px-4 py-16 text-center text-surface-400 dark:text-surface-500"
                >
                  <div class="flex flex-col items-center justify-center gap-2">
                    <Percent class="h-10 w-10 text-surface-300 dark:text-surface-700" />
                    <span class="text-base font-semibold text-surface-700 dark:text-surface-300"
                      >無快速折扣</span
                    >
                    <span class="text-xs text-surface-400 dark:text-surface-500"
                      >尚未建立快速折扣，可點選上方「＋ 新增快速折扣」</span
                    >
                  </div>
                </td>
              </tr>
              <tr
                v-for="row in sliceQuickDiscount"
                :key="row.id"
                class="transition-colors hover:bg-surface-50/80 dark:hover:bg-surface-800/40"
              >
                <td
                  class="px-4 py-3.5 align-middle text-left font-bold text-surface-900 dark:text-surface-100"
                >
                  {{ row.name }}
                </td>
                <td class="px-4 py-3.5 align-middle text-center">
                  <span
                    class="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold"
                    :class="
                      row.kind === 'amount'
                        ? 'bg-success-50 text-success-600 dark:bg-success-950/40 dark:text-success-400'
                        : 'bg-info-50 text-info-600 dark:bg-info-950/40 dark:text-info-400'
                    "
                  >
                    {{ row.kind === 'amount' ? '定額' : '折數' }}
                  </span>
                </td>
                <td
                  class="px-4 py-3.5 align-middle text-right font-mono font-bold text-primary-600 dark:text-primary-400"
                >
                  {{ row.kind === 'amount' ? `-$${row.value}` : row.value }}
                </td>
                <td class="px-4 py-3.5 align-middle text-center">
                  <div class="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      class="pos-btn pos-btn-secondary px-2.5 py-1 text-xs"
                      :class="{ 'opacity-50 pointer-events-none': !canSetQuickDiscount }"
                      @click="openEditQuickDiscountDialog(row)"
                    >
                      編輯
                    </button>
                    <button
                      type="button"
                      class="pos-btn pos-btn-danger px-2.5 py-1 text-xs"
                      :class="{ 'opacity-50 pointer-events-none': !canSetQuickDiscount }"
                      @click="removeQuickDiscount(row)"
                    >
                      刪除
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <TablePagination
          :page="quickDiscountPage"
          :page-count="quickDiscountPageCount"
          :total="discountStore.quickDiscounts.length"
          :current-count="sliceQuickDiscount.length"
          unit="項快捷折扣"
          @update:page="(v) => (quickDiscountPage = v)"
        />
      </div>
    </div>

    <!-- 新增訂單折價券 -->
    <ModalDialog v-model:open="addOrderCouponDialog" title="新增訂單折價券">
      <Form
        v-slot="{ isSubmitting, values, setFieldValue }"
        :validation-schema="toTypedSchema(orderCouponSchema())"
        :initial-values="{ name: '', kind: 'amount', value: 0 }"
        @submit="onSubmitAddOrderCoupon"
      >
        <div class="space-y-4 py-2">
          <FormField
            name="name"
            label="折價券名稱"
            :disabled="isSubmitting"
            placeholder="例如: $50折價券、整單95折..."
          />
          <label class="mb-4 block text-sm font-bold text-surface-700 dark:text-surface-300">
            類型
            <select
              :value="values.kind"
              class="mt-1 w-full rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-sm font-normal text-surface-900 dark:text-surface-100 outline-none"
              @change="setFieldValue('kind', ($event.target as HTMLSelectElement).value)"
            >
              <option value="amount">定額折抵</option>
              <option value="percent">折數折抵</option>
            </select>
          </label>
          <FormField
            name="value"
            :label="values.kind === 'amount' ? '折抵金額' : '折抵折數'"
            type="text"
            :inputmode="values.kind === 'amount' ? 'numeric' : 'decimal'"
            :step="values.kind === 'amount' ? '1' : '0.01'"
            :disabled="isSubmitting"
            :placeholder="
              values.kind === 'amount' ? '純數字,例如:50,100...' : '純數字,例如:0.9,0.75...'
            "
          />
        </div>
        <div class="mt-6 flex justify-end gap-2.5">
          <button
            type="button"
            class="pos-btn pos-btn-secondary px-4 py-2 text-xs font-bold"
            @click="addOrderCouponDialog = false"
          >
            取消
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="pos-btn pos-btn-primary px-5 py-2 text-xs font-bold"
          >
            新增
          </button>
        </div>
      </Form>
    </ModalDialog>

    <!-- 編輯訂單折價券 -->
    <ModalDialog v-model:open="editOrderCouponDialog" title="編輯訂單折價券">
      <Form
        v-slot="{ isSubmitting, values, setFieldValue }"
        :validation-schema="toTypedSchema(orderCouponSchema(editingOrderCoupon.id))"
        :initial-values="{
          name: editingOrderCoupon.name,
          kind: editingOrderCoupon.kind,
          value: Number(editingOrderCoupon.value)
        }"
        @submit="onSubmitEditOrderCoupon"
      >
        <div class="space-y-4 py-2">
          <FormField
            name="name"
            label="折價券名稱"
            :disabled="isSubmitting"
            placeholder="例如: $50折價券、整單95折..."
          />
          <label class="mb-4 block text-sm font-bold text-surface-700 dark:text-surface-300">
            類型
            <select
              :value="values.kind"
              class="mt-1 w-full rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-sm font-normal text-surface-900 dark:text-surface-100 outline-none"
              @change="setFieldValue('kind', ($event.target as HTMLSelectElement).value)"
            >
              <option value="amount">定額折抵</option>
              <option value="percent">折數折抵</option>
            </select>
          </label>
          <FormField
            name="value"
            :label="values.kind === 'amount' ? '折抵金額' : '折抵折數'"
            type="text"
            :inputmode="values.kind === 'amount' ? 'numeric' : 'decimal'"
            :step="values.kind === 'amount' ? '1' : '0.01'"
            :disabled="isSubmitting"
            :placeholder="
              values.kind === 'amount' ? '純數字,例如:50,100...' : '純數字,例如:0.9,0.75...'
            "
          />
        </div>
        <div class="mt-6 flex justify-end gap-2.5">
          <button
            type="button"
            class="pos-btn pos-btn-secondary px-4 py-2 text-xs font-bold"
            @click="editOrderCouponDialog = false"
          >
            取消
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="pos-btn pos-btn-primary px-5 py-2 text-xs font-bold"
          >
            保存
          </button>
        </div>
      </Form>
    </ModalDialog>

    <!-- 新增快速折扣 -->
    <ModalDialog v-model:open="addQuickDiscountDialog" title="新增快速折扣">
      <Form
        v-slot="{ isSubmitting, values, setFieldValue }"
        :validation-schema="toTypedSchema(quickDiscountSchema())"
        :initial-values="{ name: '', kind: 'amount', value: 0 }"
        @submit="onSubmitAddQuickDiscount"
      >
        <div class="space-y-4 py-2">
          <FormField
            name="name"
            label="優惠名稱"
            :disabled="isSubmitting"
            placeholder="例如: 常客優惠、員工優惠..."
          />
          <label class="mb-4 block text-sm font-bold text-surface-700 dark:text-surface-300">
            類型
            <select
              :value="values.kind"
              class="mt-1 w-full rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-sm font-normal text-surface-900 dark:text-surface-100 outline-none"
              @change="setFieldValue('kind', ($event.target as HTMLSelectElement).value)"
            >
              <option value="amount">定額折抵</option>
              <option value="percent">折數折抵</option>
            </select>
          </label>
          <FormField
            name="value"
            :label="values.kind === 'amount' ? '折抵金額' : '折抵折數'"
            type="text"
            :inputmode="values.kind === 'amount' ? 'numeric' : 'decimal'"
            :step="values.kind === 'amount' ? '1' : '0.01'"
            :disabled="isSubmitting"
            :placeholder="
              values.kind === 'amount' ? '純數字,例如:5,10...' : '純數字,例如:0.9,0.85...'
            "
          />
        </div>
        <div class="mt-6 flex justify-end gap-2.5">
          <button
            type="button"
            class="pos-btn pos-btn-secondary px-4 py-2 text-xs font-bold"
            @click="addQuickDiscountDialog = false"
          >
            取消
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="pos-btn pos-btn-primary px-5 py-2 text-xs font-bold"
          >
            新增
          </button>
        </div>
      </Form>
    </ModalDialog>

    <!-- 編輯快速折扣 -->
    <ModalDialog v-model:open="editQuickDiscountDialog" title="編輯快速折扣">
      <Form
        v-slot="{ isSubmitting, values, setFieldValue }"
        :validation-schema="toTypedSchema(quickDiscountSchema(editingQuickDiscount.id))"
        :initial-values="{
          name: editingQuickDiscount.name,
          kind: editingQuickDiscount.kind,
          value: Number(editingQuickDiscount.value)
        }"
        @submit="onSubmitEditQuickDiscount"
      >
        <div class="space-y-4 py-2">
          <FormField
            name="name"
            label="優惠名稱"
            :disabled="isSubmitting"
            placeholder="例如: 常客優惠、員工優惠..."
          />
          <label class="mb-4 block text-sm font-bold text-surface-700 dark:text-surface-300">
            類型
            <select
              :value="values.kind"
              class="mt-1 w-full rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-sm font-normal text-surface-900 dark:text-surface-100 outline-none"
              @change="setFieldValue('kind', ($event.target as HTMLSelectElement).value)"
            >
              <option value="amount">定額折抵</option>
              <option value="percent">折數折抵</option>
            </select>
          </label>
          <FormField
            name="value"
            :label="values.kind === 'amount' ? '折抵金額' : '折抵折數'"
            type="text"
            :inputmode="values.kind === 'amount' ? 'numeric' : 'decimal'"
            :step="values.kind === 'amount' ? '1' : '0.01'"
            :disabled="isSubmitting"
            :placeholder="
              values.kind === 'amount' ? '純數字,例如:5,10...' : '純數字,例如:0.9,0.85...'
            "
          />
        </div>
        <div class="mt-6 flex justify-end gap-2.5">
          <button
            type="button"
            class="pos-btn pos-btn-secondary px-4 py-2 text-xs font-bold"
            @click="editQuickDiscountDialog = false"
          >
            取消
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="pos-btn pos-btn-primary px-5 py-2 text-xs font-bold"
          >
            保存
          </button>
        </div>
      </Form>
    </ModalDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Percent, Ticket } from 'lucide-vue-next'
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { Form } from 'vee-validate'
import ModalDialog from '@/components/ui/ModalDialog.vue'
import FormField from '@/components/ui/FormField.vue'
import TablePagination from '@/components/ui/TablePagination.vue'
import { useDiscountStore } from '@/stores/discount'
const discountStore = useDiscountStore()
import { useLoginStore } from '@/stores/login'
const loginStore = useLoginStore()
import type { OrderCoupon, QuickDiscount } from '@/types'
import { hasCapability } from '@/utils/selection'
import { apiErrorMessage } from '@/api/http'
import { confirm } from '@/composables/useConfirm'
import { showToast } from '@/composables/useToast'
import {
  createOrderCoupon,
  createQuickDiscount,
  deleteOrderCoupon,
  deleteQuickDiscount,
  updateOrderCoupon,
  updateQuickDiscount
} from '@/api/promotions'

// 單頁多表單需使用 <Form> 元件避免 useForm() provide context 相互覆蓋；
// 欄位綁定 isSubmitting 避免非同步驗證完成前輸入造成中繼狀態提交
const canSetOrderCoupon = computed(() => hasCapability(loginStore.userInfo, 'canSetOrderCoupon'))
const canSetQuickDiscount = computed(() =>
  hasCapability(loginStore.userInfo, 'canSetQuickDiscount')
)

const tabs = [
  { key: 'orderCoupons' as const, label: '訂單折價券' },
  { key: 'quickDiscounts' as const, label: '快速折扣' }
]
const activeTab = ref<(typeof tabs)[number]['key']>('orderCoupons')

// ---------- 訂單折價券 ----------
const orderCouponPage = ref(1)
const orderCouponPageCount = computed(() =>
  Math.max(Math.ceil(discountStore.orderCoupons.length / 10), 1)
)
const sliceOrderCoupons = computed(() =>
  discountStore.orderCoupons.slice((orderCouponPage.value - 1) * 10, orderCouponPage.value * 10)
)

function orderCouponSchema(excludeId?: OrderCoupon['id']) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, '請輸入折價券名稱')
      .refine(
        (name) =>
          !discountStore.orderCoupons.some((item) => item.name === name && item.id !== excludeId),
        '此折價券名稱已存在,請重新輸入'
      ),
    kind: z.enum(['amount', 'percent']),
    value: z.coerce.number({ invalid_type_error: '請輸入數字' }).min(0, '折抵值不可為負數,請重新輸入')
  })
}

const addOrderCouponDialog = ref(false)
function openAddOrderCouponDialog() {
  addOrderCouponDialog.value = true
}
async function onSubmitAddOrderCoupon(values: Record<string, unknown>) {
  const input = values as { name: string; kind: 'amount' | 'percent'; value: number }
  try {
    const created = await createOrderCoupon(input)
    discountStore.orderCoupons.push(created)
    addOrderCouponDialog.value = false
    showToast('新增成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}

const editOrderCouponDialog = ref(false)
const editingOrderCoupon = ref<OrderCoupon>({ id: '', name: '', kind: 'amount', value: 0 })
function openEditOrderCouponDialog(row: OrderCoupon) {
  editingOrderCoupon.value = row
  editOrderCouponDialog.value = true
}
async function onSubmitEditOrderCoupon(values: Record<string, unknown>) {
  const input = values as { name: string; kind: 'amount' | 'percent'; value: number }
  try {
    const updated = await updateOrderCoupon(String(editingOrderCoupon.value.id), input)
    editingOrderCoupon.value.name = updated.name
    editingOrderCoupon.value.kind = updated.kind
    editingOrderCoupon.value.value = updated.value
    editOrderCouponDialog.value = false
    showToast('保存成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}

async function removeOrderCoupon(row: OrderCoupon) {
  const result = await confirm({
    title: '警告',
    description: `是否刪除折價券 ${row.name}？`,
    variant: 'danger'
  })
  if (result !== 'confirm') return
  try {
    await deleteOrderCoupon(String(row.id))
    discountStore.orderCoupons = discountStore.orderCoupons.filter((item) => item.id !== row.id)
    showToast('刪除成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}

// ---------- 快速折扣 ----------
const quickDiscountPage = ref(1)
const quickDiscountPageCount = computed(() =>
  Math.max(Math.ceil(discountStore.quickDiscounts.length / 10), 1)
)
const sliceQuickDiscount = computed(() =>
  discountStore.quickDiscounts.slice(
    (quickDiscountPage.value - 1) * 10,
    quickDiscountPage.value * 10
  )
)

function quickDiscountSchema(excludeId?: QuickDiscount['id']) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, '請輸入優惠名稱')
      .refine(
        (name) =>
          !discountStore.quickDiscounts.some((item) => item.name === name && item.id !== excludeId),
        '此優惠名稱已存在,請重新輸入'
      ),
    kind: z.enum(['amount', 'percent']),
    value: z.coerce.number({ invalid_type_error: '請輸入數字' }).min(0, '折抵值不可為負數,請重新輸入')
  })
}

const addQuickDiscountDialog = ref(false)
function openAddQuickDiscountDialog() {
  addQuickDiscountDialog.value = true
}
async function onSubmitAddQuickDiscount(values: Record<string, unknown>) {
  const input = values as { name: string; kind: 'amount' | 'percent'; value: number }
  try {
    const created = await createQuickDiscount(input)
    discountStore.quickDiscounts.push(created)
    addQuickDiscountDialog.value = false
    showToast('新增成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}

const editQuickDiscountDialog = ref(false)
const editingQuickDiscount = ref<QuickDiscount>({ id: '', name: '', kind: 'amount', value: 0 })
function openEditQuickDiscountDialog(row: QuickDiscount) {
  editingQuickDiscount.value = row
  editQuickDiscountDialog.value = true
}
async function onSubmitEditQuickDiscount(values: Record<string, unknown>) {
  const input = values as { name: string; kind: 'amount' | 'percent'; value: number }
  try {
    const updated = await updateQuickDiscount(String(editingQuickDiscount.value.id), input)
    editingQuickDiscount.value.name = updated.name
    editingQuickDiscount.value.kind = updated.kind
    editingQuickDiscount.value.value = updated.value
    editQuickDiscountDialog.value = false
    showToast('保存成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}

async function removeQuickDiscount(row: QuickDiscount) {
  const result = await confirm({
    title: '警告',
    description: `是否刪除快速折扣 ${row.name}？`,
    variant: 'danger'
  })
  if (result !== 'confirm') return
  try {
    await deleteQuickDiscount(String(row.id))
    discountStore.quickDiscounts = discountStore.quickDiscounts.filter((item) => item.id !== row.id)
    showToast('刪除成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
</script>

<style lang="scss" scoped></style>
