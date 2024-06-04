import { ref } from 'vue'
import { defineStore } from 'pinia'



export const useSettingStore = defineStore('setting', () => {
  // 當前的設定頁面
  const currentSettingPage = ref(0)

  return { currentSettingPage }
}, {
  persist: true,
})
