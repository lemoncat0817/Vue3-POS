import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useRouter } from 'vue-router'


export const useLoginStore = defineStore('login', () => {
  const router = useRouter()
  // 帳號
  const account = ref('admin')
  // 密碼
  const password = ref('000000')
  // 登入是否成立
  const isLogin = ref(false)
  // 判定帳號密碼是否正確
  const login = () => {
    if (account.value === 'admin' && password.value === '000000') {
      isLogin.value = true
      router.push('/home')
    } else {
      isLogin.value = false
      alert('帳號或是密碼錯誤')
    }
  }

  return { account, password, login }
}, {
  persist: true,
})
