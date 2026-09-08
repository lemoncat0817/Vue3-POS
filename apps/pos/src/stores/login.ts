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
  // D-04 修復：原本叫 isRememberPin，勾選後會讓明碼 PIN 隨整個 store
  // 一起被 persist:true 存進 localStorage、無限期留在那裡（見下方
  // persist 設定的說明）——這是「記住 PIN」這個功能唯一的實作方式，
  // 也正是 D-04 本身。改成只記住帳號名稱：帳號不是秘密，記住它單純
  // 是少打幾個字的方便，不需要（也不應該）為了同一個方便把明碼登入
  // 憑證留在使用者裝置上。
  const rememberAccount = ref(false)

  return { account, pin, isLogin, userInfo, rememberAccount }
}, {
  persist: {
    // D-04 修復：pin 永遠不進 localStorage，不管使用者有沒有勾選
    // 「記住帳號」——這是唯一的明碼登入憑證，跟 account（不是秘密，
    // 純粹省得重打）、isLogin／userInfo（維持重新整理後仍是登入狀態，
    // 這是一般 SPA 常見的 session 行為，不是這裡要修的問題）不是
    // 同一類資料，見 views/login/index.vue、layout/header/index.vue
    // 登出時的清除邏輯說明。
    omit: ['pin'],
  },
})
