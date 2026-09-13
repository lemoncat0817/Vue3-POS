<template>
  <div>
    <div ref="chartRef" class="w-full" :style="{ height: chartHeight }" />
    <p v-if="!items.length" class="text-xs text-surface-400 py-4 text-center">{{ emptyLabel }}</p>
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useTheme } from '@/composables/useTheme'

echarts.use([BarChart, GridComponent, TooltipComponent, CanvasRenderer])

const props = withDefaults(
  defineProps<{
    items: { name: string; count: number }[]
    unit: string
    color?: string
    emptyLabel: string
  }>(),
  { color: '#0ea5e9' }
)

const { theme } = useTheme()
const isDark = computed(() => theme.value === 'dark')

const chartRef = ref<HTMLDivElement>()
let chartInstance: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

const chartHeight = computed(() => `${Math.max(props.items.length, 1) * 34 + 16}px`)

const buildOption = () => {
  const sorted = [...props.items].sort((a, b) => a.count - b.count)
  const textColor = isDark.value ? '#cbd5e1' : '#475569'
  const subtextColor = isDark.value ? '#64748b' : '#94a3b8'
  return {
    grid: { left: 8, right: 36, top: 4, bottom: 4, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: isDark.value ? '#1e293b' : '#ffffff',
      borderColor: isDark.value ? '#334155' : '#e2e8f0',
      textStyle: { color: textColor },
      formatter: (params: unknown) => {
        const [point] = params as { name: string; value: number }[]
        return point
          ? `${point.name}<br/><span style="font-weight:bold;">${point.value.toLocaleString()} ${props.unit}</span>`
          : ''
      }
    },
    xAxis: { type: 'value', show: false },
    yAxis: {
      type: 'category',
      data: sorted.map((item) => item.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: textColor, fontSize: 12, fontWeight: 'bold' }
    },
    series: [
      {
        type: 'bar',
        data: sorted.map((item) => item.count),
        barMaxWidth: 18,
        itemStyle: { color: props.color, borderRadius: [0, 4, 4, 0] },
        label: {
          show: true,
          position: 'right',
          color: subtextColor,
          fontSize: 11,
          fontWeight: 'bold',
          formatter: (p: { value: number }) => p.value.toLocaleString()
        }
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
