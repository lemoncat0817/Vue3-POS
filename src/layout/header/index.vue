<template>
  <div class="w-screen h-20 bg-red-500 flex justify-center items-center ">
    <img src="@/assets/logo.png" alt="logo"
      class="w-16 h-4/5 rounded-lg mr-5 border-2 border-black border-solid hover:animate-spin">
    <div @click="changePage(0)"
      class="border-2 border-black border-solid rounded-xl px-1 mx-2 bg-red-600 cursor-pointer select-none"
      :class="{ 'bg-yellow-500 scale-[1.2]': router.currentRoute.value.path === '/home' }">
      <p class="text-white font-bold md:text-2xl sm:text-lg text-md">點餐</p>
    </div>
    <div @click="changePage(1)"
      class="border-2 border-black border-solid rounded-xl px-1 mx-2 bg-red-600 cursor-pointer select-none"
      :class="{ 'bg-yellow-500 scale-[1.2]': router.currentRoute.value.path === '/order' }">
      <p class=" text-white font-bold md:text-2xl sm:text-lg text-md">查看訂單</p>
    </div>
    <div @click="changePage(2)"
      class="border-2 border-black border-solid rounded-xl px-1 mx-2 bg-red-600 cursor-pointer select-none"
      :class="{ 'bg-yellow-500 scale-[1.2]': router.currentRoute.value.path === '/backgroundSetting' }">
      <p class=" text-white font-bold md:text-2xl sm:text-lg text-md">後台設定</p>
    </div>
    <div @click="changePage(3)"
      class="border-2 border-black border-solid rounded-xl px-1 mx-2 bg-red-600 cursor-pointer select-none"
      :class="{ 'bg-yellow-500 scale-[1.2]': router.currentRoute.value.path === '/dataAnalysis' }">
      <p class=" text-white font-bold md:text-2xl sm:text-lg text-md">數據分析</p>
    </div>
    <div @click="changePage(4)"
      class="border-2 border-black border-solid rounded-xl px-1 mx-2 bg-red-600 cursor-pointer select-none"
      :class="{ 'bg-yellow-500 scale-[1.2]': router.currentRoute.value.path === '/authorityManagement' }">
      <p class=" text-white font-bold md:text-2xl sm:text-lg text-md">權限管理</p>
    </div>
    <div @click="logout"
      class="border-2 border-black border-solid rounded-xl px-1 mx-2 bg-red-600 cursor-pointer select-none active:bg-yellow-400">
      <p class=" text-white font-bold md:text-2xl sm:text-lg text-md">登出</p>
    </div>
  </div>
</template>

<script setup>
import { useDrinkStore } from '@/stores/drink'
const drinkStore = useDrinkStore()
import { usePageStore } from '@/stores/page'
const pageStore = usePageStore()
import { useLoginStore } from '@/stores/login'
const loginStore = useLoginStore()
import { useRouter } from "vue-router"
const router = useRouter()
import { ElMessageBox, ElMessage } from 'element-plus';

// 切換頁面
const changePage = (page) => {
  if (page === 0) {
    pageStore.currentPage = page
    router.push('/home')
  }
  if (page === 1) {
    pageStore.currentPage = page
    router.push('/order')
  }
  if (page === 2) {
    if (drinkStore.drinkNotPay.length != 0) {
      ElMessageBox.confirm('前往後台設定頁面後將清空點餐頁面,是否要前往後台設定頁面?, ', '警告', {
        confirmButtonText: '確定前往',
        cancelButtonText: '取消前往',
        type: 'warning',
      })
        .then(() => {
          pageStore.currentPage = page
          drinkStore.drinkNotPay = []
          router.push('/backgroundSetting')
        })
        .catch(() => {
          ElMessage.error('取消前往後台設定頁面')
          return
        })
    } else {
      router.push('/backgroundSetting')
      pageStore.currentPage = page
    }
  }
  if (page === 3) {
    pageStore.currentPage = page
    router.push('/dataAnalysis')
  }
  if (page === 4) {
    pageStore.currentPage = page
    router.push('/authorityManagement')
  }
}

// 登出
const logout = () => {
  ElMessageBox.confirm('是否要登出? ', '警告', {
    confirmButtonText: '登出',
    cancelButtonText: '取消登出',
    type: 'warning',
  })
    .then(() => {
      router.push('/login')
      loginStore.isLogin = false
      loginStore.userInfo = []
      if (loginStore.isRememberPassword === false) {
        loginStore.password = ''
      }
      ElMessage({
        type: 'success',
        message: '登出成功',
      })
    })
    .catch(() => {
      ElMessage({
        type: 'error',
        message: '操作取消',
      })
    })
}
</script>

<style lang="scss" scoped></style>