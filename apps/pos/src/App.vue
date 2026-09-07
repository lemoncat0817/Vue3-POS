<template>
  <!-- P7（D-16）：全域中文語系原本靠 main.ts 的 `app.use(ElementPlus,
       {locale: zhTw})` 一次帶入，改成 on-demand 匯入元件後改用官方文件
       建議的 <el-config-provider> 包住整棵樹（見 main.ts 的說明）。 -->
  <el-config-provider :locale="zhTw">
    <RouterView />
  </el-config-provider>
</template>


<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import zhTw from 'element-plus/es/locale/lang/zh-tw'
import { useDrinkStore } from '@/stores/drink'
import { useDiscountStore } from '@/stores/discount'
import { fetchCatalog, toDrinkAddOnOptions, toDrinkTypeGroups } from '@/api/catalog'
import { fetchPromotions, toMoneyDiscounts, toOftenUseDiscountList, toPercentDiscounts } from '@/api/promotions'
import { useOrderSync } from '@/offline/useOrderSync'

// D-07／D-12 修復：還原上次瀏覽頁籤原本是這裡的 onMounted 副作用，靠
// App.vue 一定會掛載這件事來保證會執行。P7 把這段邏輯改成直接掛在
// router.beforeEach 本身（見 router/index.ts）——導航守衛本來就保證
//「每一次導航都會跑」，比「根元件的 onMounted」更直接、也不用再繞經
// pageStore 這個中介狀態去手動同步 vue-router 自己已經知道的路由。

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

// P5：促銷資料（現金／折數折價券、常用折扣）同步，跟菜單同步採同一套
// 邏輯（見 stores/discount.ts 的 promotionSource 說明）。
const discountStore = useDiscountStore()
const { data: promotions } = useQuery({
  queryKey: ['promotions'],
  queryFn: fetchPromotions,
  staleTime: Infinity,
  retry: 1,
})
watch(promotions, (value) => {
  if (!value) return
  discountStore.hydratePromotionsFromServer({
    moneyDiscount: toMoneyDiscounts(value),
    percentDiscount: toPercentDiscounts(value),
    oftenUseDiscount: toOftenUseDiscountList(value),
  })
})

// P3：離線送單佇列的背景同步（見 src/offline/sync-worker.ts）。App.vue
// 是根元件，一定會掛載，適合當成常駐同步的啟動點，不綁定在點餐頁——
// 就算使用者切到訂單列表或後台頁，佇列裡等待中的訂單也要繼續同步。
const orderSync = useOrderSync()
onMounted(() => {
  orderSync.start()
})
onUnmounted(() => {
  orderSync.stop()
})
</script>

<style scoped></style>
