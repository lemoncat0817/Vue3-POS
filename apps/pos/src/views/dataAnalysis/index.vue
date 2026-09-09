<template>
  <div class="w-full flex flex-col items-center px-4 py-6 bg-surface-50/50 dark:bg-surface-950">
    <div class="w-full max-w-7xl flex flex-col gap-6">

      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-surface-900 p-4 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm">
        <div>
          <div class="flex items-center gap-2.5">
            <h1 class="text-2xl lg:text-3xl font-black text-surface-900 dark:text-surface-100 tracking-tight">營業數據分析</h1>
            <span class="rounded-full bg-primary-50 dark:bg-primary-950/50 px-2.5 py-0.5 text-xs font-bold text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800">
              營運報表
            </span>
          </div>
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
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-surface-500 dark:text-surface-400">總營業額 GROSS SALES</span>
            <div class="h-8 w-8 rounded-xl bg-primary-50 dark:bg-primary-950/60 flex items-center justify-center text-primary-600 dark:text-primary-400">
              <DollarSign class="h-4 w-4" />
            </div>
          </div>
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
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-surface-500 dark:text-surface-400">熱門榜出杯總量</span>
            <div class="h-8 w-8 rounded-xl bg-accent-50 dark:bg-accent-950/60 flex items-center justify-center text-accent-600 dark:text-accent-400">
              <Coffee class="h-4 w-4" />
            </div>
          </div>
          <div class="mt-3 flex items-baseline gap-2 flex-wrap">
            <span class="text-2xl lg:text-3xl font-black text-surface-900 dark:text-surface-50 font-mono tracking-tight">
              {{ totalCups.toLocaleString() }} <span class="text-sm font-bold text-surface-500">杯</span>
            </span>
            <TrendBadge :trend="cupsTrend" />
          </div>
          <p class="text-[11px] text-surface-400 mt-1">
            榜首：{{ salesReport?.topDrinks[0]?.name || '暫無資料' }} ({{ salesReport?.topDrinks[0]?.count || 0 }}杯)
          </p>
        </div>

        <div class="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-surface-500 dark:text-surface-400">完成交易筆數</span>
            <div class="h-8 w-8 rounded-xl bg-success-50 dark:bg-success-950/60 flex items-center justify-center text-success-600 dark:text-success-400">
              <ShoppingBag class="h-4 w-4" />
            </div>
          </div>
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
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-surface-500 dark:text-surface-400">平均客單價 (AOV)</span>
            <div class="h-8 w-8 rounded-xl bg-info-50 dark:bg-info-950/60 flex items-center justify-center text-info-600 dark:text-info-400">
              <TrendingUp class="h-4 w-4" />
            </div>
          </div>
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

      <div class="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div class="xl:col-span-8 card-panel p-5 flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-black text-surface-900 dark:text-surface-100 flex items-center gap-2">
              <TrendingUp class="h-4 w-4 text-primary-600" />
              <span>{{ selectTime[0] === selectTime[1] ? `${selectTime[0]} 時段營業額動態` : `${selectTime[0]} ~ ${selectTime[1]} 每日營業額趨勢` }}</span>
            </h2>
            <span class="text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 px-2.5 py-1 rounded-full">
              累計: NT$ {{ totalRevenue.toLocaleString() }}
            </span>
          </div>

          <!-- 圖表高度改用 clamp()：隨視窗高度縮放，不再是不管視窗多矮
               都佔滿 500px、把下方內容全部擠出首屏之外的固定值。 -->
          <div v-if="selectTime[0] === selectTime[1]" ref="oneDayBusiness" class="w-full h-[clamp(260px,38vh,460px)]" />
          <div v-else ref="rangeBusiness" class="w-full h-[clamp(260px,38vh,460px)]" />
        </div>

        <div class="xl:col-span-4 card-panel p-4 flex flex-col gap-3">
          <span class="text-sm font-black text-surface-900 dark:text-surface-100">熱門飲品排行榜 (Top 5)</span>
          <div v-for="(item, idx) in salesReport?.topDrinks" :key="item.name" class="flex flex-col gap-1">
            <div class="flex justify-between text-xs font-bold">
              <span class="flex items-center gap-2">
                <span
                  class="h-5 w-5 rounded-full flex items-center justify-center text-[10px] text-white font-black"
                  :class="idx === 0 ? 'bg-accent-500' : idx === 1 ? 'bg-surface-400' : idx === 2 ? 'bg-accent-700' : 'bg-surface-300 dark:bg-surface-700'">
                  {{ idx + 1 }}
                </span>
                <span>{{ item.name }}</span>
              </span>
              <span class="text-surface-600 dark:text-surface-400">{{ item.count }} 杯</span>
            </div>
            <div class="h-2 w-full rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
              <div
                class="h-full rounded-full bg-primary-500 transition-all duration-500"
                :style="{ width: `${totalCups > 0 ? (item.count / totalCups) * 100 : 0}%` }" />
            </div>
          </div>
          <p v-if="!salesReport?.topDrinks.length" class="text-xs text-surface-400 py-4 text-center">目前無銷售紀錄</p>
        </div>

        <div class="xl:col-span-6 card-panel p-4 flex flex-col gap-3">
          <span class="text-sm font-black text-surface-900 dark:text-surface-100">加料選配榜單 (Top 5)</span>
          <div v-for="(item, idx) in salesReport?.topAddOns" :key="item.name" class="flex flex-col gap-1">
            <div class="flex justify-between text-xs font-bold">
              <span class="flex items-center gap-2">
                <span
                  class="h-5 w-5 rounded-full flex items-center justify-center text-[10px] text-white font-black"
                  :class="idx === 0 ? 'bg-accent-500' : idx === 1 ? 'bg-surface-400' : idx === 2 ? 'bg-accent-700' : 'bg-surface-300 dark:bg-surface-700'">
                  {{ idx + 1 }}
                </span>
                <span>{{ item.name }}</span>
              </span>
              <span class="text-surface-600 dark:text-surface-400">{{ item.count }} 份</span>
            </div>
            <div class="h-2 w-full rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
              <div
                class="h-full rounded-full bg-success-500 transition-all duration-500"
                :style="{ width: `${salesReport?.topAddOns[0]?.count ? (item.count / salesReport.topAddOns[0].count) * 100 : 0}%` }" />
            </div>
          </div>
          <p v-if="!salesReport?.topAddOns.length" class="text-xs text-surface-400 py-4 text-center">目前無配料加購紀錄</p>
        </div>

        <div class="xl:col-span-6 card-panel p-4 flex flex-col gap-3">
          <span class="text-sm font-black text-surface-900 dark:text-surface-100 flex items-center gap-1.5">
            <CreditCard class="h-4 w-4 text-info-500" />
            <span>多元支付通路結構</span>
          </span>
          <div v-for="(item, idx) in salesReport?.topPaymentMethods" :key="item.name" class="flex flex-col gap-1">
            <div class="flex justify-between text-xs font-bold">
              <span class="flex items-center gap-2">
                <span
                  class="h-5 w-5 rounded-full flex items-center justify-center text-[10px] text-white font-black"
                  :class="idx === 0 ? 'bg-primary-500' : 'bg-surface-400 dark:bg-surface-600'">
                  {{ idx + 1 }}
                </span>
                <span>{{ item.name }}</span>
              </span>
              <span class="text-surface-600 dark:text-surface-400">{{ item.count }} 次交易</span>
            </div>
            <div class="h-2 w-full rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
              <div
                class="h-full rounded-full bg-info-500 transition-all duration-500"
                :style="{ width: `${totalOrders > 0 ? (item.count / totalOrders) * 100 : 0}%` }" />
            </div>
          </div>
          <p v-if="!salesReport?.topPaymentMethods.length" class="text-xs text-surface-400 py-4 text-center">目前無付款紀錄</p>
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
          <span>總出杯數 (Top 5):</span>
          <span class="font-bold">{{ totalCups }} 杯</span>
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
import {
  DollarSign,
  Coffee,
  ShoppingBag,
  TrendingUp,
  Calendar,
  Download,
  Printer,
  Flame,
  CreditCard
} from 'lucide-vue-next'

