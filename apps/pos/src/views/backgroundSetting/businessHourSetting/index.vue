<template>
  <div class="w-full flex flex-col">
    <div
      class="overflow-hidden rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm flex flex-col"
    >
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 border-b border-surface-100 dark:border-surface-800"
      >
        <div>
          <h3 class="text-sm font-black text-surface-900 dark:text-surface-100 tracking-tight">
            營業設定
          </h3>
          <p class="text-[11px] text-surface-400">營業日換日時間</p>
        </div>
      </div>

      <div
        class="bg-surface-50/70 dark:bg-surface-800/40 px-5 py-2.5 border-b border-surface-100 dark:border-surface-800 text-xs text-surface-500 dark:text-surface-400"
      >
        凌晨營業到這個時間之前的訂單，仍歸屬前一個營業日。深夜或跨夜營業（例如營業到凌晨兩點）請把換日時間往後調，避免深夜訂單被算到隔天、數據分析報表對不起來。
        <br />
        這個設定只套用到「儲存之後」新產生的訂單——已經送出的歷史訂單所屬的營業日不會被改寫，這是為了避免訂單序號、發票號碼跟報表對不起來。
      </div>

      <div
        class="p-5 flex flex-col gap-4 max-w-sm"
        :class="{ 'opacity-50 pointer-events-none': !canSetBusinessHours }"
      >
        <label class="block text-sm font-bold text-surface-700 dark:text-surface-300">
          換日時間
          <select
            v-model.number="selectedHour"
            :disabled="!canSetBusinessHours || loading"
            class="mt-1 w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm font-normal text-surface-900 outline-none transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-surface-100 disabled:text-surface-400 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 dark:disabled:bg-surface-900 dark:disabled:text-surface-600"
          >
            <option v-for="hour in HOURS" :key="hour" :value="hour">{{ formatHour(hour) }}</option>
          </select>
        </label>
        <button
          type="button"
          class="pos-btn pos-btn-primary self-start px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!canSetBusinessHours || saving || loading || selectedHour === savedHour"
          @click="onSave"
        >
          儲存
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useLoginStore } from '@/stores/login'
import { useOrderStore } from '@/stores/order'
import { hasCapability } from '@/utils/selection'
import { fetchTenantSettings, updateTenantSettings } from '@/api/tenant-settings'
import { apiErrorMessage } from '@/api/http'
import { showToast } from '@/composables/useToast'

const loginStore = useLoginStore()
const orderStore = useOrderStore()
const canSetBusinessHours = computed(() => hasCapability(loginStore.userInfo, 'canSetBusinessHours'))

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const formatHour = (hour: number) => `${String(hour).padStart(2, '0')}:00`

// 先用 order store 目前的值（開機同步的結果）當畫面初始值，避免一進頁面先閃一下
// 預設 4 點；onMounted 再打一次 API 拿最新資料整份覆蓋，確保跟伺服端一致。
const savedHour = ref(orderStore.businessDayStartHour)
const selectedHour = ref(orderStore.businessDayStartHour)
const loading = ref(true)
const saving = ref(false)

onMounted(async () => {
  try {
    const settings = await fetchTenantSettings()
    savedHour.value = settings.businessDayStartHour
    selectedHour.value = settings.businessDayStartHour
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  } finally {
    loading.value = false
  }
})

async function onSave() {
  saving.value = true
  try {
    const settings = await updateTenantSettings({ businessDayStartHour: selectedHour.value })
    savedHour.value = settings.businessDayStartHour
    selectedHour.value = settings.businessDayStartHour
    orderStore.hydrateBusinessDayStartHourFromServer(settings.businessDayStartHour)
    showToast('已更新營業日換日時間', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped></style>
