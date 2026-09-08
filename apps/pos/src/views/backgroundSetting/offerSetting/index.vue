<template>
  <!-- 現金折扣券 -->
  <div class="lg:flex-[1] w-[33%] px-2">
    <div class="mt-2 flex items-center justify-between">
      <div class="border-b-2 border-solid border-surface-900 dark:border-surface-100 text-lg font-bold text-surface-900 dark:text-surface-100">現金折扣券</div>
      <div class="flex gap-1">
        <button
          type="button"
          class="rounded-lg border border-surface-300 dark:border-surface-700 px-2 py-1 text-xs font-bold text-surface-700 dark:text-surface-300 transition-colors hover:bg-surface-100 dark:hover:bg-surface-800"
          :class="{ 'pointer-events-none opacity-40': !canSetMoneyDiscount }"
          @click="openAddMoneyDiscountDialog">新增</button>
        <button
          type="button"
          class="rounded-lg border border-danger-200 px-2 py-1 text-xs font-bold text-danger-600 transition-colors hover:bg-danger-50 dark:border-danger-800 dark:text-danger-400 dark:hover:bg-danger-950"
          :class="{ 'pointer-events-none opacity-40': !canSetMoneyDiscount }"
          @click="deleteDrinkMoneyDiscount">刪除</button>
        <button
          type="button"
          class="rounded-lg border border-surface-300 dark:border-surface-700 px-2 py-1 text-xs font-bold text-surface-700 dark:text-surface-300 transition-colors hover:bg-surface-100 dark:hover:bg-surface-800"
          :class="{ 'pointer-events-none opacity-40': !canSetMoneyDiscount }"
          @click="openEditMoneyDiscountDialog">編輯</button>
      </div>
    </div>

    <table class="mt-2 w-full text-center text-sm">
      <thead class="bg-surface-100 dark:bg-surface-800 text-xs font-bold text-surface-500 dark:text-surface-400">
        <tr>
          <th class="px-2 py-2">序號</th>
          <th class="px-2 py-2">Id</th>
          <th class="px-2 py-2">折價券名稱</th>
          <th class="px-2 py-2">折價金額</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
        <tr v-if="sliceMoneyDiscount.length === 0">
          <td colspan="4" class="px-2 py-8 text-surface-400 dark:text-surface-500">無現金折價券</td>
        </tr>
        <tr
          v-for="(row, index) in sliceMoneyDiscount" :key="row.id" class="cursor-pointer transition-colors hover:bg-surface-50 dark:hover:bg-surface-950"
          :class="{ 'bg-primary-50 dark:bg-primary-950/40': currentMoneyDiscount.id === row.id }"
          @click="currentMoneyDiscount = row">
          <td class="px-2 py-2">{{ index + 1 }}</td>
          <td class="px-2 py-2">{{ row.id }}</td>
          <td class="px-2 py-2">{{ row.name }}</td>
          <td class="px-2 py-2">{{ row.discountMoney }}</td>
        </tr>
      </tbody>
    </table>
    <div class="mt-4 flex items-center justify-around rounded-lg bg-surface-100 dark:bg-surface-800 px-2 py-2 text-sm text-surface-600 dark:text-surface-400">
      <p>共 {{ discountStore.moneyDiscount.length }} 樣</p>
      <div class="flex items-center gap-2">
        <button type="button" class="rounded border border-surface-300 dark:border-surface-700 px-2 disabled:opacity-40" :disabled="moneyDiscountCurrentPage <= 1" @click="moneyDiscountCurrentPage--">‹</button>
        <button type="button" class="rounded border border-surface-300 dark:border-surface-700 px-2 disabled:opacity-40" :disabled="moneyDiscountCurrentPage >= moneyDiscountPageCount" @click="moneyDiscountCurrentPage++">›</button>
      </div>
      <p>{{ discountStore.moneyDiscount.length > 0 ? moneyDiscountCurrentPage : 0 }}/{{ moneyDiscountPageCount }}頁</p>
    </div>
  </div>

  <!-- 折數折扣券 -->
  <div class="lg:flex-[1] w-[34%] border-x-2 border-solid border-surface-200 dark:border-surface-800 px-2">
    <div class="mt-2 flex items-center justify-between">
      <div class="border-b-2 border-solid border-surface-900 dark:border-surface-100 text-lg font-bold text-surface-900 dark:text-surface-100">折數折扣券</div>
      <div class="flex gap-1">
        <button
          type="button"
          class="rounded-lg border border-surface-300 dark:border-surface-700 px-2 py-1 text-xs font-bold text-surface-700 dark:text-surface-300 transition-colors hover:bg-surface-100 dark:hover:bg-surface-800"
          :class="{ 'pointer-events-none opacity-40': !canSetPercentDiscount }"
          @click="openAddPercentDiscountDialog">新增</button>
        <button
          type="button"
          class="rounded-lg border border-danger-200 px-2 py-1 text-xs font-bold text-danger-600 transition-colors hover:bg-danger-50 dark:border-danger-800 dark:text-danger-400 dark:hover:bg-danger-950"
          :class="{ 'pointer-events-none opacity-40': !canSetPercentDiscount }"
          @click="deleteDrinkPercentDiscount">刪除</button>
        <button
          type="button"
          class="rounded-lg border border-surface-300 dark:border-surface-700 px-2 py-1 text-xs font-bold text-surface-700 dark:text-surface-300 transition-colors hover:bg-surface-100 dark:hover:bg-surface-800"
          :class="{ 'pointer-events-none opacity-40': !canSetPercentDiscount }"
          @click="openEditPercentDiscountDialog">編輯</button>
      </div>
    </div>

    <table class="mt-2 w-full text-center text-sm">
      <thead class="bg-surface-100 dark:bg-surface-800 text-xs font-bold text-surface-500 dark:text-surface-400">
        <tr>
          <th class="px-2 py-2">序號</th>
          <th class="px-2 py-2">Id</th>
          <th class="px-2 py-2">折價券名稱</th>
          <th class="px-2 py-2">折價折數</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
        <tr v-if="slicePercentDiscount.length === 0">
          <td colspan="4" class="px-2 py-8 text-surface-400 dark:text-surface-500">無折數折價券</td>
        </tr>
        <tr
          v-for="(row, index) in slicePercentDiscount" :key="row.id" class="cursor-pointer transition-colors hover:bg-surface-50 dark:hover:bg-surface-950"
          :class="{ 'bg-primary-50 dark:bg-primary-950/40': currentPercentDiscount.id === row.id }"
          @click="currentPercentDiscount = row">
          <td class="px-2 py-2">{{ index + 1 }}</td>
          <td class="px-2 py-2">{{ row.id }}</td>
          <td class="px-2 py-2">{{ row.name }}</td>
          <td class="px-2 py-2">{{ row.discountMoney }}</td>
        </tr>
      </tbody>
    </table>
    <div class="mt-4 flex items-center justify-around rounded-lg bg-surface-100 dark:bg-surface-800 px-2 py-2 text-sm text-surface-600 dark:text-surface-400">
      <p>共 {{ discountStore.percentDiscount.length }} 樣</p>
      <div class="flex items-center gap-2">
        <button type="button" class="rounded border border-surface-300 dark:border-surface-700 px-2 disabled:opacity-40" :disabled="percentDiscountCurrentPage <= 1" @click="percentDiscountCurrentPage--">‹</button>
        <button type="button" class="rounded border border-surface-300 dark:border-surface-700 px-2 disabled:opacity-40" :disabled="percentDiscountCurrentPage >= percentDiscountPageCount" @click="percentDiscountCurrentPage++">›</button>
      </div>
      <p>{{ discountStore.percentDiscount.length > 0 ? percentDiscountCurrentPage : 0 }}/{{ percentDiscountPageCount }}頁</p>
    </div>
  </div>

  <!-- 常用優惠 -->
  <div class="lg:flex-[1] w-[33%] px-2">
    <div class="mt-2 flex items-center justify-between">
      <div class="border-b-2 border-solid border-surface-900 dark:border-surface-100 text-lg font-bold text-surface-900 dark:text-surface-100">常用優惠</div>
      <button
        type="button"
        class="rounded-lg border border-surface-300 dark:border-surface-700 px-2 py-1 text-xs font-bold text-surface-700 dark:text-surface-300 transition-colors hover:bg-surface-100 dark:hover:bg-surface-800"
        :class="{ 'pointer-events-none opacity-40': !canSetOftenUseDiscount }"
        @click="openEditOftenUseDiscountDialog">編輯</button>
    </div>

    <table class="mt-2 w-full text-center text-sm">
      <thead class="bg-surface-100 dark:bg-surface-800 text-xs font-bold text-surface-500 dark:text-surface-400">
        <tr>
          <th class="px-2 py-2">序號</th>
          <th class="px-2 py-2">優惠名稱</th>
          <th class="px-2 py-2">折價金額</th>
          <th class="px-2 py-2">折價折數</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
        <tr
          v-for="(row, index) in discountStore.oftenUseDiscount" :key="row.id" class="cursor-pointer transition-colors hover:bg-surface-50 dark:hover:bg-surface-950"
          :class="{ 'bg-primary-50 dark:bg-primary-950/40': currentOftenUseDiscount.id === row.id }"
          @click="currentOftenUseDiscount = row">
          <td class="px-2 py-2">{{ index + 1 }}</td>
          <td class="px-2 py-2">{{ row.name }}</td>
          <td class="px-2 py-2">{{ row.discountMoney }}</td>
          <td class="px-2 py-2">{{ row.discountPercent }}</td>
        </tr>
      </tbody>
    </table>
    <div class="mt-4 flex items-center justify-around rounded-lg bg-surface-100 dark:bg-surface-800 px-2 py-2 text-sm text-surface-600 dark:text-surface-400">
      <p>共 5 樣</p>
      <p>1/1頁</p>
    </div>
  </div>

  <!-- 新增現金折扣券 -->
  <ModalDialog v-model:open="addMoneyDiscountDialog" title="新增現金折扣券">
    <Form v-slot="{ isSubmitting }" :validation-schema="toTypedSchema(moneyCouponSchema())" :initial-values="{ name: '' }" @submit="onSubmitAddMoneyDiscount">
      <FormField name="name" label="折扣券名稱" :disabled="isSubmitting" placeholder="例如: $50折價券..." />
      <FormField name="discountMoney" label="折扣的金額" type="number" step="1" :disabled="isSubmitting" placeholder="純數字,例如:1,2,3..." />
      <div class="mt-2 flex justify-end gap-2">
        <button type="button" class="rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-sm font-bold text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800" @click="addMoneyDiscountDialog = false">取消</button>
        <button type="submit" :disabled="isSubmitting" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50">新增</button>
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
      <FormField name="name" label="折扣券名稱" :disabled="isSubmitting" placeholder="例如: $50折價券..." />
      <FormField name="discountMoney" label="折扣的金額" type="number" step="1" :disabled="isSubmitting" placeholder="純數字,例如:1,2,3..." />
      <div class="mt-2 flex justify-end gap-2">
        <button type="button" class="rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-sm font-bold text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800" @click="editMoneyDiscountDialog = false">取消</button>
        <button type="submit" :disabled="isSubmitting" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50">保存</button>
      </div>
    </Form>
  </ModalDialog>

  <!-- 新增折數折扣券 -->
  <ModalDialog v-model:open="addPercentDiscountDialog" title="新增折數折扣券">
    <Form v-slot="{ isSubmitting }" :validation-schema="toTypedSchema(percentCouponSchema())" :initial-values="{ name: '' }" @submit="onSubmitAddPercentDiscount">
      <FormField name="name" label="折扣券名稱" :disabled="isSubmitting" placeholder="例如: 九折折價券..." />
      <FormField name="discountPercent" label="折扣的折數" type="number" step="0.01" :disabled="isSubmitting" placeholder="純數字,例如:0.9,0.75..." />
      <div class="mt-2 flex justify-end gap-2">
        <button type="button" class="rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-sm font-bold text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800" @click="addPercentDiscountDialog = false">取消</button>
        <button type="submit" :disabled="isSubmitting" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50">新增</button>
      </div>
    </Form>
  </ModalDialog>
  <!-- 編輯折數折扣券 -->
  <ModalDialog v-model:open="editPercentDiscountDialog" title="編輯折數折扣券">
    <Form
      v-slot="{ isSubmitting }"
      :validation-schema="toTypedSchema(percentCouponSchema(currentPercentDiscount.id))"
      :initial-values="{ name: currentPercentDiscount.name, discountPercent: Number(currentPercentDiscount.discountMoney) }"
      @submit="onSubmitEditPercentDiscount">
      <FormField name="name" label="折扣券名稱" :disabled="isSubmitting" placeholder="例如: 九折折價券..." />
      <FormField name="discountPercent" label="折扣的折數" type="number" step="0.01" :disabled="isSubmitting" placeholder="純數字,例如:0.9,0.75..." />
      <div class="mt-2 flex justify-end gap-2">
        <button type="button" class="rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-sm font-bold text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800" @click="editPercentDiscountDialog = false">取消</button>
        <button type="submit" :disabled="isSubmitting" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50">保存</button>
      </div>
    </Form>
  </ModalDialog>

  <!-- 編輯常用優惠 -->
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
      <FormField name="name" label="優惠名稱" :disabled="nameDisabled || isSubmitting" placeholder="例如: 九折,員工八折..." />
      <FormField name="discountMoney" label="折扣的金額" type="number" step="1" :disabled="moneyDisabled || isSubmitting" placeholder="純數字,例如:1,2,3..." />
      <FormField name="discountPercent" label="折扣的折數" type="number" step="0.01" :disabled="percentDisabled || isSubmitting" placeholder="純數字,例如:0.95,0.85..." />
      <div class="mt-2 flex justify-end gap-2">
        <button type="button" class="rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-sm font-bold text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800" @click="editOftenUseDiscountDialog = false">取消</button>
        <button type="submit" :disabled="isSubmitting" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50">保存</button>
      </div>
    </Form>
  </ModalDialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { Form } from 'vee-validate'
