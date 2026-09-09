<template>
  <div class="flex flex-col xl:flex-row gap-5 items-stretch min-h-[600px] w-full">
    <!-- 現金折扣券 -->
    <div class="card-panel p-5 flex flex-col justify-between flex-1">
      <div>
        <div class="flex items-center justify-between pb-3.5 border-b border-surface-200 dark:border-surface-800">
          <div class="flex items-center gap-2.5">
            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-success-50 text-success-600 dark:bg-success-950/50 dark:text-success-400 border border-success-200/50 dark:border-success-800/40">
              <Ticket class="h-4 w-4" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-surface-900 dark:text-surface-100 tracking-tight">現金折扣券</h3>
              <p class="text-[11px] text-surface-400">固定金額折抵券設定</p>
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              class="pos-btn pos-btn-secondary px-2.5 py-1.5 text-xs font-bold"
              :class="{ 'pointer-events-none opacity-40': !canSetMoneyDiscount }"
              @click="openAddMoneyDiscountDialog">新增</button>
            <button
              type="button"
              class="pos-btn pos-btn-danger px-2.5 py-1.5 text-xs font-bold"
              :class="{ 'pointer-events-none opacity-40': !canSetMoneyDiscount }"
              @click="deleteCurrentMoneyDiscount">刪除</button>
            <button
              type="button"
              class="pos-btn pos-btn-primary px-2.5 py-1.5 text-xs font-bold"
              :class="{ 'pointer-events-none opacity-40': !canSetMoneyDiscount }"
              @click="openEditMoneyDiscountDialog">編輯</button>
          </div>
        </div>

        <div class="mt-3.5 overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-800">
          <table class="w-full text-center text-xs">
            <thead class="bg-surface-50 dark:bg-surface-800/80 font-bold text-surface-500 dark:text-surface-400 border-b border-surface-200 dark:border-surface-800">
              <tr>
                <th class="px-3 py-2.5">序號</th>
                <th class="px-3 py-2.5">Id</th>
                <th class="px-3 py-2.5 text-left">折價券名稱</th>
                <th class="px-3 py-2.5 text-right">折價金額</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
              <tr v-if="sliceMoneyDiscount.length === 0">
                <td colspan="4" class="px-3 py-8 text-surface-400 dark:text-surface-500">無現金折價券</td>
              </tr>
              <tr
                v-for="(row, index) in sliceMoneyDiscount" :key="row.id"
                class="cursor-pointer transition-colors hover:bg-surface-50 dark:hover:bg-surface-950"
                :class="{ 'bg-primary-50/90 dark:bg-primary-950/40 text-primary-900 dark:text-primary-100 font-bold': currentMoneyDiscount.id === row.id }"
                @click="currentMoneyDiscount = row">
                <td class="px-3 py-2.5 font-mono text-surface-400">{{ index + 1 }}</td>
                <td class="px-3 py-2.5 font-mono text-xs text-surface-400 truncate max-w-[80px]" :title="String(row.id)">{{ row.id }}</td>
                <td class="px-3 py-2.5 text-left font-bold text-surface-900 dark:text-surface-100">{{ row.name }}</td>
                <td class="px-3 py-2.5 text-right font-mono font-bold text-success-600 dark:text-success-400">-${{ row.discountMoney }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="mt-4 flex items-center justify-between rounded-xl bg-surface-50 dark:bg-surface-800/60 px-3 py-2 text-xs font-bold text-surface-600 dark:text-surface-300">
        <p>{{ `共 ${discountStore.moneyDiscount.length} 樣` }}</p>
        <AppPagination :page="moneyDiscountCurrentPage" :page-count="moneyDiscountPageCount" :total="discountStore.moneyDiscount.length" @update:page="(value) => moneyDiscountCurrentPage = value" />
      </div>
    </div>

    <!-- 折數折扣券 -->
    <div class="card-panel p-5 flex flex-col justify-between flex-1">
      <div>
        <div class="flex items-center justify-between pb-3.5 border-b border-surface-200 dark:border-surface-800">
          <div class="flex items-center gap-2.5">
            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-info-50 text-info-600 dark:bg-info-950/50 dark:text-info-400 border border-info-200/50 dark:border-info-800/40">
              <Percent class="h-4 w-4" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-surface-900 dark:text-surface-100 tracking-tight">折數折扣券</h3>
              <p class="text-[11px] text-surface-400">百分比/折扣折數設定</p>
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              class="pos-btn pos-btn-secondary px-2.5 py-1.5 text-xs font-bold"
              :class="{ 'pointer-events-none opacity-40': !canSetPercentDiscount }"
              @click="openAddPercentDiscountDialog">新增</button>
            <button
              type="button"
              class="pos-btn pos-btn-danger px-2.5 py-1.5 text-xs font-bold"
              :class="{ 'pointer-events-none opacity-40': !canSetPercentDiscount }"
              @click="deleteCurrentPercentDiscount">刪除</button>
            <button
              type="button"
              class="pos-btn pos-btn-primary px-2.5 py-1.5 text-xs font-bold"
              :class="{ 'pointer-events-none opacity-40': !canSetPercentDiscount }"
              @click="openEditPercentDiscountDialog">編輯</button>
          </div>
        </div>

        <div class="mt-3.5 overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-800">
          <table class="w-full text-center text-xs">
            <thead class="bg-surface-50 dark:bg-surface-800/80 font-bold text-surface-500 dark:text-surface-400 border-b border-surface-200 dark:border-surface-800">
              <tr>
                <th class="px-3 py-2.5">序號</th>
                <th class="px-3 py-2.5">Id</th>
                <th class="px-3 py-2.5 text-left">折價券名稱</th>
                <th class="px-3 py-2.5 text-right">折價折數</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
              <tr v-if="slicePercentDiscount.length === 0">
                <td colspan="4" class="px-3 py-8 text-surface-400 dark:text-surface-500">無折數折價券</td>
              </tr>
              <tr
                v-for="(row, index) in slicePercentDiscount" :key="row.id"
                class="cursor-pointer transition-colors hover:bg-surface-50 dark:hover:bg-surface-950"
                :class="{ 'bg-primary-50/90 dark:bg-primary-950/40 text-primary-900 dark:text-primary-100 font-bold': currentPercentDiscount.id === row.id }"
                @click="currentPercentDiscount = row">
                <td class="px-3 py-2.5 font-mono text-surface-400">{{ index + 1 }}</td>
                <td class="px-3 py-2.5 font-mono text-xs text-surface-400 truncate max-w-[80px]" :title="String(row.id)">{{ row.id }}</td>
                <td class="px-3 py-2.5 text-left font-bold text-surface-900 dark:text-surface-100">{{ row.name }}</td>
                <td class="px-3 py-2.5 text-right font-mono font-bold text-info-600 dark:text-info-400">{{ row.discountMoney }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="mt-4 flex items-center justify-between rounded-xl bg-surface-50 dark:bg-surface-800/60 px-3 py-2 text-xs font-bold text-surface-600 dark:text-surface-300">
        <p>{{ `共 ${discountStore.percentDiscount.length} 樣` }}</p>
        <AppPagination :page="percentDiscountCurrentPage" :page-count="percentDiscountPageCount" :total="discountStore.percentDiscount.length" @update:page="(value) => percentDiscountCurrentPage = value" />
      </div>
    </div>

    <!-- 快速折扣 -->
    <div class="card-panel p-5 flex flex-col justify-between flex-1">
      <div>
        <div class="flex items-center justify-between pb-3.5 border-b border-surface-200 dark:border-surface-800">
          <div class="flex items-center gap-2.5">
            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-50 text-accent-600 dark:bg-accent-950/50 dark:text-accent-400 border border-accent-200/50 dark:border-accent-800/40">
              <Sparkles class="h-4 w-4" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-surface-900 dark:text-surface-100 tracking-tight">快速折扣</h3>
              <p class="text-[11px] text-surface-400">點餐頁購物車的快捷折扣按鈕，可自由新增/刪除</p>
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              class="pos-btn pos-btn-secondary px-2.5 py-1.5 text-xs font-bold"
              :class="{ 'pointer-events-none opacity-40': !canSetQuickDiscount }"
              @click="openAddQuickDiscountDialog">新增</button>
            <button
              type="button"
              class="pos-btn pos-btn-danger px-2.5 py-1.5 text-xs font-bold"
              :class="{ 'pointer-events-none opacity-40': !canSetQuickDiscount }"
              @click="deleteCurrentQuickDiscount">刪除</button>
            <button
              type="button"
              class="pos-btn pos-btn-primary px-2.5 py-1.5 text-xs font-bold"
              :class="{ 'pointer-events-none opacity-40': !canSetQuickDiscount }"
              @click="openEditQuickDiscountDialog">編輯</button>
          </div>
        </div>

        <div class="mt-3.5 overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-800">
          <table class="w-full text-center text-xs">
            <thead class="bg-surface-50 dark:bg-surface-800/80 font-bold text-surface-500 dark:text-surface-400 border-b border-surface-200 dark:border-surface-800">
              <tr>
                <th class="px-3 py-2.5">序號</th>
                <th class="px-3 py-2.5 text-left">優惠名稱</th>
                <th class="px-3 py-2.5">類型</th>
                <th class="px-3 py-2.5 text-right">折抵值</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
              <tr v-if="sliceQuickDiscount.length === 0">
                <td colspan="4" class="px-3 py-8 text-surface-400 dark:text-surface-500">無快速折扣</td>
              </tr>
              <tr
                v-for="(row, index) in sliceQuickDiscount" :key="row.id"
                class="cursor-pointer transition-colors hover:bg-surface-50 dark:hover:bg-surface-950"
                :class="{ 'bg-primary-50/90 dark:bg-primary-950/40 text-primary-900 dark:text-primary-100 font-bold': currentQuickDiscount.id === row.id }"
                @click="currentQuickDiscount = row">
                <td class="px-3 py-2.5 font-mono text-surface-400">{{ index + 1 }}</td>
                <td class="px-3 py-2.5 text-left font-bold text-surface-900 dark:text-surface-100">{{ row.name }}</td>
                <td class="px-3 py-2.5">
                  <span class="rounded-md px-1.5 py-0.5 text-[10px] font-bold" :class="row.kind === 'amount' ? 'bg-success-50 text-success-600 dark:bg-success-950/40 dark:text-success-400' : 'bg-info-50 text-info-600 dark:bg-info-950/40 dark:text-info-400'">
                    {{ row.kind === 'amount' ? '定額' : '折數' }}
                  </span>
                </td>
                <td class="px-3 py-2.5 text-right font-mono font-bold text-primary-600 dark:text-primary-400">
                  {{ row.kind === 'amount' ? `-$${row.value}` : row.value }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="mt-4 flex items-center justify-between rounded-xl bg-surface-50 dark:bg-surface-800/60 px-3 py-2 text-xs font-bold text-surface-600 dark:text-surface-300">
        <p>{{ `共 ${discountStore.quickDiscounts.length} 樣` }}</p>
        <AppPagination :page="quickDiscountCurrentPage" :page-count="quickDiscountPageCount" :total="discountStore.quickDiscounts.length" @update:page="(value) => quickDiscountCurrentPage = value" />
      </div>
    </div>
  </div>

  <!-- 新增現金折扣券 -->
  <ModalDialog v-model:open="addMoneyDiscountDialog" title="新增現金折扣券">
    <Form v-slot="{ isSubmitting }" :validation-schema="toTypedSchema(moneyCouponSchema())" :initial-values="{ name: '' }" @submit="onSubmitAddMoneyDiscount">
      <div class="space-y-4 py-2">
        <FormField name="name" label="折扣券名稱" :disabled="isSubmitting" placeholder="例如: $50折價券..." />
        <FormField name="discountMoney" label="折扣的金額" type="number" step="1" :disabled="isSubmitting" placeholder="純數字,例如:1,2,3..." />
      </div>
      <div class="mt-6 flex justify-end gap-2.5">
        <button type="button" class="pos-btn pos-btn-secondary px-4 py-2 text-xs font-bold" @click="addMoneyDiscountDialog = false">取消</button>
        <button type="submit" :disabled="isSubmitting" class="pos-btn pos-btn-primary px-5 py-2 text-xs font-bold">新增</button>
      </div>
    </Form>
  </ModalDialog>

  <!-- 編輯現金折扣券 -->
  <ModalDialog v-model:open="editMoneyDiscountDialog" title="編輯現金折扣券">
    <Form
      v-slot="{ isSubmitting }"
      :validation-schema="toTypedSchema(moneyCouponSchema(currentMoneyDiscount.id))"
      :initial-values="{ name: currentMoneyDiscount.name, discountMoney: Number(currentMoneyDiscount.discountMoney) }"
      @submit="onSubmitEditMoneyDiscount">
      <div class="space-y-4 py-2">
        <FormField name="name" label="折扣券名稱" :disabled="isSubmitting" placeholder="例如: $50折價券..." />
        <FormField name="discountMoney" label="折扣的金額" type="number" step="1" :disabled="isSubmitting" placeholder="純數字,例如:1,2,3..." />
      </div>
      <div class="mt-6 flex justify-end gap-2.5">
        <button type="button" class="pos-btn pos-btn-secondary px-4 py-2 text-xs font-bold" @click="editMoneyDiscountDialog = false">取消</button>
        <button type="submit" :disabled="isSubmitting" class="pos-btn pos-btn-primary px-5 py-2 text-xs font-bold">保存</button>
      </div>
    </Form>
  </ModalDialog>

  <ModalDialog v-model:open="addPercentDiscountDialog" title="新增折數折扣券">
    <Form v-slot="{ isSubmitting }" :validation-schema="toTypedSchema(percentCouponSchema())" :initial-values="{ name: '' }" @submit="onSubmitAddPercentDiscount">
      <div class="space-y-4 py-2">
        <FormField name="name" label="折扣券名稱" :disabled="isSubmitting" placeholder="例如: 九折折價券..." />
        <FormField name="discountPercent" label="折扣的折數" type="number" step="0.01" :disabled="isSubmitting" placeholder="純數字,例如:0.9,0.75..." />
      </div>
      <div class="mt-6 flex justify-end gap-2.5">
        <button type="button" class="pos-btn pos-btn-secondary px-4 py-2 text-xs font-bold" @click="addPercentDiscountDialog = false">取消</button>
        <button type="submit" :disabled="isSubmitting" class="pos-btn pos-btn-primary px-5 py-2 text-xs font-bold">新增</button>
      </div>
    </Form>
  </ModalDialog>

  <ModalDialog v-model:open="editPercentDiscountDialog" title="編輯折數折扣券">
    <Form
      v-slot="{ isSubmitting }"
      :validation-schema="toTypedSchema(percentCouponSchema(currentPercentDiscount.id))"
      :initial-values="{ name: currentPercentDiscount.name, discountPercent: Number(currentPercentDiscount.discountMoney) }"
      @submit="onSubmitEditPercentDiscount">
      <div class="space-y-4 py-2">
        <FormField name="name" label="折扣券名稱" :disabled="isSubmitting" placeholder="例如: 九折折價券..." />
        <FormField name="discountPercent" label="折扣的折數" type="number" step="0.01" :disabled="isSubmitting" placeholder="純數字,例如:0.9,0.75..." />
      </div>
      <div class="mt-6 flex justify-end gap-2.5">
        <button type="button" class="pos-btn pos-btn-secondary px-4 py-2 text-xs font-bold" @click="editPercentDiscountDialog = false">取消</button>
        <button type="submit" :disabled="isSubmitting" class="pos-btn pos-btn-primary px-5 py-2 text-xs font-bold">保存</button>
      </div>
    </Form>
  </ModalDialog>

  <!-- 新增快速折扣 -->
  <ModalDialog v-model:open="addQuickDiscountDialog" title="新增快速折扣">
    <Form v-slot="{ isSubmitting }" :validation-schema="toTypedSchema(quickDiscountSchema())" :initial-values="{ name: '', kind: addQuickDiscountKind, value: 0 }" @submit="onSubmitAddQuickDiscount">
      <div class="space-y-4 py-2">
        <FormField name="name" label="優惠名稱" :disabled="isSubmitting" placeholder="例如: 常客優惠、員工優惠..." />
        <label class="mb-4 block text-sm font-bold text-surface-700 dark:text-surface-300">
          類型
          <select v-model="addQuickDiscountKind" class="mt-1 w-full rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-sm font-normal text-surface-900 dark:text-surface-100 outline-none">
            <option value="amount">定額折抵</option>
            <option value="percent">折數折抵</option>
          </select>
        </label>
        <FormField
          name="value" :label="addQuickDiscountKind === 'amount' ? '折抵金額' : '折抵折數'"
          type="number" :step="addQuickDiscountKind === 'amount' ? '1' : '0.01'" :disabled="isSubmitting"
          :placeholder="addQuickDiscountKind === 'amount' ? '純數字,例如:5,10...' : '純數字,例如:0.9,0.85...'" />
      </div>
      <div class="mt-6 flex justify-end gap-2.5">
        <button type="button" class="pos-btn pos-btn-secondary px-4 py-2 text-xs font-bold" @click="addQuickDiscountDialog = false">取消</button>
        <button type="submit" :disabled="isSubmitting" class="pos-btn pos-btn-primary px-5 py-2 text-xs font-bold">新增</button>
      </div>
    </Form>
  </ModalDialog>

  <!-- 編輯快速折扣 -->
  <ModalDialog v-model:open="editQuickDiscountDialog" title="編輯快速折扣">
    <Form
      v-slot="{ isSubmitting }"
      :validation-schema="toTypedSchema(quickDiscountSchema(currentQuickDiscount.id))"
      :initial-values="{ name: currentQuickDiscount.name, kind: editQuickDiscountKind, value: Number(currentQuickDiscount.value) }"
      @submit="onSubmitEditQuickDiscount">
      <div class="space-y-4 py-2">
        <FormField name="name" label="優惠名稱" :disabled="isSubmitting" placeholder="例如: 常客優惠、員工優惠..." />
        <label class="mb-4 block text-sm font-bold text-surface-700 dark:text-surface-300">
          類型
          <select v-model="editQuickDiscountKind" class="mt-1 w-full rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-sm font-normal text-surface-900 dark:text-surface-100 outline-none">
            <option value="amount">定額折抵</option>
            <option value="percent">折數折抵</option>
          </select>
        </label>
        <FormField
          name="value" :label="editQuickDiscountKind === 'amount' ? '折抵金額' : '折抵折數'"
          type="number" :step="editQuickDiscountKind === 'amount' ? '1' : '0.01'" :disabled="isSubmitting"
          :placeholder="editQuickDiscountKind === 'amount' ? '純數字,例如:5,10...' : '純數字,例如:0.9,0.85...'" />
      </div>
      <div class="mt-6 flex justify-end gap-2.5">
        <button type="button" class="pos-btn pos-btn-secondary px-4 py-2 text-xs font-bold" @click="editQuickDiscountDialog = false">取消</button>
        <button type="submit" :disabled="isSubmitting" class="pos-btn pos-btn-primary px-5 py-2 text-xs font-bold">保存</button>
      </div>
    </Form>
  </ModalDialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Ticket, Percent, Sparkles } from 'lucide-vue-next'
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { Form } from 'vee-validate'
import ModalDialog from '@/components/ui/ModalDialog.vue'
import FormField from '@/components/ui/FormField.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import { useDiscountStore } from '@/stores/discount'
const discountStore = useDiscountStore()
import { useLoginStore } from "@/stores/login"
const loginStore = useLoginStore()
import type { MaybeSelected, MoneyDiscount, PercentDiscount, QuickDiscount } from '@/types'
import { hasCapability } from '@/utils/selection'
import { ApiError } from '@/api/http'
import { confirm } from '@/composables/useConfirm'
import { showToast } from '@/composables/useToast'
import {
  createMoneyCoupon,
  createPercentCoupon,
  createQuickDiscount,
  deleteMoneyCoupon,
  deletePercentCoupon,
  deleteQuickDiscount,
  updateMoneyCoupon,
  updatePercentCoupon,
  updateQuickDiscount,
} from '@/api/promotions'

// 單頁多表單需使用 <Form> 元件避免 useForm() provide context 相互覆蓋；
// 欄位綁定 isSubmitting 避免非同步驗證完成前輸入造成中繼狀態提交
function apiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return `操作失敗：${err.message}`
  return '連不上伺服端，請確認網路連線'
}

const canSetMoneyDiscount = computed(() => hasCapability(loginStore.userInfo, 'canSetMoneyDiscount'))
const canSetPercentDiscount = computed(() => hasCapability(loginStore.userInfo, 'canSetPercentDiscount'))
const canSetQuickDiscount = computed(() => hasCapability(loginStore.userInfo, 'canSetQuickDiscount'))

// ---------- 現金折扣券 ----------
const currentMoneyDiscount = ref<MaybeSelected<MoneyDiscount>>({})
const moneyDiscountCurrentPage = ref(1)
const moneyDiscountPageCount = computed(() => Math.max(Math.ceil(discountStore.moneyDiscount.length / 10), 1))
const sliceMoneyDiscount = computed(() =>
  discountStore.moneyDiscount.slice((moneyDiscountCurrentPage.value - 1) * 10, moneyDiscountCurrentPage.value * 10))

function moneyCouponSchema(excludeId?: MoneyDiscount['id']) {
  return z.object({
    name: z.string().trim().min(1, '請輸入折扣券名稱').refine(
      (name) => !discountStore.moneyDiscount.some((item) => item.name === name && item.id !== excludeId),
      '此折扣券名稱已存在,請重新輸入',
    ),
    discountMoney: z.coerce.number().positive('折抵金額不可為負數且需大於0,請重新輸入'),
  })
}

const addMoneyDiscountDialog = ref(false)
function openAddMoneyDiscountDialog() {
  addMoneyDiscountDialog.value = true
}
async function onSubmitAddMoneyDiscount(values: Record<string, unknown>) {
  const input = values as { name: string; discountMoney: number }
  try {
    const created = await createMoneyCoupon(input)
    discountStore.moneyDiscount.push(created)
    addMoneyDiscountDialog.value = false
    showToast('新增成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}

const editMoneyDiscountDialog = ref(false)
function openEditMoneyDiscountDialog() {
  if (!currentMoneyDiscount.value.name) {
    showToast('請先選擇要編輯的折扣券', 'error')
    return
  }
  editMoneyDiscountDialog.value = true
}
async function onSubmitEditMoneyDiscount(values: Record<string, unknown>) {
  const input = values as { name: string; discountMoney: number }
  try {
    const updated = await updateMoneyCoupon(String(currentMoneyDiscount.value.id), input)
    currentMoneyDiscount.value.name = updated.name
    currentMoneyDiscount.value.discountMoney = updated.discountMoney
    editMoneyDiscountDialog.value = false
    showToast('保存成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}

async function deleteCurrentMoneyDiscount() {
  if (!currentMoneyDiscount.value.name) {
    showToast('請先選擇要刪除的折扣券', 'error')
    return
  }
  const result = await confirm({
    title: '警告',
    description: `是否刪除折扣券 ${currentMoneyDiscount.value.name}？`,
    variant: 'danger',
  })
  if (result !== 'confirm') return
  try {
    await deleteMoneyCoupon(String(currentMoneyDiscount.value.id))
    discountStore.moneyDiscount = discountStore.moneyDiscount.filter((item) => item.id !== currentMoneyDiscount.value.id)
    currentMoneyDiscount.value = {}
    showToast('刪除成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}

// ---------- 折數折扣券 ----------
const currentPercentDiscount = ref<MaybeSelected<PercentDiscount>>({})
const percentDiscountCurrentPage = ref(1)
const percentDiscountPageCount = computed(() => Math.max(Math.ceil(discountStore.percentDiscount.length / 10), 1))
const slicePercentDiscount = computed(() =>
  discountStore.percentDiscount.slice((percentDiscountCurrentPage.value - 1) * 10, percentDiscountCurrentPage.value * 10))

// 表單以 discountPercent 命名，送出時轉回既有 discountMoney 欄位
function percentCouponSchema(excludeId?: PercentDiscount['id']) {
  return z.object({
    name: z.string().trim().min(1, '請輸入折扣券名稱').refine(
      (name) => !discountStore.percentDiscount.some((item) => item.name === name && item.id !== excludeId),
      '此折扣券名稱已存在,請重新輸入',
    ),
    discountPercent: z.coerce.number()
      .min(0, '折抵折數不可為負數,請重新輸入')
      .lt(1, '折抵折數不可大於等於1,請重新輸入'),
  })
}

const addPercentDiscountDialog = ref(false)
function openAddPercentDiscountDialog() {
  addPercentDiscountDialog.value = true
}
async function onSubmitAddPercentDiscount(values: Record<string, unknown>) {
  const input = values as { name: string; discountPercent: number }
  try {
    const created = await createPercentCoupon(input)
    discountStore.percentDiscount.push({ id: created.id, name: created.name, discountMoney: created.discountPercent })
    addPercentDiscountDialog.value = false
    showToast('新增成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}

const editPercentDiscountDialog = ref(false)
function openEditPercentDiscountDialog() {
  if (!currentPercentDiscount.value.name) {
    showToast('請先選擇要編輯的折扣券', 'error')
    return
  }
  editPercentDiscountDialog.value = true
}
async function onSubmitEditPercentDiscount(values: Record<string, unknown>) {
  const input = values as { name: string; discountPercent: number }
  try {
    const updated = await updatePercentCoupon(String(currentPercentDiscount.value.id), input)
    currentPercentDiscount.value.name = updated.name
    currentPercentDiscount.value.discountMoney = updated.discountPercent
    editPercentDiscountDialog.value = false
    showToast('保存成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}

async function deleteCurrentPercentDiscount() {
  if (!currentPercentDiscount.value.name) {
    showToast('請先選擇要刪除的折扣券', 'error')
    return
  }
  const result = await confirm({
    title: '警告',
    description: `是否刪除折扣券 ${currentPercentDiscount.value.name}？`,
    variant: 'danger',
  })
  if (result !== 'confirm') return
  try {
    await deletePercentCoupon(String(currentPercentDiscount.value.id))
    discountStore.percentDiscount = discountStore.percentDiscount.filter((item) => item.id !== currentPercentDiscount.value.id)
    currentPercentDiscount.value = {}
    showToast('刪除成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}

// ---------- 快速折扣 ----------
const currentQuickDiscount = ref<MaybeSelected<QuickDiscount>>({})
const quickDiscountCurrentPage = ref(1)
const quickDiscountPageCount = computed(() => Math.max(Math.ceil(discountStore.quickDiscounts.length / 10), 1))
const sliceQuickDiscount = computed(() =>
  discountStore.quickDiscounts.slice((quickDiscountCurrentPage.value - 1) * 10, quickDiscountCurrentPage.value * 10))

function quickDiscountSchema(excludeId?: QuickDiscount['id']) {
  return z.object({
    name: z.string().trim().min(1, '請輸入優惠名稱').refine(
      (name) => !discountStore.quickDiscounts.some((item) => item.name === name && item.id !== excludeId),
      '此優惠名稱已存在,請重新輸入',
    ),
    kind: z.enum(['amount', 'percent']),
    value: z.coerce.number().min(0, '折抵值不可為負數,請重新輸入'),
  })
}

const addQuickDiscountDialog = ref(false)
const addQuickDiscountKind = ref<'amount' | 'percent'>('amount')
function openAddQuickDiscountDialog() {
  addQuickDiscountKind.value = 'amount'
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
const editQuickDiscountKind = ref<'amount' | 'percent'>('amount')
function openEditQuickDiscountDialog() {
  if (!currentQuickDiscount.value.name) {
    showToast('請先選擇要編輯的優惠', 'error')
    return
  }
  editQuickDiscountKind.value = currentQuickDiscount.value.kind ?? 'amount'
  editQuickDiscountDialog.value = true
}
async function onSubmitEditQuickDiscount(values: Record<string, unknown>) {
  const input = values as { name: string; kind: 'amount' | 'percent'; value: number }
  try {
    const updated = await updateQuickDiscount(String(currentQuickDiscount.value.id), input)
    currentQuickDiscount.value.name = updated.name
    currentQuickDiscount.value.kind = updated.kind
    currentQuickDiscount.value.value = updated.value
    editQuickDiscountDialog.value = false
    showToast('保存成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}

async function deleteCurrentQuickDiscount() {
  if (!currentQuickDiscount.value.name) {
    showToast('請先選擇要刪除的優惠', 'error')
    return
  }
  const result = await confirm({
    title: '警告',
    description: `是否刪除快速折扣 ${currentQuickDiscount.value.name}？`,
    variant: 'danger',
  })
  if (result !== 'confirm') return
  try {
    await deleteQuickDiscount(String(currentQuickDiscount.value.id))
    discountStore.quickDiscounts = discountStore.quickDiscounts.filter((item) => item.id !== currentQuickDiscount.value.id)
    currentQuickDiscount.value = {}
    showToast('刪除成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
</script>

<style lang="scss" scoped></style>
