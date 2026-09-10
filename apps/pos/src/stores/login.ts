import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { setCurrentStaffId } from '@/api/http'
import { fromSelection } from '@/utils/selection'
import type { StaffMember } from '@/types'

/** 登入者資訊：未登入時以空陣列 `[]` 表示，登入成功為 `StaffMember`，失敗為 `undefined`。 */
export type CurrentUser = StaffMember | undefined | []

export const useLoginStore = defineStore('login', () => {
  const account = ref('')
  const pin = ref('')
  const isLogin = ref(false)
  const userInfo = ref<CurrentUser>([])
  // 僅記住帳號名稱，不記住 PIN。
  const rememberAccount = ref(false)

  // 統一在這裡同步 X-Staff-Id（見 api/http.ts），不管 userInfo 是從哪個
  // 畫面被賦值的（登入頁、登出）都會生效，不必每個呼叫端各自記得同步。
  watch(userInfo, (value) => {
    const id = fromSelection(value)?.id
    setCurrentStaffId(id !== undefined ? String(id) : null)
  }, { immediate: true })

  return { account, pin, isLogin, userInfo, rememberAccount }
}, {
  persist: {
    // PIN 為敏感憑證，不持久化至 localStorage。
    omit: ['pin'],
  },
})
