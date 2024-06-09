<template>
  <div
    class="w-screen h-[959px] bg-[url('@/assets/login-Bg.png')] bg-no-repeat bg-[length:100%_100%] text-white relative">
    <div
      class="absolute top-[40%] left-[50%] translate-x-[-50%] translate-y-[-50%] flex flex-col items-center gap-[50px]">
      <h1 class="text-[50px] font-bold bg-gradient-to-r from-red-500 to-pink-300 bg-clip-text text-transparent">MAJI Tea
      </h1>
      <input placeholder="請輸入帳號" v-model="loginStore.account"
        class="w-[200px] rounded-[20px] p-2 bg-[#f8f8dc] text-[#560710] text-center focus:w-[300px] transition-width duration-500">
      <input placeholder="請輸入密碼" type="password" v-model="loginStore.password"
        class="w-[200px] rounded-[20px] p-2 bg-[#f8f8dc] text-[#560710] text-center focus:w-[300px] transition-width duration-500">
      <button @click="login"
        class="w-[100px] rounded-[20px] p-2 bg-[#cc191f] text-center cursor-pointer font-bold hover:w-[200px] transition-width duration-500 hover:bg-[#ff4500]">登入</button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
import { useLoginStore } from '@/stores/login'
const loginStore = useLoginStore()
import { useAuthorityManagementStore } from '@/stores/authorityManagement'
const authorityManagementStore = useAuthorityManagementStore()
import { ElMessage, ElNotification } from 'element-plus'



// 判定帳號密碼是否正確
const login = () => {
  loginStore.userInfo = authorityManagementStore.staffList.find(item => {
    if (item.account === loginStore.account && item.password === loginStore.password) {
      return item
    }
  })
  if (loginStore.userInfo) {
    loginStore.isLogin = true
    router.push('/home')  
    ElNotification({
      title: '登入成功',
      message: `${loginStore.userInfo.jobTitle} - ${loginStore.userInfo.name},歡迎進入MAJI Tea POS機系統`,
      type: 'success',
    })
  } else {
    loginStore.isLogin = false
    ElMessage.error('帳號或是密碼有誤,請重新輸入')
  }
}
</script>

<style lang="scss" scoped></style>