echarts.use([LineChart, GridComponent, LegendComponent, TitleComponent, TooltipComponent, CanvasRenderer])
import { useQuery } from '@tanstack/vue-query'
import { getDate, getTime, formatBusinessDate, toBusinessDate, toNativeDate, fromNativeDate } from '@/utils/time'
import { fetchSalesReport } from '@/api/reports'
import ModalDialog from '@/components/ui/ModalDialog.vue'
import TrendBadge from '@/components/ui/TrendBadge.vue'
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
  if (!report) return { totalRevenue: 0, totalCups: 0, totalOrders: 0, averageOrderValue: 0 }
  const totalRevenue = singleDay
    ? report.hourlyRevenue.reduce((sum, p) => sum + p.revenue, 0)
    : report.dailyRevenue.reduce((sum, p) => sum + p.revenue, 0)
  const totalCups = report.topDrinks.reduce((sum, d) => sum + d.count, 0)
  const paymentCount = report.topPaymentMethods.reduce((sum, p) => sum + p.count, 0)
  const totalOrders = paymentCount > 0 ? paymentCount : (totalRevenue > 0 ? Math.ceil(totalRevenue / 180) : 0)
  const averageOrderValue = totalOrders === 0 ? 0 : Math.round(totalRevenue / totalOrders)
  return { totalRevenue, totalCups, totalOrders, averageOrderValue }
}
const isSingleDay = computed(() => selectTime.value[0] === selectTime.value[1])
const current = computed(() => computeTotals(salesReport.value, isSingleDay.value))
const previous = computed(() => computeTotals(previousSalesReport.value, previousPeriod.value[0] === previousPeriod.value[1]))

