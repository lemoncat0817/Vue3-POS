import { ref } from 'vue'
import { defineStore } from 'pinia'

// 記錄上次造訪的路由名稱，由 router.afterEach 自動更新。
export const usePageStore = defineStore(
  'page',
  () => {
    const lastVisitedName = ref<string | null>(null)
    return { lastVisitedName }
  },
  {
    persist: true
  }
)
