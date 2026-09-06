import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { StaffMember } from '@/types'

/**
 * 登入者資訊的型別如實反映現行三種可能值：初始與登出時是 `[]`（用空陣列
 * 當「無使用者」的替代值，而非 `null`／`undefined`）、登入成功是完整的
 * `StaffMember`、登入失敗（`find()` 找不到符合的帳密）則是 `undefined`。
 * 這是既有的資料塑模方式，P0 不更動；P4 的身分重構會改為明確的
 * `StaffMember | null`。
 */
export type CurrentUser = StaffMember | undefined | []

export const useLoginStore = defineStore('login', () => {
  // 帳號
  const account = ref('')
  // 密碼
  const password = ref('')
  // 登入是否成立
  const isLogin = ref(false)
  // 登入者的資訊
  const userInfo = ref<CurrentUser>([])
  const isRememberPassword = ref(false)

  return { account, password, isLogin, userInfo, isRememberPassword }
}, {
  persist: true,
})
