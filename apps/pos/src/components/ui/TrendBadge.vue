<template>
  <span
    v-if="trend"
    class="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-bold"
    :class="trend.up
      ? 'bg-success-50 text-success-600 dark:bg-success-950/50 dark:text-success-400'
      : 'bg-danger-50 text-danger-600 dark:bg-danger-950/50 dark:text-danger-400'">
    <component :is="trend.up ? ArrowUp : ArrowDown" class="h-3 w-3" />
    {{ Math.abs(trend.pct) }}%
  </span>
</template>

<script setup lang="ts">
// UI-7（規劃書 §5.3「數據分析」）：KPI 卡「vs 前期」比較的共用徽章。
// trend 為 null 代表沒有前期資料可比（例如前期營業額是 0，除以 0 沒
// 意義），這時什麼都不畫，不是硬湊一個 0% 或 Infinity%。
import { ArrowDown, ArrowUp } from 'lucide-vue-next'

defineProps<{ trend: { pct: number; up: boolean } | null }>()
</script>