const totalRevenue = computed(() => current.value.totalRevenue)
const totalCups = computed(() => current.value.totalCups)
const totalOrders = computed(() => current.value.totalOrders)
const averageOrderValue = computed(() => current.value.averageOrderValue)

// 計算前期變動率，前期為 0 時回傳 null 避免除以零。
function trendOf(currentValue: number, previousValue: number): { pct: number; up: boolean } | null {
  if (!previousSalesReport.value || previousValue === 0) return null
  const pct = Math.round(((currentValue - previousValue) / previousValue) * 100)
  return { pct, up: pct >= 0 }
}
const revenueTrend = computed(() => trendOf(current.value.totalRevenue, previous.value.totalRevenue))
const cupsTrend = computed(() => trendOf(current.value.totalCups, previous.value.totalCups))
const ordersTrend = computed(() => trendOf(current.value.totalOrders, previous.value.totalOrders))
const aovTrend = computed(() => trendOf(current.value.averageOrderValue, previous.value.averageOrderValue))

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

const setDatePreset = (preset: 'today' | 'yesterday' | 'week' | 'month') => {
  const now = new Date()
  if (preset === 'today') {
    const t = formatSlashDate(now)
    selectTime.value = [t, t]
  } else if (preset === 'yesterday') {
    const y = new Date(now)
    y.setDate(y.getDate() - 1)
    const yStr = formatSlashDate(y)
    selectTime.value = [yStr, yStr]
  } else if (preset === 'week') {
    const w = new Date(now)
    w.setDate(w.getDate() - 6)
    selectTime.value = [formatSlashDate(w), formatSlashDate(now)]
  } else if (preset === 'month') {
    const m = new Date(now.getFullYear(), now.getMonth(), 1)
    selectTime.value = [formatSlashDate(m), formatSlashDate(now)]
  }
}

const isPresetActive = (preset: 'today' | 'yesterday' | 'week' | 'month') => {
  const todayStr = formatSlashDate(new Date())
  if (preset === 'today') return selectTime.value[0] === todayStr && selectTime.value[1] === todayStr
  return false
}

const exportCsv = () => {
  if (!salesReport.value) return
  let csv = 'data:text/csv;charset=utf-8,\uFEFF'
  csv += `POS 營運數據分析報表,期間: ${selectTime.value[0]} ~ ${selectTime.value[1]}\n\n`
  csv += `總營業額,${totalRevenue.value}\n`
  csv += `總訂單數,${totalOrders.value}\n`
  csv += `平均客單價,${averageOrderValue.value}\n`
  csv += `總出杯數,${totalCups.value}\n\n`

  csv += '--- 熱門飲品前五名 ---\n排名,飲品名稱,銷售杯數\n'
  salesReport.value.topDrinks.forEach((d, i) => {
    csv += `${i + 1},${d.name},${d.count}\n`
  })

  csv += '\n--- 熱門配料前五名 ---\n排名,配料名稱,份數\n'
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

const oneDayBusiness = ref<HTMLDivElement>()
const rangeBusiness = ref<HTMLDivElement>()

let activeCharts: echarts.ECharts[] = []

const clearCharts = () => {
  activeCharts.forEach(c => c.dispose())
  activeCharts = []
}

const isDark = computed(() => theme.value === 'dark')
const getTextColor = () => isDark.value ? '#cbd5e1' : '#475569'
const getSubtextColor = () => isDark.value ? '#64748b' : '#94a3b8'
const getSplitLineColor = () => isDark.value ? '#334155' : '#f1f5f9'

const showOneDayBusiness = () => {
  if (!salesReport.value || !oneDayBusiness.value) return
  const chart = echarts.init(oneDayBusiness.value)
  activeCharts.push(chart)
  chart.setOption({
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
  })
}

const showRangeBusiness = () => {
  if (!salesReport.value || !rangeBusiness.value) return
  const chart = echarts.init(rangeBusiness.value)
  activeCharts.push(chart)
  chart.setOption({
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
  })
}

const initCharts = () => {
  clearCharts()
  if (!salesReport.value) return

  if (selectTime.value[0] === selectTime.value[1]) {
    showOneDayBusiness()
  } else {
    showRangeBusiness()
  }
}

watch([salesReport, () => selectTime.value, isDark], () => {
  nextTick(() => {
    initCharts()
  })
})

const handleResize = () => {
  activeCharts.forEach(c => c.resize())
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  clearCharts()
})
</script>