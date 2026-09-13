import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { setDeviceToken, setWebSessionToken } from '@/api/http'

const STORAGE_KEY = 'device'

// 掛載前同步讀取 localStorage 設定憑證，避免等待 pinia 延遲 hydrate 導致初始請求 401。
export function primeDeviceTokenFromStorage(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as { deviceToken?: string | null }
    if (parsed.deviceToken) setDeviceToken(parsed.deviceToken)
  } catch {
    // 讀取失敗時靜默忽略，維持未綁定裝置狀態。
  }
}

export const useDeviceStore = defineStore(
  'device',
  () => {
    const deviceToken = ref<string | null>(null)
    const deviceName = ref<string | null>(null)
    const pendingOwnerAccount = ref<string | null>(null)
    const pendingOwnerPin = ref<string | null>(null)
    const webSessionToken = ref<string | null>(null)

    // 不設 immediate 以免 ref 初始 null 覆蓋 primeDeviceTokenFromStorage 設定的憑證。
    watch(deviceToken, (value) => setDeviceToken(value))
    watch(webSessionToken, (value) => setWebSessionToken(value))

    function clearPendingOwnerCredentials(): void {
      pendingOwnerAccount.value = null
      pendingOwnerPin.value = null
    }

    function hydrateDeviceNameFromServer(name: string): void {
      deviceName.value = name
    }

    return {
      deviceToken,
      deviceName,
      pendingOwnerAccount,
      pendingOwnerPin,
      webSessionToken,
      clearPendingOwnerCredentials,
      hydrateDeviceNameFromServer
    }
  },
  {
    persist: {
      omit: ['pendingOwnerAccount', 'pendingOwnerPin']
    }
  }
)
