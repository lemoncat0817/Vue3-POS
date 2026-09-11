<template>
  <div class="w-full flex flex-col">
    <div class="flex items-center justify-between mb-2 px-1">
      <div class="flex items-center gap-2">
        <span
          class="text-xs font-black uppercase tracking-wider text-surface-500 dark:text-surface-400"
          >品項選單</span
        >
        <span
          class="rounded-full bg-surface-100 dark:bg-surface-800 px-2 py-0.5 text-[11px] font-bold text-surface-600 dark:text-surface-300"
        >
          共 {{ currentProducts.length }} 品項
        </span>
      </div>
      <AppPagination
        v-if="pageCount > 1"
        :page="currentPage"
        :page-count="pageCount"
        :total="currentProducts.length"
        @update:page="handleCurrentChange"
      />
    </div>

    <div
      v-if="currentProducts.length === 0"
      class="flex flex-col items-center justify-center py-12 rounded-2xl border border-dashed border-surface-300 dark:border-surface-700 text-surface-400"
    >
      <span class="text-sm font-bold">請先點選上方分類以載入品項</span>
    </div>

    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
      <button
        v-for="item in sliceProducts"
        :key="item.id"
        type="button"
        class="group relative flex flex-col justify-between p-3 rounded-2xl border text-left transition-all duration-150 select-none shadow-sm cursor-pointer hover:shadow-md active:scale-95"
        :class="{
          'border-primary-500 bg-primary-50/90 dark:bg-primary-950/40 text-primary-900 dark:text-primary-100 ring-2 ring-primary-500/30 scale-[1.02]':
            item.name === fromSelection(catalogStore.selectedProduct)?.name,
          'border-surface-200 dark:border-surface-700/80 bg-white dark:bg-surface-800 text-surface-800 dark:text-surface-100 hover:border-surface-300 dark:hover:border-surface-600':
            item.name !== fromSelection(catalogStore.selectedProduct)?.name,
          'cursor-not-allowed opacity-40 pointer-events-none': isSoldOut(item)
        }"
        @click="changeItem(item)"
      >
        <div class="flex items-start justify-between w-full gap-1 mb-1.5">
          <span
            v-if="item.modifierGroupIds.length === 0"
            class="rounded-md bg-surface-100 dark:bg-surface-700/60 px-1.5 py-0.5 text-[9px] font-bold text-surface-500 dark:text-surface-400"
          >
            固定
          </span>
          <span
            v-else
            class="rounded-md bg-success-50 dark:bg-success-950/40 px-1.5 py-0.5 text-[9px] font-bold text-success-600 dark:text-success-400"
          >
            可客製
          </span>

          <span
            v-if="isSoldOut(item)"
            class="rounded-full bg-danger-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm"
            >缺貨</span
          >
        </div>

        <p
          class="text-xs lg:text-sm font-black tracking-tight leading-snug line-clamp-2 select-none mb-2"
        >
          {{ item.name }}
        </p>

        <div
          class="flex items-center justify-between mt-auto pt-1 border-t border-surface-100 dark:border-surface-700/50 w-full"
        >
          <span class="text-xs lg:text-sm font-black text-primary-600 dark:text-primary-400">
            NT$ {{ item.basePrice }}
          </span>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogStore } from '@/stores/catalog'
import type { Product } from '@/types'
import { fromSelection } from '@/utils/selection'
import AppPagination from '@/components/ui/AppPagination.vue'
const catalogStore = useCatalogStore()

const isSoldOut = (item: Product) => item.stock === 0

const changeItem = (item: Product) => {
  if (isSoldOut(item)) return
  catalogStore.selectedProduct = item
}

const currentProducts = computed(() => {
  if (!catalogStore.selectedCategoryId) return []
  return catalogStore.products.filter(
    (product) => String(product.categoryId) === catalogStore.selectedCategoryId
  )
})

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}
const currentPage = ref(1)
const sliceProducts = computed(() => {
  return currentProducts.value.slice((currentPage.value - 1) * 10, currentPage.value * 10)
})
const pageCount = computed(() => Math.max(Math.ceil(currentProducts.value.length / 10), 1))
</script>
