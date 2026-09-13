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
            裝置設定
          </h3>
          <p class="text-[11px] text-surface-400">目前這台裝置的顯示名稱</p>
        </div>
      </div>

      <div
        class="bg-surface-50/70 dark:bg-surface-800/40 px-5 py-2.5 border-b border-surface-100 dark:border-surface-800 text-xs text-surface-500 dark:text-surface-400"
      >
        這裡改的是目前這台裝置（瀏覽器）本身的名稱，會顯示在頂部列，例如「旗艦店 · 機台
        A」。同租戶底下每台裝置的名稱各自獨立，不會影響其他機台。
      </div>

      <div
        class="p-5 flex flex-col gap-4 max-w-sm"
        :class="{ 'opacity-50 pointer-events-none': !canManageDevices }"
      >
        <label class="block text-sm font-bold text-surface-700 dark:text-surface-300">
          機台名稱
          <input
            v-model.trim="name"
            type="text"
            maxlength="40"
            :disabled="!canManageDevices || loading"
            class="mt-1 w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm font-normal text-surface-900 outline-none transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-surface-100 disabled:text-surface-400 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 dark:disabled:bg-surface-900 dark:disabled:text-surface-600"
          />
        </label>
        <button
          type="button"
          class="pos-btn pos-btn-primary self-start px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!canManageDevices || saving || loading || !name || name === savedName"
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
import { useDeviceStore } from '@/stores/device'
import { hasCapability } from '@/utils/selection'
import { fetchCurrentDevice, renameDevice } from '@/api/devices'
import { apiErrorMessage } from '@/api/http'
import { showToast } from '@/composables/useToast'

const loginStore = useLoginStore()
const deviceStore = useDeviceStore()
const canManageDevices = computed(() => hasCapability(loginStore.userInfo, 'canManageDevices'))

const deviceId = ref('')
const savedName = ref(deviceStore.deviceName ?? '')
const name = ref(deviceStore.deviceName ?? '')
const loading = ref(true)
const saving = ref(false)

onMounted(async () => {
  try {
    const device = await fetchCurrentDevice()
    deviceId.value = device.id
    savedName.value = device.name
    name.value = device.name
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  } finally {
    loading.value = false
  }
})

async function onSave() {
  saving.value = true
  try {
    const device = await renameDevice(deviceId.value, { name: name.value })
    savedName.value = device.name
    name.value = device.name
    deviceStore.hydrateDeviceNameFromServer(device.name)
    showToast('已更新機台名稱', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped></style>
