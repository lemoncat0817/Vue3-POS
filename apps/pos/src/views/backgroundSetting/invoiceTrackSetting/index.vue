<template>
  <div class="w-full p-4 flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <div class="text-lg font-bold text-surface-900 dark:text-surface-100">電子發票字軌</div>
      <div class="flex gap-2">
        <button
          type="button"
          class="rounded-lg border border-surface-300 px-3 py-1.5 text-sm font-bold text-surface-700 transition-colors hover:bg-surface-100 dark:border-surface-700 dark:text-surface-300 dark:hover:bg-surface-800"
          @click="submitBatch">模擬上傳未上傳的發票</button>
        <button
          type="button"
          class="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-primary-700"
          @click="addDialog = true">新增字軌（換下一期）</button>
      </div>
    </div>
    <p class="text-xs text-surface-500 dark:text-surface-400">
      真正的統一發票字軌由財政部每兩個月配發一次，商家要先申請——新增字軌代表換成下一期，會自動停用目前這一期。上傳到財政部電子發票整合服務平台目前是模擬（沒有真正的介接憑證），只是把「已開立」的發票標成「已上傳」。
    </p>

    <table class="w-full text-center text-sm">
      <thead class="bg-surface-100 text-xs font-bold text-surface-500 dark:bg-surface-800 dark:text-surface-400">
        <tr>
          <th class="px-2 py-2">字軌</th>
          <th class="px-2 py-2">期別</th>
          <th class="px-2 py-2">號碼區間</th>
          <th class="px-2 py-2">目前號碼</th>
          <th class="px-2 py-2">狀態</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
        <tr v-if="tracks.length === 0">
          <td colspan="5" class="px-2 py-8 text-surface-400 dark:text-surface-500">還沒有設定任何字軌</td>
        </tr>
        <tr v-for="track in tracks" :key="track.id" class="hover:bg-surface-50 dark:hover:bg-surface-950">
          <td class="px-2 py-2 font-bold">{{ track.trackCode }}</td>
          <td class="px-2 py-2">{{ track.periodLabel }}</td>
          <td class="px-2 py-2">{{ track.rangeStart }} ～ {{ track.rangeEnd }}</td>
          <td class="px-2 py-2">{{ track.currentNumber }}</td>
          <td class="px-2 py-2">
            <span
              class="rounded-full px-2 py-0.5 text-xs font-bold"
              :class="track.isActive ? 'bg-success-100 text-success-700 dark:bg-success-950 dark:text-success-300' : 'bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400'">
              {{ track.isActive ? '啟用中' : '已停用' }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>

    <ModalDialog v-model:open="addDialog" title="新增字軌">
      <Form v-slot="{ isSubmitting }" :validation-schema="toTypedSchema(trackSchema)" :initial-values="{ trackCode: '', periodLabel: '', rangeStart: 1, rangeEnd: 50000000 }" @submit="onSubmit">
        <FormField name="trackCode" label="字軌代號（2 碼大寫英文字母）" :disabled="isSubmitting" placeholder="例如: AB" />
        <FormField name="periodLabel" label="期別說明" :disabled="isSubmitting" placeholder="例如: 2026年01-02月" />
        <FormField name="rangeStart" label="起始號碼" type="number" step="1" :disabled="isSubmitting" placeholder="例如: 1" />
        <FormField name="rangeEnd" label="結束號碼" type="number" step="1" :disabled="isSubmitting" placeholder="例如: 50000000" />
        <div class="mt-2 flex justify-end gap-2">
          <button type="button" class="rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-sm font-bold text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800" @click="addDialog = false">取消</button>
          <button type="submit" :disabled="isSubmitting" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50">新增並啟用</button>
        </div>
      </Form>
    </ModalDialog>
  </div>
</template>

<script setup lang="ts">
// P23（規劃書 §10 P23「電子發票平台串接」）：新增字軌用 VeeValidate +
// Zod 的 <Form> 元件，跟 offerSetting/index.vue 是同一套模式——這裡
// 只有新增一個表單，欄位單純，適用 VeeValidate 而不是手動 if/else。
import { onMounted, ref } from 'vue'
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { Form } from 'vee-validate'
import ModalDialog from '@/components/ui/ModalDialog.vue'
import FormField from '@/components/ui/FormField.vue'
import { ApiError } from '@/api/http'
import { showToast } from '@/composables/useToast'
import { createInvoiceTrack, fetchInvoiceTracks, submitInvoices } from '@/api/invoices'
import type { InvoiceTrack } from '@pos/contract'

function apiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return `操作失敗：${err.message}`
  return '連不上伺服端，請確認網路連線'
}

const tracks = ref<InvoiceTrack[]>([])
onMounted(async () => {
  try {
    tracks.value = await fetchInvoiceTracks()
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
})

const trackSchema = z.object({
  trackCode: z.string().trim().regex(/^[A-Z]{2}$/, '字軌代號需為 2 碼大寫英文字母'),
  periodLabel: z.string().trim().min(1, '請輸入期別說明'),
  rangeStart: z.coerce.number().int().positive('起始號碼需為正整數'),
  rangeEnd: z.coerce.number().int().positive('結束號碼需為正整數'),
}).refine((input) => input.rangeEnd > input.rangeStart, {
  message: '結束號碼必須大於起始號碼',
  path: ['rangeEnd'],
})

const addDialog = ref(false)
async function onSubmit(values: Record<string, unknown>) {
  const input = values as { trackCode: string; periodLabel: string; rangeStart: number; rangeEnd: number }
  try {
    const created = await createInvoiceTrack(input)
    // 新字軌會自動停用其他字軌（見 api/invoices.ts 的說明），本機也
    // 同步把其他字軌標成停用，不用整包重新 fetch。
    tracks.value = [...tracks.value.map((track) => ({ ...track, isActive: false })), created]
    addDialog.value = false
    showToast('新增成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}

async function submitBatch() {
  try {
    const result = await submitInvoices()
    showToast(result.submittedCount > 0 ? `已模擬上傳 ${result.submittedCount} 張發票` : '目前沒有待上傳的發票', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
</script>

<style scoped></style>
