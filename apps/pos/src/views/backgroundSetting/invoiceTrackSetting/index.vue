<template>
  <div class="w-full p-4">
    <div class="card-panel p-5 flex flex-col gap-3.5">
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-surface-200 dark:border-surface-800"
      >
        <div>
          <h3 class="text-sm font-bold text-surface-900 dark:text-surface-100 tracking-tight">
            電子發票字軌
          </h3>
          <p class="text-[11px] text-surface-400">財政部配發字軌與上傳狀態管理</p>
        </div>
        <div class="flex items-center gap-1.5">
          <button
            type="button"
            class="pos-btn pos-btn-secondary px-3 py-1.5 text-xs font-bold"
            @click="submitBatch"
          >
            模擬上傳未上傳的發票
          </button>
          <button
            type="button"
            class="pos-btn pos-btn-primary px-3 py-1.5 text-xs font-bold"
            @click="addDialog = true"
          >
            新增字軌（換下一期）
          </button>
        </div>
      </div>

      <p class="text-xs text-surface-500 dark:text-surface-400">
        真正的統一發票字軌由財政部每兩個月配發一次，商家要先申請——新增字軌代表換成下一期，會自動停用目前這一期。上傳到財政部電子發票整合服務平台目前是模擬（沒有真正的介接憑證），只是把「已開立」的發票標成「已上傳」。
      </p>

      <div
        class="overflow-hidden rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm"
      >
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead
              class="border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400"
            >
              <tr>
                <th class="px-4 py-3.5 text-left">字軌</th>
                <th class="px-4 py-3.5 text-left">期別</th>
                <th class="px-4 py-3.5 text-left">號碼區間</th>
                <th class="px-4 py-3.5 text-right">目前號碼</th>
                <th class="px-4 py-3.5 text-center">狀態</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
              <tr v-if="tracks.length === 0">
                <td
                  colspan="5"
                  class="px-4 py-16 text-center text-surface-400 dark:text-surface-500"
                >
                  <div class="flex flex-col items-center justify-center gap-2">
                    <Receipt class="h-10 w-10 text-surface-300 dark:text-surface-700" />
                    <span class="text-base font-semibold text-surface-700 dark:text-surface-300"
                      >還沒有設定任何字軌</span
                    >
                    <span class="text-xs text-surface-400 dark:text-surface-500"
                      >尚未建立發票字軌資料，可點選上方「＋ 新增字軌」</span
                    >
                  </div>
                </td>
              </tr>
              <tr
                v-for="track in tracks"
                :key="track.id"
                class="transition-colors hover:bg-surface-50/80 dark:hover:bg-surface-800/40"
              >
                <td
                  class="px-4 py-3.5 align-middle text-left font-bold text-surface-900 dark:text-surface-100"
                >
                  {{ track.trackCode }}
                </td>
                <td
                  class="px-4 py-3.5 align-middle text-left text-surface-700 dark:text-surface-300"
                >
                  {{ track.periodLabel }}
                </td>
                <td class="px-4 py-3.5 align-middle text-left font-mono text-surface-500">
                  {{ track.rangeStart }} ～ {{ track.rangeEnd }}
                </td>
                <td
                  class="px-4 py-3.5 align-middle text-right font-mono font-bold text-surface-800 dark:text-surface-200"
                >
                  {{ track.currentNumber }}
                </td>
                <td class="px-4 py-3.5 align-middle text-center">
                  <span
                    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                    :class="
                      track.isActive
                        ? 'bg-success-50 text-success-600 dark:bg-success-950/40 dark:text-success-400'
                        : 'bg-surface-100 text-surface-400 dark:bg-surface-800 dark:text-surface-500'
                    "
                  >
                    {{ track.isActive ? '啟用中' : '已停用' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <TablePagination
          :page="1"
          :page-count="1"
          :total="tracks.length"
          :current-count="tracks.length"
          unit="筆字軌"
        />
      </div>
    </div>

    <ModalDialog v-model:open="addDialog" title="新增字軌">
      <Form
        v-slot="{ isSubmitting }"
        :validation-schema="toTypedSchema(trackSchema)"
        :initial-values="{ trackCode: '', periodLabel: '', rangeStart: 1, rangeEnd: 50000000 }"
        @submit="onSubmit"
      >
        <FormField
          name="trackCode"
          label="字軌代號（2 碼大寫英文字母）"
          :disabled="isSubmitting"
          placeholder="例如: AB"
        />
        <FormField
          name="periodLabel"
          label="期別說明"
          :disabled="isSubmitting"
          placeholder="例如: 2026年01-02月"
        />
        <FormField
          name="rangeStart"
          label="起始號碼"
          type="number"
          step="1"
          :disabled="isSubmitting"
          placeholder="例如: 1"
        />
        <FormField
          name="rangeEnd"
          label="結束號碼"
          type="number"
          step="1"
          :disabled="isSubmitting"
          placeholder="例如: 50000000"
        />
        <div class="mt-2 flex justify-end gap-2">
          <button
            type="button"
            class="pos-btn pos-btn-secondary px-4 py-2 text-sm"
            @click="addDialog = false"
          >
            取消
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="pos-btn pos-btn-primary px-4 py-2 text-sm disabled:opacity-50"
          >
            新增並啟用
          </button>
        </div>
      </Form>
    </ModalDialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Receipt } from 'lucide-vue-next'
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { Form } from 'vee-validate'
import ModalDialog from '@/components/ui/ModalDialog.vue'
import TablePagination from '@/components/ui/TablePagination.vue'
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

const trackSchema = z
  .object({
    trackCode: z
      .string()
      .trim()
      .regex(/^[A-Z]{2}$/, '字軌代號需為 2 碼大寫英文字母'),
    periodLabel: z.string().trim().min(1, '請輸入期別說明'),
    rangeStart: z.coerce.number().int().positive('起始號碼需為正整數'),
    rangeEnd: z.coerce.number().int().positive('結束號碼需為正整數')
  })
  .refine((input) => input.rangeEnd > input.rangeStart, {
    message: '結束號碼必須大於起始號碼',
    path: ['rangeEnd']
  })

const addDialog = ref(false)
async function onSubmit(values: Record<string, unknown>) {
  const input = values as {
    trackCode: string
    periodLabel: string
    rangeStart: number
    rangeEnd: number
  }
  try {
    const created = await createInvoiceTrack(input)
    // 新增字軌會自動停用其他字軌，本機同步狀態避免重新 fetch
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
    showToast(
      result.submittedCount > 0
        ? `已模擬上傳 ${result.submittedCount} 張發票`
        : '目前沒有待上傳的發票',
      'success'
    )
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
</script>

<style scoped></style>
