import { ref } from 'vue'
import { defineStore } from 'pinia'


export const useOrderStore = defineStore('order', () => {
  const currentOrderNumber = ref(1)

  return { currentOrderNumber }
}, {
  persist: true,
})
