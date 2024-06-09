import { ref } from 'vue'
import { defineStore } from 'pinia'



export const useDataAnalysisStore = defineStore('dataAnalysis', () => {
  // 當前的查看的資料類型
  const currentDataAnalysis = ref(0)

  return { currentDataAnalysis }
}, {
  persist: true,
})
