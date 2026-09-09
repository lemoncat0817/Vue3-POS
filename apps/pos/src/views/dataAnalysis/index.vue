<template>
  <div class="w-full flex flex-col items-center px-4 py-6 bg-surface-50/50 dark:bg-surface-950">
    <div class="w-full max-w-7xl flex flex-col gap-6">

      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-surface-900 p-4 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm">
        <div>
          <h1 class="text-2xl lg:text-3xl font-black text-surface-900 dark:text-surface-100 tracking-tight">營業數據分析</h1>
          <p class="text-xs text-surface-500 dark:text-surface-400 mt-1">
            統計期間：{{ selectTime[0] }} 至 {{ selectTime[1] }} · 即時掌握門市營收與銷售趨勢
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <div class="flex rounded-xl bg-surface-100 dark:bg-surface-800 p-0.5 text-xs font-bold">
            <button
              type="button"
              class="rounded-lg px-2.5 py-1.5 transition-all select-none"
              :class="isPresetActive('today') ? 'bg-white dark:bg-surface-900 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-surface-600 dark:text-surface-400 hover:text-surface-900'"
              @click="setDatePreset('today')">今日</button>
            <button
              type="button"
              class="rounded-lg px-2.5 py-1.5 transition-all select-none"
              :class="isPresetActive('yesterday') ? 'bg-white dark:bg-surface-900 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-surface-600 dark:text-surface-400 hover:text-surface-900'"
              @click="setDatePreset('yesterday')">昨日</button>
            <button
              type="button"
              class="rounded-lg px-2.5 py-1.5 transition-all select-none"
              :class="isPresetActive('week') ? 'bg-white dark:bg-surface-900 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-surface-600 dark:text-surface-400 hover:text-surface-900'"
              @click="setDatePreset('week')">近 7 天</button>
            <button
              type="button"
              class="rounded-lg px-2.5 py-1.5 transition-all select-none"
              :class="isPresetActive('month') ? 'bg-white dark:bg-surface-900 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-surface-600 dark:text-surface-400 hover:text-surface-900'"
              @click="setDatePreset('month')">本月</button>
          </div>

          <!-- 勿調整 aria-label 與型別轉換，供 e2e 測試定位 -->
          <div class="flex items-center gap-1.5 bg-surface-50 dark:bg-surface-800/80 px-2 py-1 rounded-xl border border-surface-200 dark:border-surface-700">
            <Calendar class="h-3.5 w-3.5 text-surface-400 shrink-0" />
            <input
              type="date" aria-label="開始時間" :value="toNativeDate(selectTime[0])"
              class="bg-transparent text-xs font-bold text-surface-900 dark:text-surface-100 outline-none"
              @change="(e) => selectTime = [fromNativeDate((e.target as HTMLInputElement).value), selectTime[1]]">
            <span class="text-xs font-bold text-surface-400">~</span>
            <input
              type="date" aria-label="結束時間" :value="toNativeDate(selectTime[1])"
              class="bg-transparent text-xs font-bold text-surface-900 dark:text-surface-100 outline-none"
              @change="(e) => selectTime = [selectTime[0], fromNativeDate((e.target as HTMLInputElement).value)]">
          </div>

          <button
            type="button"
            class="flex items-center gap-1 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-1.5 text-xs font-bold text-surface-700 dark:text-surface-200 hover:bg-surface-50 shadow-sm transition-colors"
            @click="exportCsv">
            <Download class="h-3.5 w-3.5" />
            <span>匯出 CSV</span>
          </button>
          <button
            type="button"
            class="flex items-center gap-1 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-1.5 text-xs font-bold text-surface-700 dark:text-surface-200 hover:bg-surface-50 shadow-sm transition-colors"
            @click="dialogSettlement = true">
            <Printer class="h-3.5 w-3.5" />
            <span>日結單</span>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <span class="text-xs font-bold text-surface-500 dark:text-surface-400">總營業額 GROSS SALES</span>
          <div class="mt-3 flex items-baseline gap-2 flex-wrap">
            <span class="text-2xl lg:text-3xl font-black text-surface-900 dark:text-surface-50 font-mono tracking-tight">
              NT$ {{ totalRevenue.toLocaleString() }}
            </span>
            <TrendBadge :trend="revenueTrend" />
          </div>
          <p v-if="peakHourInfo" class="text-[11px] font-medium text-success-600 dark:text-success-400 mt-1 flex items-center gap-1">
            <Flame class="h-3 w-3" /> 尖峰時段：{{ peakHourInfo }}
          </p>
          <p v-else class="text-[11px] text-surface-400 mt-1">
            {{ previousSalesReport ? `vs 前期（${previousPeriod[0]}${previousPeriod[0] === previousPeriod[1] ? '' : ' ~ ' + previousPeriod[1]}）` : '跨日區間累計總營收' }}
          </p>
        </div>

        <div class="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4 shadow-sm flex flex-col justify-between">
          <span class="text-xs font-bold text-surface-500 dark:text-surface-400">熱銷品項總量</span>
          <div class="mt-3 flex items-baseline gap-2 flex-wrap">
            <span class="text-2xl lg:text-3xl font-black text-surface-900 dark:text-surface-50 font-mono tracking-tight">
              {{ totalUnits.toLocaleString() }} <span class="text-sm font-bold text-surface-500">件</span>
            </span>
            <TrendBadge :trend="unitsTrend" />
          </div>
          <p class="text-[11px] text-surface-400 mt-1">
            榜首：{{ salesReport?.topProducts[0]?.name || '暫無資料' }}（{{ salesReport?.topProducts[0]?.count || 0 }} 件）
          </p>
        </div>

        <div class="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4 shadow-sm flex flex-col justify-between">
          <span class="text-xs font-bold text-surface-500 dark:text-surface-400">完成交易筆數</span>
          <div class="mt-3 flex items-baseline gap-2 flex-wrap">
            <span class="text-2xl lg:text-3xl font-black text-surface-900 dark:text-surface-50 font-mono tracking-tight">
              {{ totalOrders.toLocaleString() }} <span class="text-sm font-bold text-surface-500">筆</span>
            </span>
            <TrendBadge :trend="ordersTrend" />
          </div>
          <p class="text-[11px] text-surface-400 mt-1">
            以多元支付管道累計結算
          </p>
        </div>

        <div class="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4 shadow-sm flex flex-col justify-between">
          <span class="text-xs font-bold text-surface-500 dark:text-surface-400">平均客單價 (AOV)</span>
          <div class="mt-3 flex items-baseline gap-2 flex-wrap">
            <span class="text-2xl lg:text-3xl font-black text-surface-900 dark:text-surface-50 font-mono tracking-tight">
              NT$ {{ averageOrderValue.toLocaleString() }}
            </span>
            <TrendBadge :trend="aovTrend" />
          </div>
          <p class="text-[11px] text-surface-400 mt-1">
            每筆訂單平均消費額
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4 shadow-sm flex flex-col justify-between">
          <span class="text-xs font-bold text-surface-500 dark:text-surface-400">折扣金額 (優惠券折抵)</span>
          <div class="mt-2 flex items-baseline gap-2 flex-wrap">
            <span class="text-xl font-black text-surface-900 dark:text-surface-50 font-mono tracking-tight">
              NT$ {{ discountAmount.toLocaleString() }}
            </span>
            <span class="text-[11px] font-bold text-accent-600 dark:text-accent-400">折扣率 {{ discountRate }}%</span>
          </div>
        </div>

        <div class="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4 shadow-sm flex flex-col justify-between">
          <span class="text-xs font-bold text-surface-500 dark:text-surface-400">作廢訂單</span>
          <div class="mt-2 flex items-baseline gap-2 flex-wrap">
            <span class="text-xl font-black text-surface-900 dark:text-surface-50 font-mono tracking-tight">
              {{ voidedOrderCount.toLocaleString() }} <span class="text-sm font-bold text-surface-500">筆</span>
            </span>
            <span
              class="text-[11px] font-bold"
              :class="voidRate > 5 ? 'text-danger-600 dark:text-danger-400' : 'text-surface-400'">
              作廢率 {{ voidRate }}%
            </span>
          </div>
        </div>

        <div class="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4 shadow-sm flex flex-col justify-between">
          <span class="text-xs font-bold text-surface-500 dark:text-surface-400">退款</span>
          <div class="mt-2 flex items-baseline gap-2 flex-wrap">
            <span class="text-xl font-black text-surface-900 dark:text-surface-50 font-mono tracking-tight">
              NT$ {{ refundAmount.toLocaleString() }}
            </span>
            <span class="text-[11px] font-bold text-surface-400">{{ refundedOrderCount }} 筆訂單有退款</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div class="xl:col-span-8 card-panel p-5 flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-black text-surface-900 dark:text-surface-100">
              {{ selectTime[0] === selectTime[1] ? `${selectTime[0]} 時段營業額動態` : `${selectTime[0]} ~ ${selectTime[1]} 每日營業額趨勢` }}
            </h2>
            <span class="text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 px-2.5 py-1 rounded-full">
              累計: NT$ {{ totalRevenue.toLocaleString() }}
            </span>
          </div>

          <!-- 圖表高度改用 clamp()：隨視窗高度縮放，不再是不管視窗多矮
               都佔滿 500px、把下方內容全部擠出首屏之外的固定值。 -->
          <div ref="businessChartRef" class="w-full h-[clamp(260px,38vh,460px)]" />
        </div>

        <div class="xl:col-span-4 card-panel p-4 flex flex-col gap-3">
          <span class="text-sm font-black text-surface-900 dark:text-surface-100">熱銷品項排行榜 (Top 5)</span>
          <RankedBarChart :items="salesReport?.topProducts ?? []" unit="件" color="#ef4444" empty-label="目前無銷售紀錄" />
        </div>

        <div class="xl:col-span-4 card-panel p-4 flex flex-col gap-3">
          <span class="text-sm font-black text-surface-900 dark:text-surface-100">分類別銷售佔比 (Top 5)</span>
          <RankedBarChart :items="salesReport?.topCategories ?? []" unit="件" color="#f59e0b" empty-label="目前無分類銷售紀錄" />
        </div>

        <div class="xl:col-span-4 card-panel p-4 flex flex-col gap-3">
          <span class="text-sm font-black text-surface-900 dark:text-surface-100">加購選配榜單 (Top 5)</span>
          <RankedBarChart :items="salesReport?.topAddOns ?? []" unit="份" color="#10b981" empty-label="目前無加購紀錄" />
        </div>

        <div class="xl:col-span-8 card-panel p-4 flex flex-col gap-3">
          <span class="text-sm font-black text-surface-900 dark:text-surface-100">多元支付通路結構 (Top 5)</span>
          <RankedBarChart :items="salesReport?.topPaymentMethods ?? []" unit="次交易" color="#0ea5e9" empty-label="目前無付款紀錄" />
        </div>

        <div class="xl:col-span-4 card-panel p-4 flex flex-col gap-3">
          <span class="text-sm font-black text-surface-900 dark:text-surface-100">內用／外帶佔比</span>
          <ChannelDonutChart :items="salesReport?.channelBreakdown ?? []" />
        </div>
      </div>
    </div>

    <ModalDialog v-model:open="dialogSettlement" title="日結營運清單預覽">
      <div class="flex flex-col gap-3 text-xs text-surface-700 dark:text-surface-200 p-2 font-mono">
        <div class="text-center border-b border-surface-200 dark:border-surface-700 pb-2">
          <p class="text-base font-black">POS 收銀日結單</p>
          <p class="text-surface-400">列印時間: {{ selectTime[0] }} {{ getTime() }}</p>
          <p class="text-surface-400">機台: A機 (旗艦總店)</p>
        </div>
        <div class="flex justify-between py-1 border-b border-surface-100 dark:border-surface-800">
          <span>統計期間:</span>
          <span class="font-bold">{{ selectTime[0] }} ~ {{ selectTime[1] }}</span>
        </div>
        <div class="flex justify-between py-1 border-b border-surface-100 dark:border-surface-800">
          <span>總營業額 (Gross):</span>
          <span class="font-black text-sm text-primary-600">NT$ {{ totalRevenue.toLocaleString() }}</span>
        </div>
        <div class="flex justify-between py-1 border-b border-surface-100 dark:border-surface-800">
          <span>完成交易單數:</span>
          <span class="font-bold">{{ totalOrders }} 筆</span>
        </div>
        <div class="flex justify-between py-1 border-b border-surface-100 dark:border-surface-800">
          <span>平均客單價 (AOV):</span>
          <span class="font-bold">NT$ {{ averageOrderValue }}</span>
        </div>
        <div class="flex justify-between py-1 border-b border-surface-100 dark:border-surface-800">
          <span>熱銷品項總量 (Top 5):</span>
          <span class="font-bold">{{ totalUnits }} 件</span>
        </div>
        <div class="flex justify-between py-1 border-b border-surface-100 dark:border-surface-800">
          <span>折扣總額 (優惠券折抵):</span>
          <span class="font-bold">NT$ {{ discountAmount.toLocaleString() }}</span>
        </div>
        <div class="flex justify-between py-1 border-b border-surface-100 dark:border-surface-800">
          <span>作廢訂單 / 退款:</span>
          <span class="font-bold">{{ voidedOrderCount }} 筆作廢 · NT$ {{ refundAmount.toLocaleString() }} 退款</span>
        </div>

        <div class="mt-2">
          <p class="font-bold mb-1">支付管道結算：</p>
          <div v-for="p in salesReport?.topPaymentMethods" :key="p.name" class="flex justify-between text-surface-500 py-0.5">
            <span>{{ p.name }}</span>
            <span>{{ p.count }} 次</span>
          </div>
        </div>

        <div class="mt-4 flex justify-end gap-2 border-t border-surface-200 dark:border-surface-700 pt-3">
          <button
            type="button" class="rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-xs font-bold"
            @click="dialogSettlement = false">關閉</button>
          <button
            type="button" class="rounded-lg bg-primary-600 px-4 py-2 text-xs font-bold text-white shadow-sm"
            @click="handlePrintSettlement">模擬列印</button>
        </div>
      </div>
    </ModalDialog>
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TitleComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { ref, watch, nextTick, computed, onMounted, onUnmounted } from 'vue'
import { Calendar, Download, Printer, Flame } from 'lucide-vue-next'

