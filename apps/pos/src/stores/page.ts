import { ref, onMounted, nextTick } from 'vue'
import { defineStore } from 'pinia'
import { useRouter } from "vue-router"


export const usePageStore = defineStore('page', () => {
  const router = useRouter()
  // 當前訂單編號
  const currentPage = ref(0)
  onMounted(() => {
    nextTick(() => {
      if (currentPage.value === 0) {
        router.push('/home')
      }
      if (currentPage.value === 1) {
        router.push('/order')
      }
    })
  })
  return { currentPage }
}, {
  persist: true,
})
