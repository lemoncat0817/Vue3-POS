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
              @click="deleteDrinkMoneyDiscount">刪除</button>
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
              @click="deleteDrinkPercentDiscount">刪除</button>
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

    <!-- 常用優惠 -->
    <div class="card-panel p-5 flex flex-col justify-between flex-1">
      <div>
        <div class="flex items-center justify-between pb-3.5 border-b border-surface-200 dark:border-surface-800">
          <div class="flex items-center gap-2.5">
            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-50 text-accent-600 dark:bg-accent-950/50 dark:text-accent-400 border border-accent-200/50 dark:border-accent-800/40">
              <Sparkles class="h-4 w-4" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-surface-900 dark:text-surface-100 tracking-tight">常用優惠</h3>
              <p class="text-[11px] text-surface-400">收銀台快捷優惠按鈕對應</p>
            </div>
          </div>
          <button
            type="button"
            class="pos-btn pos-btn-primary px-3 py-1.5 text-xs font-bold"
            :class="{ 'pointer-events-none opacity-40': !canSetOftenUseDiscount }"
            @click="openEditOftenUseDiscountDialog">編輯</button>
        </div>

        <div class="mt-3.5 overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-800">
          <table class="w-full text-center text-xs">
            <thead class="bg-surface-50 dark:bg-surface-800/80 font-bold text-surface-500 dark:text-surface-400 border-b border-surface-200 dark:border-surface-800">
              <tr>
                <th class="px-3 py-2.5">序號</th>
                <th class="px-3 py-2.5 text-left">優惠名稱</th>
                <th class="px-3 py-2.5 text-right">折價金額</th>
                <th class="px-3 py-2.5 text-right">折價折數</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
              <tr
                v-for="(row, index) in discountStore.oftenUseDiscount" :key="row.id"
                class="cursor-pointer transition-colors hover:bg-surface-50 dark:hover:bg-surface-950"
                :class="{ 'bg-primary-50/90 dark:bg-primary-950/40 text-primary-900 dark:text-primary-100 font-bold': currentOftenUseDiscount.id === row.id }"
                @click="currentOftenUseDiscount = row">
                <td class="px-3 py-2.5 font-mono text-surface-400">{{ index + 1 }}</td>
                <td class="px-3 py-2.5 text-left font-bold text-surface-900 dark:text-surface-100">{{ row.name }}</td>
                <td class="px-3 py-2.5 text-right font-mono font-bold" :class="Number(row.discountMoney) > 0 ? 'text-success-600 dark:text-success-400' : 'text-surface-400'">
                  {{ Number(row.discountMoney) > 0 ? `-$${row.discountMoney}` : '-' }}
                </td>
                <td class="px-3 py-2.5 text-right font-mono font-bold" :class="Number(row.discountPercent) > 0 ? 'text-info-600 dark:text-info-400' : 'text-surface-400'">
                  {{ Number(row.discountPercent) > 0 ? `${row.discountPercent}` : '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="mt-4 flex items-center justify-between rounded-xl bg-surface-50 dark:bg-surface-800/60 px-3 py-2 text-xs font-bold text-surface-600 dark:text-surface-300">
        <p>共 {{ discountStore.oftenUseDiscount.length }} 樣</p>
        <span class="font-mono text-[11px]">1 / 1</span>
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

  <ModalDialog v-model:open="editOftenUseDiscountDialog" title="編輯常用優惠">
    <Form
      v-slot="{ isSubmitting }"
      :validation-schema="toTypedSchema(oftenUseRateSchema())"
      :initial-values="{
        name: currentOftenUseDiscount.name,
        discountMoney: Number(currentOftenUseDiscount.discountMoney),
        discountPercent: Number(currentOftenUseDiscount.discountPercent),
      }"
      @submit="onSubmitEditOftenUseDiscount">
      <div class="space-y-4 py-2">
        <FormField name="name" label="優惠名稱" :disabled="nameDisabled || isSubmitting" placeholder="例如: 九折,員工八折..." />
        <FormField name="discountMoney" label="折扣的金額" type="number" step="1" :disabled="moneyDisabled || isSubmitting" placeholder="純數字,例如:1,2,3..." />
        <FormField name="discountPercent" label="折扣的折數" type="number" step="0.01" :disabled="percentDisabled || isSubmitting" placeholder="純數字,例如:0.95,0.85..." />
      </div>
      <div class="mt-6 flex justify-end gap-2.5">
        <button type="button" class="pos-btn pos-btn-secondary px-4 py-2 text-xs font-bold" @click="editOftenUseDiscountDialog = false">取消</button>
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
import type { MaybeSelected, MoneyDiscount, OftenUseDiscount, PercentDiscount } from '@/types'
import { hasCapability } from '@/utils/selection'
import { ApiError } from '@/api/http'
import { confirm } from '@/composables/useConfirm'
import { showToast } from '@/composables/useToast'
import {
  createMoneyCoupon,
  createPercentCoupon,
  deleteMoneyCoupon,
  deletePercentCoupon,
  updateMoneyCoupon,
  updateOftenUseRate,
  updatePercentCoupon,
} from '@/api/promotions'

// 單頁多表單需使用 <Form> 元件避免 useForm() provide context 相互覆蓋；
// 欄位綁定 isSubmitting 避免非同步驗證完成前輸入造成中繼狀態提交
function apiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return `操作失敗：${err.message}`
  return '連不上伺服端，請確認網路連線'
}

