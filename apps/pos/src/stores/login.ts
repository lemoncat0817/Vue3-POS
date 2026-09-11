import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { setOperatorSession } from '@/api/http'
import type { StaffMember } from '@/types'

/** 登入者資訊：未登入時以空陣列 `[]` 表示，登入成功為 `StaffMember`，失敗為 `undefined`。 */
export type CurrentUser = StaffMember | undefined | []

export const useLoginStore = defineStore(
  'login',
  () => {
    const account = ref('')
    const pin = ref('')
    const isLogin = ref(false)
    const userInfo = ref<CurrentUser>([])
    // 僅記住帳號名稱，不記住 PIN。
    const rememberAccount = ref(false)
    // PIN 登入成功後核發的操作員 session（見 api/auth.ts），送給伺服端的
    // X-Operator-Session 都是這個值。跟 pin 不同，這個 token 本來就設計成
    // 可以安全持久化（撤銷／過期即失效），不必比照 pin 排除在外。
    const sessionToken = ref<string | null>(null)

    // 統一在這裡同步 X-Operator-Session（見 api/http.ts），不管 sessionToken
    // 是從哪個畫面被賦值的（登入頁、登出）都會生效，不必每個呼叫端各自記得同步。
    watch(sessionToken, (value) => setOperatorSession(value), { immediate: true })

    return { account, pin, isLogin, userInfo, rememberAccount, sessionToken }
  },
  {
    persist: {
      // PIN 為敏感憑證，不持久化至 localStorage。
      omit: ['pin']
    }
  }
)