import ModalDialog from '@/components/ui/ModalDialog.vue'
import FormField from '@/components/ui/FormField.vue'
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

// P5：這個頁面的新增／刪除／編輯改成真的呼叫 apps/api 的促銷寫入端點
// （見 api/promotions.ts），不再只是本機陣列操作。Id 因此不再是這裡
// 手動輸入的欄位——新增時由伺服端配發（見 apps/api/src/routes/
// promotions.ts），編輯只能改名稱／金額，不能改 Id。
//
// P8：新增／刪除／編輯的表單驗證原本是送出當下一連串 if/else +
// ElMessage.error()，只回報第一個不合法的規則。改成 VeeValidate + Zod
// （見下方各個 xxxSchema），錯誤即時顯示在對應欄位下方（見
// components/ui/FormField.vue），一次驗證所有欄位；ElMessageBox.confirm
// 改用 composables/useConfirm.ts，ElMessage 改用 composables/useToast.ts
// （見 views/order/index.vue 的說明，同一套基礎設施）；ElMessageBox.alert
// （「請先選擇要編輯/刪除的項目」這類單按鈕通知）改用 showToast（非
// 阻斷式提示，不需要使用者額外點掉才能繼續操作，是比原本 alert 更好的
// UX，不是單純的機械式替換）。
//
// 這個頁面刻意用 VeeValidate 的 <Form> 元件（而不是 useForm() 組合式
// API）：這一頁一次要開 5 個獨立表單（新增／編輯現金券、新增／編輯
// 折數券、編輯常用優惠），如果在同一個 <script setup> 裡呼叫 5 次
// useForm()，每次呼叫都會用同一個 key 對這個元件實例呼叫一次 Vue 的
// provide()，後呼叫的會直接覆蓋前面的——結果變成全部 5 個表單的
// useField() 都錯誤地連到「最後一個」表單的 context，其餘 4 個表單的
// handleSubmit() 因為底下沒有任何欄位真的註冊進來，永遠驗證失敗又不
// 顯示任何錯誤（實際發生過：新增現金折扣券送出後畫面沒反應、也沒打
// API，直到跑 e2e/promotion-admin.spec.ts 才抓到）。<Form> 元件每次
// 使用都是獨立的元件實例，各自的 provide() 互不影響，這才是 VeeValidate
// 官方文件建議「同一頁有多個表單」時的用法。
//
// 每個 FormField 都額外綁了 :disabled="isSubmitting"（不是只有送出
// 按鈕）：VeeValidate 的 <Form> 送出時，驗證失敗也不會馬上結束——
// handleSubmit() 內部是等 validate() 這個 async 呼叫真的 resolve 後，
// 才用當下（resolve 當下，不是「點擊當下」）的 formValues 判斷有效性。
// 如果送出失敗後（例如名稱撞名）使用者能繼續打字，等這次失敗的驗證
// 終於 resolve 時，欄位可能已經被改成合法值，會被誤判為「這次送出其實
// 是合法的」，用當下已經被改到一半的欄位值（可能有些欄位改了、有些還
// 沒改）當作合法輸入送出——實際發生過：e2e 測試裡「先打錯名稱送出被擋
// →改名字→改金額→再送出」這個流程，最後送出的金額偶爾會是「改名字
// 那個時間點」的舊值，不是最後打的新值（用 console.log 逐步追蹤
// FormField 的 input 事件跟 onSubmit 收到的 values 才抓到，不是靠猜的）。
// 送出中鎖住全部欄位（不只鎖按鈕）就不會有這個中繼狀態可以被誤用。
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

// PercentDiscount.discountMoney 其實存的是折數（見 types/discount.ts
// 的說明），表單欄位改用誠實的 discountPercent 命名，送出時才轉換成
// 店裡既有陣列的欄位名稱。
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
// slot 0、1 是環保／瓶裝容器群組（只能改金額，名稱／折數固定），
// slot 2～4 是三個折數群組（只能改名稱／折數，金額固定為 0）——對照
// @pos/domain 的 OftenUseRates 型別說明。
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
