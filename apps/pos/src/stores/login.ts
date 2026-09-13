import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { setOperatorSession } from '@/api/http'
import type { StaffMember } from '@/types'

export type CurrentUser = StaffMember | undefined | []

export const useLoginStore = defineStore(
  'login',
  () => {
    const account = ref('')
    const pin = ref('')
    const isLogin = ref(false)
    const userInfo = ref<CurrentUser>([])
    const rememberAccount = ref(false)
    const sessionToken = ref<string | null>(null)

    // 不設 immediate 以免 ref 初始 null 覆蓋 hydrate 前已存在的憑證。
    watch(sessionToken, (value) => setOperatorSession(value))

    return { account, pin, isLogin, userInfo, rememberAccount, sessionToken }
  },
  {
    persist: {
      omit: ['pin'],
      // 未勾選記住帳號時排除 account，避免 localStorage 殘留憑證。
      serializer: {
        serialize: (data) =>
          JSON.stringify(data.rememberAccount ? data : { ...data, account: '' }),
        deserialize: JSON.parse
      }
    }
  }
)
