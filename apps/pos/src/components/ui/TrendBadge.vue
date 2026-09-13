<template>
  <span
    v-if="trend"
    class="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-bold"
    :class="
      trend.up
        ? 'bg-success-50 text-success-600 dark:bg-success-950/50 dark:text-success-400'
        : 'bg-danger-50 text-danger-600 dark:bg-danger-950/50 dark:text-danger-400'
    "
  >
    <component :is="trend.up ? ArrowUp : ArrowDown" class="h-3 w-3" />
    {{ Math.abs(trend.pct) }}%
  </span>
</template>

<script setup lang="ts">
import { ArrowDown, ArrowUp } from 'lucide-vue-next'

defineProps<{ trend: { pct: number; up: boolean } | null }>()
</script>