echarts.use([LineChart, GridComponent, LegendComponent, TitleComponent, TooltipComponent, CanvasRenderer])
import { useQuery } from '@tanstack/vue-query'
import { getDate, getTime, formatBusinessDate, toBusinessDate, toNativeDate, fromNativeDate } from '@/utils/time'
import { fetchSalesReport } from '@/api/reports'
import ModalDialog from '@/components/ui/ModalDialog.vue'
import TrendBadge from '@/components/ui/TrendBadge.vue'
import RankedBarChart from '@/components/ui/RankedBarChart.vue'
import ChannelDonutChart from '@/components/ui/ChannelDonutChart.vue'
import { showToast } from '@/composables/useToast'
import { useTheme } from '@/composables/useTheme'

const { theme } = useTheme()
const dialogSettlement = ref(false)

const selectTime = ref<[string, string]>([getDate(), getDate()])

function formatSlashDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}/${m}/${day}`
}
function parseSlashDate(s: string): Date {
  const [y, m, d] = s.split('/').map(Number)
  return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1)
}

const { data: salesReport } = useQuery({
  queryKey: computed(() => ['salesReport', selectTime.value[0], selectTime.value[1]] as const),
  queryFn: () => fetchSalesReport(toBusinessDate(selectTime.value[0]), toBusinessDate(selectTime.value[1])),
})

// 計算緊鄰前一段等長區間作為比較基準，複用 sales report API。
const previousPeriod = computed<[string, string]>(() => {
  const start = parseSlashDate(selectTime.value[0])
  const end = parseSlashDate(selectTime.value[1])
  const spanDays = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1
  const prevEnd = new Date(start)
  prevEnd.setDate(prevEnd.getDate() - 1)
  const prevStart = new Date(prevEnd)
  prevStart.setDate(prevStart.getDate() - (spanDays - 1))
  return [formatSlashDate(prevStart), formatSlashDate(prevEnd)]
})
const { data: previousSalesReport } = useQuery({
  queryKey: computed(() => ['salesReport', previousPeriod.value[0], previousPeriod.value[1]] as const),
  queryFn: () => fetchSalesReport(toBusinessDate(previousPeriod.value[0]), toBusinessDate(previousPeriod.value[1])),
})

// 當期與前期共用相同的 KPI 計算邏輯。
function computeTotals(report: typeof salesReport.value, singleDay: boolean) {
  if (!report) return { totalRevenue: 0, totalUnits: 0, totalOrders: 0, averageOrderValue: 0 }
  const totalRevenue = singleDay
    ? report.hourlyRevenue.reduce((sum, p) => sum + p.revenue, 0)
    : report.dailyRevenue.reduce((sum, p) => sum + p.revenue, 0)
  const totalUnits = report.topProducts.reduce((sum, d) => sum + d.count, 0)
  // 訂單數用後端算好的 orderCount，不是加總 topPaymentMethods——那份榜單
  // 只列前五名付款方式，付款方式一多（門市有 9 種）就會少算訂單數與客單價。
  const totalOrders = report.orderCount
  const averageOrderValue = totalOrders === 0 ? 0 : Math.round(totalRevenue / totalOrders)
  return { totalRevenue, totalUnits, totalOrders, averageOrderValue }
}
const isSingleDay = computed(() => selectTime.value[0] === selectTime.value[1])
const current = computed(() => computeTotals(salesReport.value, isSingleDay.value))
const previous = computed(() => computeTotals(previousSalesReport.value, previousPeriod.value[0] === previousPeriod.value[1]))

const totalRevenue = computed(() => current.value.totalRevenue)
const totalUnits = computed(() => current.value.totalUnits)
const totalOrders = computed(() => current.value.totalOrders)
const averageOrderValue = computed(() => current.value.averageOrderValue)

// 計算前期變動率，前期為 0 時回傳 null 避免除以零。
function trendOf(currentValue: number, previousValue: number): { pct: number; up: boolean } | null {
  if (!previousSalesReport.value || previousValue === 0) return null
  const pct = Math.round(((currentValue - previousValue) / previousValue) * 100)
  return { pct, up: pct >= 0 }
}
const revenueTrend = computed(() => trendOf(current.value.totalRevenue, previous.value.totalRevenue))
const unitsTrend = computed(() => trendOf(current.value.totalUnits, previous.value.totalUnits))
const ordersTrend = computed(() => trendOf(current.value.totalOrders, previous.value.totalOrders))
const aovTrend = computed(() => trendOf(current.value.averageOrderValue, previous.value.averageOrderValue))

// 折扣、作廢、退款：只看當期，不比對前期（跟業界慣例一樣，異常率是拿來看
// 現況高不高，不是拿來看漲跌）。四捨五入到小數點下一位。
const roundRate = (numerator: number, denominator: number) =>
  denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : 0

const discountAmount = computed(() => salesReport.value?.discountAmount ?? 0)
// 折扣率的分母是折扣前毛額（淨營收 + 折扣金額），不是淨營收本身。
const discountRate = computed(() => roundRate(discountAmount.value, totalRevenue.value + discountAmount.value))

const voidedOrderCount = computed(() => salesReport.value?.voidedOrderCount ?? 0)
const voidRate = computed(() => roundRate(voidedOrderCount.value, voidedOrderCount.value + totalOrders.value))

const refundedOrderCount = computed(() => salesReport.value?.refundedOrderCount ?? 0)
const refundAmount = computed(() => salesReport.value?.refundAmount ?? 0)

const peakHourInfo = computed(() => {
  if (!salesReport.value || selectTime.value[0] !== selectTime.value[1]) return null
  const points = salesReport.value.hourlyRevenue
  if (!points || points.length === 0) return null
  const firstPoint = points[0]
  if (!firstPoint) return null
  let maxPoint = firstPoint
  for (const p of points) {
    if (p.revenue > maxPoint.revenue) maxPoint = p
  }
  if (maxPoint.revenue === 0) return null
  return `${String(maxPoint.hour).padStart(2, '0')}:00 (NT$ ${maxPoint.revenue.toLocaleString()})`
})

// 各頁籤對應的日期區間，setDatePreset／isPresetActive 共用同一份定義，
// 避免兩邊各算一次、改一邊忘了改另一邊。
function presetRange(preset: 'today' | 'yesterday' | 'week' | 'month'): [string, string] {
  const now = new Date()
  if (preset === 'today') {
    const t = formatSlashDate(now)
    return [t, t]
  }
  if (preset === 'yesterday') {
    const y = new Date(now)
    y.setDate(y.getDate() - 1)
    const yStr = formatSlashDate(y)
    return [yStr, yStr]
  }
  if (preset === 'week') {
    const w = new Date(now)
    w.setDate(w.getDate() - 6)
    return [formatSlashDate(w), formatSlashDate(now)]
  }
  const m = new Date(now.getFullYear(), now.getMonth(), 1)
  return [formatSlashDate(m), formatSlashDate(now)]
}

const setDatePreset = (preset: 'today' | 'yesterday' | 'week' | 'month') => {
  selectTime.value = presetRange(preset)
}

const isPresetActive = (preset: 'today' | 'yesterday' | 'week' | 'month') => {
  const [start, end] = presetRange(preset)
  return selectTime.value[0] === start && selectTime.value[1] === end
}

const exportCsv = () => {
  if (!salesReport.value) return
  let csv = 'data:text/csv;charset=utf-8,\uFEFF'
  csv += `POS 營運數據分析報表,期間: ${selectTime.value[0]} ~ ${selectTime.value[1]}\n\n`
  csv += `總營業額,${totalRevenue.value}\n`
  csv += `總訂單數,${totalOrders.value}\n`
  csv += `平均客單價,${averageOrderValue.value}\n`
  csv += `熱銷品項總量,${totalUnits.value}\n`
  csv += `折扣金額,${discountAmount.value}\n`
  csv += `折扣率,${discountRate.value}%\n`
  csv += `作廢訂單數,${voidedOrderCount.value}\n`
  csv += `作廢率,${voidRate.value}%\n`
  csv += `退款金額,${refundAmount.value}\n`
  csv += `退款訂單數,${refundedOrderCount.value}\n\n`

  csv += '--- 內用／外帶佔比 ---\n通路,訂單數,營業額\n'
  salesReport.value.channelBreakdown.forEach((c) => {
    csv += `${c.channel},${c.count},${c.revenue}\n`
  })

  csv += '\n--- 熱銷品項前五名 ---\n排名,品項名稱,銷售件數\n'
  salesReport.value.topProducts.forEach((d, i) => {
    csv += `${i + 1},${d.name},${d.count}\n`
  })

  csv += '\n--- 分類別銷售佔比 ---\n排名,分類名稱,銷售件數\n'
  salesReport.value.topCategories.forEach((c, i) => {
    csv += `${i + 1},${c.name},${c.count}\n`
  })

  csv += '\n--- 熱門加購選項前五名 ---\n排名,加購選項名稱,份數\n'
  salesReport.value.topAddOns.forEach((a, i) => {
    csv += `${i + 1},${a.name},${a.count}\n`
  })

  csv += '\n--- 常用付款方式 ---\n付款方式,交易次數\n'
  salesReport.value.topPaymentMethods.forEach((p) => {
    csv += `${p.name},${p.count}\n`
  })

  const link = document.createElement('a')
  link.setAttribute('href', encodeURI(csv))
  link.setAttribute('download', `POS_Report_${toBusinessDate(selectTime.value[0])}_${toBusinessDate(selectTime.value[1])}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  showToast('報表已成功匯出為 CSV', 'success')
}

