import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { setDeviceToken } from '@/api/http'

const STORAGE_KEY = 'device'

/**
 * main.ts 掛載前呼叫：pinia-plugin-persistedstate 的 hydrate 實測不保證在
 * App.vue 掛載、useQuery 送出第一批請求之前完成（曾經實際觀察到 hydrate
 * 是在那批請求已經送出、拿到 401 之後才跑，見這批 API 請求都需要裝置憑證
 * 的 GET /api/catalog 等端點）。與其賭時序，開頭直接同步讀 localStorage
 * 把 http.ts 的 currentDeviceToken 先設好；Pinia store 建立後仍會用同一個
 * 值再 hydrate 一次 store 本身的響應式狀態，兩者寫入同一個值，不會衝突
 * ——前提是下面的 watch 不能是 `immediate: true`，見該行的說明。
 */
export function primeDeviceTokenFromStorage(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as { deviceToken?: string | null }
    if (parsed.deviceToken) setDeviceToken(parsed.deviceToken)
  } catch {
    // localStorage 不可用（例如無痕模式）或內容壞掉，維持沒有裝置憑證的狀態即可，
    // 畫面會照 router 的導頁邏輯顯示 OAuth 登入選項。
  }
}

/**
 * 裝置（租戶）身分——跟 stores/login.ts 的操作員 PIN 身分是兩個不同層級：
 * deviceToken 證明「這台瀏覽器屬於哪個租戶」，PIN session 證明「現在操作
 * 的人是誰」。deviceToken 來自 Google／GitHub 登入（見 api/oauth-callback.ts），
 * 是長期憑證，刻意持久化到 localStorage，不像 stores/login.ts 的 pin 欄位
 * 那樣要排除。
 */
export const useDeviceStore = defineStore(
  'device',
  () => {
    const deviceToken = ref<string | null>(null)
    // 這台裝置的顯示名稱（例如「旗艦店 · 機台 A」），開機時由 App.vue 呼叫
    // GET /devices/me 覆蓋成伺服端最新值；先持久化這份快取，避免每次重新
    // 整理都要等那支請求回來才有值可顯示，畫面先閃一下舊名字總比空白好。
    const deviceName = ref<string | null>(null)
    // 新租戶第一次登入時，後端隨裝置一起核發的 owner 帳號／PIN（見
    // auth/onboarding.ts），只在這次登入畫面顯示一次給使用者抄下來，
    // 顯示過後由畫面呼叫 clearPendingOwnerCredentials() 清掉，不持久化。
    const pendingOwnerAccount = ref<string | null>(null)
    const pendingOwnerPin = ref<string | null>(null)

    // 故意不加 `immediate: true`：ref() 剛建立時是預設值 null，若立刻觸發
    // callback 會用這個假的 null 去覆蓋掉 primeDeviceTokenFromStorage() 剛
    // 同步設好的真正憑證——pinia-plugin-persistedstate 的 hydrate 是在
    // store 建立完成「之後」才非同步跑的，中間這個空檔剛好會被 immediate
    // 的這一次假觸發搶先覆蓋掉（實測會造成開頭那幾個請求全部 401，且會
    // 連帶觸發 onDeviceTokenInvalid 把剛存好的合法憑證整組清掉）。拿掉
    // immediate 後，只有「真的變動」（hydrate 完成、或登入／登出）才會
    // 觸發，初始值交給 primeDeviceTokenFromStorage() 負責就好。
    watch(deviceToken, (value) => setDeviceToken(value))

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
