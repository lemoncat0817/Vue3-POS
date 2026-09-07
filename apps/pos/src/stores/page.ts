import { ref } from 'vue'
import { defineStore } from 'pinia'

// D-07：原本這裡用 useRouter()／onMounted() 在 store 的 setup 函式內
// 註冊生命週期鉤子與導航副作用。Pinia store 不是元件，onMounted 能不能
// 正確掛上去，取決於「這個 store 第一次被哪個元件呼叫」——不是真正
// 決定性的行為。這個 store 現在只保留純狀態，掛載時的導航還原邏輯移到
// App.vue（見該檔案），交給一定會執行、生命週期明確的根元件負責。
export const usePageStore = defineStore('page', () => {
  // 當前訂單編號
  const currentPage = ref(0)
  return { currentPage }
}, {
  persist: true,
})
