import { ref } from 'vue'
import { defineStore } from 'pinia'
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

  return { account, pin, isLogin, userInfo, rememberAccount }
}, {
  persist: {
    // PIN 為敏感憑證，不持久化至 localStorage。
    omit: ['pin'],
  },
})