const canSetMoneyDiscount = computed(() => hasCapability(loginStore.userInfo, 'canSetMoneyDiscount'))
const canSetPercentDiscount = computed(() => hasCapability(loginStore.userInfo, 'canSetPercentDiscount'))
const canSetOftenUseDiscount = computed(() => hasCapability(loginStore.userInfo, 'canSetOftenUseDiscount'))

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

async function deleteDrinkMoneyDiscount() {
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

async function deleteDrinkPercentDiscount() {
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

// ---------- 常用優惠 ----------
const currentOftenUseDiscount = ref<MaybeSelected<OftenUseDiscount>>({})
const editOftenUseDiscountDialog = ref(false)
// slot 0-1 僅可調整金額，slot 2-4 僅可調整名稱與折數
const nameDisabled = ref(false)
const moneyDisabled = ref(false)
const percentDisabled = ref(false)

function oftenUseRateSchema() {
  return z.object({
    name: nameDisabled.value
      ? z.union([z.string(), z.number()]).transform(String)
      : z.string().trim().min(1, '請輸入優惠名稱').refine(
        (name) => !discountStore.oftenUseDiscount.some((item) => item.name === name && item.id !== currentOftenUseDiscount.value.id),
        '此優惠名稱已存在,請重新輸入',
      ),
    discountMoney: moneyDisabled.value
      ? z.coerce.number()
      : z.coerce.number().positive('折抵金額不可為負數且需大於0,請重新輸入'),
    discountPercent: percentDisabled.value
      ? z.coerce.number()
      : z.coerce.number().min(0, '折抵折數不可為負數,請重新輸入').lt(1, '折抵折數不可大於等於1,請重新輸入'),
  })
}
function openEditOftenUseDiscountDialog() {
  if (!currentOftenUseDiscount.value.name) {
    showToast('請先選擇要編輯的優惠', 'error')
    return
  }
  const isContainerGroup = Number(currentOftenUseDiscount.value.id) <= 1
  nameDisabled.value = isContainerGroup
  percentDisabled.value = isContainerGroup
  moneyDisabled.value = !isContainerGroup
  editOftenUseDiscountDialog.value = true
}
async function onSubmitEditOftenUseDiscount(values: Record<string, unknown>) {
  const input = values as { name: string | number; discountMoney: number; discountPercent: number }
  try {
    const updated = await updateOftenUseRate(Number(currentOftenUseDiscount.value.id), {
      name: String(input.name),
      discountMoney: Number(input.discountMoney),
      discountPercent: Number(input.discountPercent),
    })
    currentOftenUseDiscount.value.name = updated.name
    currentOftenUseDiscount.value.discountMoney = updated.discountMoney
    currentOftenUseDiscount.value.discountPercent = updated.discountPercent
    editOftenUseDiscountDialog.value = false
    showToast('保存成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
</script>

<style lang="scss" scoped></style>
