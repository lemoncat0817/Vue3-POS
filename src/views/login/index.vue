<template>
  <div
    class="w-screen 2xl:h-[900px] xl:h-[800px] h-[959px] lg:h-[768px] bg-[url('@/assets/login-Bg.png')] bg-no-repeat bg-[length:100%_100%] text-white relative">
    <div
      class="absolute top-[40%] left-[50%] translate-x-[-50%] translate-y-[-50%] flex flex-col items-center xl:gap-[30px] lg:gap-[15px] gap-[10px]">
      <div class="flex items-center gap-[1px]">
        <h1
          class="text-[50px] font-bold bg-gradient-to-r from-red-500 to-pink-300 bg-clip-text text-transparent lg:text-[45px]">
          MAJI
          Tea
        </h1>
        <img src="@/assets/logo.png" alt="logo"
          class="w-16 h-4/5 rounded-lg ml-2 border-2 border-black border-solid lg:w-14 hover:scale-[1.1] hover:animate-bounce ">
      </div>
      <div class="flex items-center gap-[10px]">
        <p class="text-[30px] font-bold text-red-400 lg:text-[20px]">帳號</p>
        <input placeholder="請輸入帳號" v-model="loginStore.account"
          class="w-[200px] xl:h-12 lg:h-10 h-8 rounded-[20px] p-2 bg-[#f8f8dc] text-[#560710] font-bold text-lg text-center lg:w-[180px] focus:w-[300px] transition-width duration-500">
      </div>
      <div class="flex items-center gap-[10px]">
        <p class="text-[30px] font-bold text-red-400 lg:text-[20px]">密碼</p>
        <input placeholder="請輸入密碼" type="password" v-model="loginStore.password"
          class="w-[200px] xl:h-12 lg:h-10  h-8 rounded-[20px] p-2 bg-[#f8f8dc] text-[#560710] font-bold text-lg text-center lg:w-[180px] focus:w-[300px] transition-width duration-500">
      </div>
      <div>
        <input type="checkbox" v-model="loginStore.isRememberPassword"> 記住密碼
        <button @click="login"
          class="w-[100px] xl:h-12 lg:h-10 h-8 leading-[8px] text-center rounded-[20px] p-2 bg-[#cc191f] text-center cursor-pointer font-bold lg:w-[80px] hover:scale-[1.3] hover:w-[150px] transition-all duration-500 ml-5 hover:bg-[#ff4500] hover:text-blue-800">登入</button>
      </div>
      <p class="text-lg font-bold text-red-300">快速登入(測試時使用,實際使用會移除): </p>
      <div class="flex justify-between w-[300px]">
        <button
          class="border-2 border-black border-solid rounded-lg px-2 bg-blue-500 text-center font-bold text-red-200 text-lg lg:text-base hover:bg-blue-800 hover:scale-[1.1] active:bg-yellow-700"
          @click="quicklyLogin(1)">店長(管理員)</button>
        <button
          class="border-2 border-black border-solid rounded-lg px-2 bg-blue-500 text-center font-bold text-red-200 text-lg lg:text-base hover:bg-blue-800 hover:scale-[1.1] active:bg-yellow-700"
          @click="quicklyLogin(2)">值班經理</button>
        <button
          class="border-2 border-black border-solid rounded-lg px-2 bg-blue-500 text-center font-bold text-red-200 text-lg lg:text-base hover:bg-blue-800 hover:scale-[1.1] active:bg-yellow-700"
          @click="quicklyLogin(3)">工讀生</button>
      </div>
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

// 快速登入相關功能
const quicklyLogin = (num) => {
  if (num === 1) {
    loginStore.account = 'lemon'
    loginStore.password = 'lemon123'
    login()
  }
  if (num === 2) {
    loginStore.account = 'james'
    loginStore.password = 'james123'
    login()
  }
  if (num === 3) {
    loginStore.account = 'emily'
    loginStore.password = 'emily123'
    login()
  }

}

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