const handlePrintSettlement = () => {
  showToast('日結單列印指令已發送至收銀出單機', 'success')
  dialogSettlement.value = false
}

const businessChartRef = ref<HTMLDivElement>()
let chartInstance: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

const isDark = computed(() => theme.value === 'dark')
const getTextColor = () => isDark.value ? '#cbd5e1' : '#475569'
const getSubtextColor = () => isDark.value ? '#64748b' : '#94a3b8'
const getSplitLineColor = () => isDark.value ? '#334155' : '#f1f5f9'

const getOneDayOption = () => {
  if (!salesReport.value) return {}
  return {
    title: {
      text: `${selectTime.value[0]} 各時段營業額動態 (Hourly Revenue)`,
      left: 'center',
      textStyle: { color: getTextColor(), fontSize: 16, fontWeight: 'bold' }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark.value ? '#1e293b' : '#ffffff',
      borderColor: isDark.value ? '#334155' : '#e2e8f0',
      textStyle: { color: getTextColor() },
      formatter: '{b}<br/><span style="color:#ef4444;font-weight:bold;">營業額: NT$ {c}</span>'
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: salesReport.value.hourlyRevenue.map(point => `${String(point.hour).padStart(2, '0')}:00`),
      axisLine: { lineStyle: { color: getSubtextColor() } },
      axisLabel: { color: getSubtextColor(), fontSize: 12, fontWeight: 'bold' }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: getSplitLineColor() } },
      axisLabel: {
        color: getSubtextColor(),
        fontSize: 12,
        fontWeight: 'bold',
        formatter: (val: number) => `$${val}`
      }
    },
    series: [
      {
        name: '營業額',
        type: 'line',
        smooth: true,
        showSymbol: true,
        symbolSize: 6,
        itemStyle: { color: '#ef4444' },
        lineStyle: { width: 3, color: '#ef4444' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(239, 68, 68, 0.45)' },
            { offset: 1, color: 'rgba(239, 68, 68, 0.02)' }
          ])
        },
        data: salesReport.value.hourlyRevenue.map(point => point.revenue),
      }
    ]
  }
}

