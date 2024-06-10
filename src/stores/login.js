import { ref } from 'vue'
import { defineStore } from 'pinia'



export const useLoginStore = defineStore('login', () => {
  // 帳號
  const account = ref('')
  // 密碼
  const password = ref('')
  // 登入是否成立
  const isLogin = ref(false)
  // 登入者的資訊
  const userInfo = ref([])
  const isRememberPassword = ref(false)

  return { account, password, isLogin, userInfo, isRememberPassword }
}, {
  persist: true,
})
