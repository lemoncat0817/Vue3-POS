import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { StaffMember } from '@/types'

/**
 * 登入者資訊的型別如實反映現行三種可能值：初始與登出時是 `[]`（用空陣列
 * 當「無使用者」的替代值，而非 `null`／`undefined`）、登入成功是完整的
 * `StaffMember`、登入失敗（伺服端回傳 401）則是 `undefined`。這個型別
 * 塑模方式維持不變——P4 實際做的身分重構是「登入這個動作本身」改成
 * 真的向伺服端驗證帳號＋PIN（見 views/login/index.vue、api/auth.ts），
 * 不是這裡的型別本身；`StaffMember | null` 的整理跟 D-10（capabilities
 * 陣列與 16 個 O/X 欄位並存）留在同一個未來階段一起處理，見
 * api/auth.ts 的 toStaffMember() 說明。
 */
export type CurrentUser = StaffMember | undefined | []

export const useLoginStore = defineStore('login', () => {
  // 帳號
  const account = ref('')
  // 操作員 PIN（P4：取代原本的明碼密碼欄位，見 views/login/index.vue）
  const pin = ref('')
  // 登入是否成立
  const isLogin = ref(false)
  // 登入者的資訊
  const userInfo = ref<CurrentUser>([])
  const isRememberPin = ref(false)

  return { account, pin, isLogin, userInfo, isRememberPin }
}, {
  persist: true,
})
