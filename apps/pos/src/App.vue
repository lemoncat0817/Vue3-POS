<template>
  <RouterView />
</template>


<script setup lang="ts">
import { onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { usePageStore } from '@/stores/page'
import { useDrinkStore } from '@/stores/drink'
import { fetchCatalog, toDrinkAddOnOptions, toDrinkTypeGroups } from '@/api/catalog'

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

// P3：App.vue 是根元件，一定會掛載，適合當成「啟動時嘗試同步一次菜單」
// 的單一進入點（GET /api/catalog 不需要登入即可呼叫）。staleTime:
// Infinity + retry: 1——連不到伺服端（離線、還沒部署後端）時不用一直重
// 試干擾使用者，失敗就直接留著 drinkStore 既有的資料（種子資料或上次
// 同步過的本機資料，見 stores/drink.ts 的 catalogSource 說明）。
const drinkStore = useDrinkStore()
const { data: catalog } = useQuery({
  queryKey: ['catalog'],
  queryFn: fetchCatalog,
  staleTime: Infinity,
  retry: 1,
})
watch(catalog, (value) => {
  if (!value) return
  drinkStore.hydrateCatalogFromServer({
    groups: toDrinkTypeGroups(value),
    addOns: toDrinkAddOnOptions(value),
  })
})
</script>

<style scoped></style>
