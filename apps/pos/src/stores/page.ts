import { ref } from 'vue'
import { defineStore } from 'pinia'

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
