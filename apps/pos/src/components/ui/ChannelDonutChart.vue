<template>
  <div>
    <div ref="chartRef" class="w-full h-[180px]" />
    <p v-if="!items.length" class="text-xs text-surface-400 py-4 text-center">目前無訂單紀錄</p>
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useTheme } from '@/composables/useTheme'
import type { ChannelBreakdown } from '@pos/contract'

echarts.use([PieChart, LegendComponent, TooltipComponent, CanvasRenderer])

const props = defineProps<{ items: ChannelBreakdown[] }>()

const { theme } = useTheme()
const isDark = computed(() => theme.value === 'dark')

const chartRef = ref<HTMLDivElement>()
let chartInstance: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

const CHANNEL_COLOR: Record<string, string> = { 內用: '#8b5cf6', 外帶: '#22c55e' }

const buildOption = () => {
  const textColor = isDark.value ? '#cbd5e1' : '#475569'
  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: isDark.value ? '#1e293b' : '#ffffff',
      borderColor: isDark.value ? '#334155' : '#e2e8f0',
      textStyle: { color: textColor },
      formatter: (p: { name: string; value: number; percent: number; data: { revenue: number } }) =>
        `${p.name}<br/>${p.value.toLocaleString()} 筆（${p.percent}%）<br/>NT$ ${p.data.revenue.toLocaleString()}`
    },
    legend: {
      bottom: 0,
      textStyle: { color: textColor, fontSize: 12, fontWeight: 'bold' }
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '44%'],
        label: { show: false },
        itemStyle: { borderColor: isDark.value ? '#0f172a' : '#ffffff', borderWidth: 2 },
        data: props.items.map((item) => ({
          name: item.channel,
          value: item.count,
          revenue: item.revenue,
          itemStyle: { color: CHANNEL_COLOR[item.channel] ?? '#94a3b8' }
        }))
      }
    ]
  }
}

const renderChart = () => {
  if (!chartRef.value || !props.items.length) return
  if (!chartInstance) chartInstance = echarts.init(chartRef.value)
  chartInstance.setOption(buildOption(), true)
}

watch([() => props.items, isDark], () => nextTick(renderChart), { deep: true })

onMounted(() => {
  if (chartRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => chartInstance?.resize())
    resizeObserver.observe(chartRef.value)
  }
  nextTick(renderChart)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  chartInstance?.dispose()
  chartInstance = null
})
</script>
