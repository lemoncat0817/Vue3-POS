import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useSettingStore = defineStore(
  'setting',
  () => {
    const currentSettingPage = ref(0)

    return { currentSettingPage }
  },
  {
    persist: true
  }
)
