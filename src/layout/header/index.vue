<template>
  <div class="w-screen h-20 bg-red-500 flex justify-center items-center">
    <div @click="changePage(0)"
      class="border-2 border-black border-solid rounded-xl px-1 mx-2 bg-red-600 cursor-pointer"
      :class="{ 'bg-yellow-500 scale-[1.2]': pageStore.currentPage === 0 }">
      <p class="text-white font-bold text-2xl">點餐</p>
    </div>
    <div @click="changePage(1)"
      class="border-2 border-black border-solid rounded-xl px-1 mx-2 bg-red-600 cursor-pointer"
      :class="{ 'bg-yellow-500 scale-[1.2]': pageStore.currentPage === 1 }">
      <p class=" text-white font-bold text-2xl">查看訂單</p>
    </div>
  </div>
</template>

<script setup>
import { usePageStore } from '@/stores/page'
const pageStore = usePageStore()
import { useRouter } from "vue-router"
const router = useRouter()

const changePage = (page) => {
  pageStore.currentPage = page
  if (page === 0) {
    router.push('/home')
  }
  if (page === 1) {
    router.push('/order')
  }
}
</script>

<style lang="scss" scoped></style>