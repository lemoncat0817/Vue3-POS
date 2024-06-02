import { ref } from 'vue'
import { defineStore } from 'pinia'


export const usePageStore = defineStore('page', () => {
  // 當前訂單編號
  const currentPage = ref(0)
  return { currentPage }
}, {
  persist: true,
})
