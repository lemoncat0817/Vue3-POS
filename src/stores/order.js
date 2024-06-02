import { ref } from 'vue'
import { defineStore } from 'pinia'


export const useOrderStore = defineStore('order', () => {
  // 當前訂單編號
  const currentOrderNumber = ref(1)
  // 訂單資訊
  const order = ref({
    "orderNumber": 1,
    "orderDate": "2022-01-01",
    "orderTime": "10:00",
    "staff": "愛喝奶茶的貓咪",   
  })

  return { currentOrderNumber, order }
}, {
  persist: true,
})
