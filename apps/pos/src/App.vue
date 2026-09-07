<template>
  <RouterView />
</template>


<script setup lang="ts">
import { onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { usePageStore } from '@/stores/page'

// D-07 修復：還原上次瀏覽頁籤的導航副作用，從 stores/page.ts 移到這裡
// ——App.vue 是應用程式的根元件，一定會掛載，行為不再取決於「哪個
// 元件第一次用到 pageStore」。
const router = useRouter()
const pageStore = usePageStore()
onMounted(() => {
  nextTick(() => {
    if (pageStore.currentPage === 0) {
      router.push('/home')
    }
    if (pageStore.currentPage === 1) {
      router.push('/order')
    }
  })
})
</script>

<style scoped></style>
