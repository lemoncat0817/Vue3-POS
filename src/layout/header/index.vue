<template>
  <div class="w-screen h-20 bg-red-500 flex justify-center items-center ">
    <div @click="changePage(0)"
      class="border-2 border-black border-solid rounded-xl px-1 mx-2 bg-red-600 cursor-pointer select-none"
      :class="{ 'bg-yellow-500 scale-[1.2]': pageStore.currentPage === 0 }">
      <p class="text-white font-bold text-2xl">點餐</p>
    </div>
    <div @click="changePage(1)"
      class="border-2 border-black border-solid rounded-xl px-1 mx-2 bg-red-600 cursor-pointer select-none"
      :class="{ 'bg-yellow-500 scale-[1.2]': pageStore.currentPage === 1 }">
      <p class=" text-white font-bold text-2xl">查看訂單</p>
    </div>
    <div @click="changePage(2)"
      class="border-2 border-black border-solid rounded-xl px-1 mx-2 bg-red-600 cursor-pointer select-none"
      :class="{ 'bg-yellow-500 scale-[1.2]': pageStore.currentPage === 2 }">
      <p class=" text-white font-bold text-2xl">後台設定</p>
    </div>
    <div @click="changePage(3)"
      class="border-2 border-black border-solid rounded-xl px-1 mx-2 bg-red-600 cursor-pointer select-none"
      :class="{ 'bg-yellow-500 scale-[1.2]': pageStore.currentPage === 3 }">
      <p class=" text-white font-bold text-2xl">數據分析</p>
    </div>
  </div>
</template>

<script setup>
import { useDrinkStore } from '@/stores/drink'
const drinkStore = useDrinkStore()
import { usePageStore } from '@/stores/page'
const pageStore = usePageStore()
import { useRouter } from "vue-router"
const router = useRouter()
import { ElMessageBox, ElMessage } from 'element-plus';

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
}
</script>

<style lang="scss" scoped></style>