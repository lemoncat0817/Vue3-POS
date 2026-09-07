import { ref } from 'vue'
import { defineStore } from 'pinia'

// D-12 修復：原本這裡是一個手動維護的數字 currentPage（0～4），呼叫端
// （layout/header/index.vue 的 changePage()）每次導航都要記得手動同步
// 賦值——跟 vue-router 自己知道的目前路由是兩份分開維護、容易漏同步的
// 狀態。現在改成只記錄「上次造訪的路由名稱」，且改由 router/index.ts
// 的 router.afterEach 自動寫入（見該檔案），呼叫端不用再手動維護這份
// 狀態，也不會有漏掉某個分頁忘記賦值的問題。
export const usePageStore = defineStore('page', () => {
  const lastVisitedName = ref<string | null>(null)
  return { lastVisitedName }
}, {
  persist: true,
})