const getRangeOption = () => {
  if (!salesReport.value) return {}
  return {
    title: {
      text: `${selectTime.value[0]} ~ ${selectTime.value[1]} 每日營業額趨勢 (Daily Revenue)`,
      left: 'center',
      textStyle: { color: getTextColor(), fontSize: 16, fontWeight: 'bold' }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark.value ? '#1e293b' : '#ffffff',
      borderColor: isDark.value ? '#334155' : '#e2e8f0',
      textStyle: { color: getTextColor() },
      formatter: '{b}<br/><span style="color:#ef4444;font-weight:bold;">營業額: NT$ {c}</span>'
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: salesReport.value.dailyRevenue.map(point => formatBusinessDate(point.businessDate)),
      axisLine: { lineStyle: { color: getSubtextColor() } },
      axisLabel: { color: getSubtextColor(), fontSize: 12, fontWeight: 'bold' }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: getSplitLineColor() } },
      axisLabel: {
        color: getSubtextColor(),
        fontSize: 12,
        fontWeight: 'bold',
        formatter: (val: number) => `$${val}`
      }
    },
    series: [
      {
        name: '營業額',
        type: 'line',
        smooth: true,
        itemStyle: { color: '#ef4444' },
        lineStyle: { width: 3, color: '#ef4444' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(239, 68, 68, 0.4)' },
            { offset: 1, color: 'rgba(239, 68, 68, 0.02)' }
          ])
        },
        data: salesReport.value.dailyRevenue.map(point => point.revenue),
      }
    ]
  }
}

const renderChart = () => {
  if (!salesReport.value || !businessChartRef.value) return
  if (!chartInstance) {
    chartInstance = echarts.init(businessChartRef.value)
  }
  const option = selectTime.value[0] === selectTime.value[1]
    ? getOneDayOption()
    : getRangeOption()

  chartInstance.setOption(option, true)
}

watch([salesReport, () => selectTime.value, isDark], () => {
  nextTick(() => {
    renderChart()
  })
}, { deep: true })

const handleResize = () => {
  chartInstance?.resize()
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  if (businessChartRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      chartInstance?.resize()
    })
    resizeObserver.observe(businessChartRef.value)
  }
  nextTick(() => {
    renderChart()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  resizeObserver?.disconnect()
  resizeObserver = null
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>