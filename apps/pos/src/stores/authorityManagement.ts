import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { StaffMember } from '@/types'

/**
 * P4：登入（views/login/index.vue）已經改成真的向伺服端驗證帳號＋PIN
 * （見 api/auth.ts），不再讀這份名單做密碼比對。
 *
 * P18（規劃書 §10 P18「菜單與權限管理接上伺服端」）：這個頁面
 * （authorityManagement/permissionManagement）原本是純本機狀態，
 * 新增／編輯／刪除只改這裡的陣列，從沒呼叫過任何 API，畫面上看到的
 * 三筆示範人員也是寫死在這裡的假資料。
 *
 * staffSource 跟 stores/drink.ts 的 catalogSource 是同一套邏輯（見
 * App.vue 的說明）：只在「這個瀏覽器從來沒同步過伺服端人員名單」時
 * 套用一次 hydrateStaffFromServer() 的結果，之後永遠以本機（可能已被
 * 管理員編輯過）的資料為準。
 *
 * 這裡刻意不採用「permissionManagement/index.vue 每次掛載都重新整包
 * 取代 staffList」的做法——曾經這樣寫過，但那個 fetch 是在使用者已經
 * 導到權限管理頁、準備開始操作的當下才發出，跟「使用者送出新增／編輯
 * 表單、本機陣列已經用伺服端回應更新」幾乎同時發生：如果那個掛載時的
 * fetch 剛好在使用者的新增動作之後才 resolve，就會用 fetch 當下（還沒
 * 看到新增結果）的舊清單整包蓋掉剛新增的資料，e2e/permission-admin.
 * spec.ts 曾經抓到這個競態（付款方式新增後畫面上又消失）。改成跟
 * catalogSource 一樣在 App.vue 啟動時就同步一次（使用者根本還沒登入、
 * 不可能發生同時寫入），之後的新增／編輯／刪除都只改本機陣列，就沒有
 * 「兩個地方同時想決定 staffList 長怎樣」的競態可言（permission
 * Management/index.vue 的新增／編輯／刪除也會在成功後把 staffSource
 * 標成 'server'，蓋掉「掛載時那次 fetch 還沒 resolve 就先做了本機
 * 異動」這個更窄的競態，見該檔案的說明）。
 *
 * staffSource 跟 staffList 兩份要一起持久化，不能只留一份：曾經只把
 * staffSource 留在 persist（staffList 用 omit 排除），結果重新整理後
 * staffSource 從 localStorage 復原成 'server'、但 staffList 因為沒有
 * persist 被重置回空陣列，guard 又因為 staffSource 已經是 'server'
 * 而永遠不再讓 hydrateStaffFromServer() 補回資料——變成重新整理後人員
 * 名單整個消失。跟 stores/drink.ts／stores/order.ts 一樣整包
 * persist:true，兩者才會同進退。
 */
export const useAuthorityManagementStore = defineStore('authorityManagement', () => {
  // 當前的查看的資料類型
  const currentAuthorityManagementPage = ref(0)
  const staffSource = ref<'seed' | 'server'>('seed')
  // 人員名單，見上方說明。
  const staffList = ref<StaffMember[]>([])

  // 見上方 staffSource 的說明：只在第一次（本機從未同步過伺服端人員
  // 名單）時套用，之後就算重新呼叫也不會再覆蓋本機資料。
  const hydrateStaffFromServer = (list: StaffMember[]) => {
    if (staffSource.value === 'server') return
    staffList.value = list
    staffSource.value = 'server'
  }

  return { currentAuthorityManagementPage, staffSource, hydrateStaffFromServer, staffList }
}, {
  persist: true,
})
