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
              class="pos-btn bg-danger-50 text-danger-600 border border-danger-200/80 hover:bg-danger-100 dark:bg-danger-950/40 dark:text-danger-400 dark:border-danger-800 px-2.5 py-1.5 text-xs font-bold"
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
        <div class="flex items-center gap-1.5">
          <button type="button" class="flex h-7 w-7 items-center justify-center rounded-lg border border-surface-300 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-30" :disabled="moneyDiscountCurrentPage <= 1" @click="moneyDiscountCurrentPage--">
            <ChevronLeft class="h-3.5 w-3.5" />
          </button>
          <span class="px-1 font-mono text-[11px]">{{ discountStore.moneyDiscount.length > 0 ? moneyDiscountCurrentPage : 0 }} / {{ moneyDiscountPageCount }}</span>
          <button type="button" class="flex h-7 w-7 items-center justify-center rounded-lg border border-surface-300 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-30" :disabled="moneyDiscountCurrentPage >= moneyDiscountPageCount" @click="moneyDiscountCurrentPage++">
            <ChevronRight class="h-3.5 w-3.5" />
          </button>
        </div>
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
              class="pos-btn bg-danger-50 text-danger-600 border border-danger-200/80 hover:bg-danger-100 dark:bg-danger-950/40 dark:text-danger-400 dark:border-danger-800 px-2.5 py-1.5 text-xs font-bold"
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
        <div class="flex items-center gap-1.5">
          <button type="button" class="flex h-7 w-7 items-center justify-center rounded-lg border border-surface-300 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-30" :disabled="percentDiscountCurrentPage <= 1" @click="percentDiscountCurrentPage--">
            <ChevronLeft class="h-3.5 w-3.5" />
          </button>
          <span class="px-1 font-mono text-[11px]">{{ discountStore.percentDiscount.length > 0 ? percentDiscountCurrentPage : 0 }} / {{ percentDiscountPageCount }}</span>
          <button type="button" class="flex h-7 w-7 items-center justify-center rounded-lg border border-surface-300 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-30" :disabled="percentDiscountCurrentPage >= percentDiscountPageCount" @click="percentDiscountCurrentPage++">
            <ChevronRight class="h-3.5 w-3.5" />
          </button>
        </div>
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

  <!-- 新增折數折扣券 -->
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

  <!-- 編輯折數折扣券 -->
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
import { Ticket, Percent, Sparkles, ChevronLeft, ChevronRight } from 'lucide-vue-next'
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
