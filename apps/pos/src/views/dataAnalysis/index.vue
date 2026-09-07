<template>
  <div class="w-full flex items-center flex-col overflow-y-auto ">
    <div class="2xl:w-[85%] xl:w-[90%] lg:w-[95%] mt-10 flex flex-col items-center">
      <!-- P11（規劃書 §12「視覺系統與體驗」）：原本標題與四個分頁籤都是
           滿版飽和紅＋純黑邊框，選取態疊一層飽和黃；日期輸入框則是寫死
           的米色（#f8f8dc）配色，跟其餘頁面的 token 完全脫節。這裡改成
           跟其餘頁面一致的中性分頁籤＋品牌色選取態，並補上深色模式。
           分頁籤同時從 <div @click> 改成語意正確的 <button>。 -->
      <h1 class="text-3xl font-black text-surface-900 dark:text-surface-100">數據分析</h1>
      <div class="mt-5 flex flex-wrap items-center justify-center gap-2">
        <button
type="button"
          class="rounded-lg border px-4 py-2 text-sm font-bold transition-colors lg:text-base"
          :class="dataAnalysisStore.currentDataAnalysis === 0
            ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300'
            : 'border-surface-300 text-surface-700 hover:bg-surface-100 dark:border-surface-700 dark:text-surface-200 dark:hover:bg-surface-800'"
          @click="dataAnalysisStore.currentDataAnalysis = 0">
          營業額</button>
        <button
type="button"
          class="rounded-lg border px-4 py-2 text-sm font-bold transition-colors lg:text-base"
          :class="dataAnalysisStore.currentDataAnalysis === 1
            ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300'
            : 'border-surface-300 text-surface-700 hover:bg-surface-100 dark:border-surface-700 dark:text-surface-200 dark:hover:bg-surface-800'"
          @click="dataAnalysisStore.currentDataAnalysis = 1">
          熱門飲料</button>
        <button
type="button"
          class="rounded-lg border px-4 py-2 text-sm font-bold transition-colors lg:text-base"
          :class="dataAnalysisStore.currentDataAnalysis === 2
            ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300'
            : 'border-surface-300 text-surface-700 hover:bg-surface-100 dark:border-surface-700 dark:text-surface-200 dark:hover:bg-surface-800'"
          @click="dataAnalysisStore.currentDataAnalysis = 2">
          熱門配料</button>
        <button
type="button"
          class="rounded-lg border px-4 py-2 text-sm font-bold transition-colors lg:text-base"
          :class="dataAnalysisStore.currentDataAnalysis === 3
            ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300'
            : 'border-surface-300 text-surface-700 hover:bg-surface-100 dark:border-surface-700 dark:text-surface-200 dark:hover:bg-surface-800'"
          @click="dataAnalysisStore.currentDataAnalysis = 3">
          常用付款方式</button>
        <div class="mx-3 flex items-center gap-2">
          <input
type="date" aria-label="開始時間" :value="toNativeDate(selectTime[0])"
            class="rounded-lg border border-surface-300 bg-white px-2 py-1.5 text-sm font-bold text-surface-900 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
            @change="(e) => selectTime = [fromNativeDate((e.target as HTMLInputElement).value), selectTime[1]]">
          <span class="text-sm font-bold text-surface-500 dark:text-surface-400">到</span>
          <input
type="date" aria-label="結束時間" :value="toNativeDate(selectTime[1])"
            class="rounded-lg border border-surface-300 bg-white px-2 py-1.5 text-sm font-bold text-surface-900 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
            @change="(e) => selectTime = [selectTime[0], fromNativeDate((e.target as HTMLInputElement).value)]">
        </div>
      </div>
      <div class="w-4/5 mt-10 ">
        <div
v-if="selectTime[0] === selectTime[1] && dataAnalysisStore.currentDataAnalysis === 0" ref="oneDayBusiness"
          class="h-[530px]" />
        <div
v-if="selectTime[0] != selectTime[1] && dataAnalysisStore.currentDataAnalysis === 0" ref="rangeBusiness"
          class="h-[530px]" />
        <div v-if="dataAnalysisStore.currentDataAnalysis === 1" ref="hotDrink" class="h-[530px]" />
        <div v-if="dataAnalysisStore.currentDataAnalysis === 2" ref="hotIngredients" class="h-[530px]" />
        <div v-if="dataAnalysisStore.currentDataAnalysis === 3" ref="hotPayMethod" class="h-[530px]" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// P7（D-16）：原本 `import * as echarts from 'echarts'` 把 echarts 全部
// 圖表類型、元件、算圖引擎（3D、地圖、雷達圖……這個頁面完全沒用到）一次
// 全部打進 bundle。這個頁面只用到折線圖、圓餅圖、標題／提示框／圖例／
// 直角座標系，改成從 echarts/core 個別匯入實際用到的部分，`use()` 手動
// 註冊——echarts 官方文件推薦的按需引入寫法。
import * as echarts from 'echarts/core'
import { LineChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TitleComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { ref, watch, nextTick, computed } from 'vue'

echarts.use([LineChart, PieChart, GridComponent, LegendComponent, TitleComponent, TooltipComponent, CanvasRenderer])
import { useQuery } from '@tanstack/vue-query'
import { useDataAnalysisStore } from "@/stores/dataAnalysis"
const dataAnalysisStore = useDataAnalysisStore()
import { getDate, formatBusinessDate, toBusinessDate, toNativeDate, fromNativeDate } from '@/utils/time'
import { fetchSalesReport } from '@/api/reports'
import type { RankedCount } from '@pos/contract'

// P7（D-15）：這個頁面原本直接對 stores/order.ts 裡「這台裝置自己送過
// 的訂單」（見該 store 的說明）逐筆 `.filter()` 統計，切換一次圖表要重新
// 掃過整份陣列好幾遍，且看不到其他終端機送出的訂單。現在改成呼叫
// GET /api/reports/sales（見 api/reports.ts），統計直接由伺服端對 D1
// 做 SQL 聚合，一次回應涵蓋這個頁面四個分頁全部需要的資料。

// 當前選擇的時間預設為當天
// 固定是 [開始日期, 結束日期] 兩個元素（見下方兩個 <input type="date">），
// 標成 tuple 讓 selectTime.value[0]/[1] 不必因 noUncheckedIndexedAccess
// 而多包一層 undefined 判斷。
const selectTime = ref<[string, string]>([getDate(), getDate()])

// queryKey 用 computed 包起來，selectTime 改變時（切換日期區間）會自動
// 重新呼叫 API；staleTime 沒有另外設定——跟菜單／促銷資料不同，報表
// 資料理應反映「最新送出的訂單」，不適合長期沿用舊的快取結果。
const { data: salesReport } = useQuery({
  queryKey: computed(() => ['salesReport', selectTime.value[0], selectTime.value[1]] as const),
  queryFn: () => fetchSalesReport(toBusinessDate(selectTime.value[0]), toBusinessDate(selectTime.value[1])),
})

// 時間區間只有一天的營業額
const oneDayBusiness = ref<HTMLDivElement>()
// 展示一天的營業額
const showOneDayBusiness = () => {
  if (!salesReport.value) return
  const myChart = echarts.init(oneDayBusiness.value)
  myChart.setOption({
    title: {
      text: `${selectTime.value[0]} 營業額分析`
    },
    tooltip: {
      trigger: 'item',
      triggerOn: 'click',
      formatter: '{b}<br>營業額: {c} 元',
    },
    xAxis: {
      type: 'category',
      data: salesReport.value.hourlyRevenue.map(point => `${String(point.hour).padStart(2, '0')}:00`),
      axisLabel: {
        show: true,
        color: 'blue',
        fontSize: 14,
        fontWeight: 'bold',
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        show: true,
        color: 'red',
        fontSize: 14,
        fontWeight: 'bold',
      }
    },
    series: [
      {
        data: salesReport.value.hourlyRevenue.map(point => point.revenue),
        type: 'line',
        smooth: true
      }
    ]
  })
}
// 獲得範圍營業額圖表的DOM
const rangeBusiness = ref<HTMLDivElement>()
// 展示所選範圍的營業額
const showRangeBusiness = () => {
  if (!salesReport.value) return
  const myChart = echarts.init(rangeBusiness.value)
  myChart.setOption({
    title: {
      text: `${selectTime.value[0]}~${selectTime.value[1]} 營業額分析`
    },
    tooltip: {
      trigger: 'item',
      triggerOn: 'click',
      formatter: '{b}<br>營業額: {c} 元',
    },
    xAxis: {
      type: 'category',
      data: salesReport.value.dailyRevenue.map(point => formatBusinessDate(point.businessDate)),
      axisLabel: {
        show: true,
        color: 'blue',
        fontSize: 14,
        fontWeight: 'bold',
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        show: true,
        color: 'red',
        fontSize: 14,
        fontWeight: 'bold',
      }
    },
    series: [
      {
        data: salesReport.value.dailyRevenue.map(point => point.revenue),
        type: 'line',
        smooth: true
      }
    ]
  })
}

// 三張排行圖表（熱門飲料／配料／付款方式）共用同一套 pie 圖設定，差別
// 只在資料來源、標題、單位。原本這裡是三份幾乎一樣的函式，個別重新
// 掃一次同一份訂單陣列——現在資料已經由伺服端算好、直接是排好序的前
// 五名，這裡只需要共用一個渲染函式。
const showRanking = (
  el: HTMLDivElement | undefined,
  data: RankedCount[],
  title: string,
  unit: string,
) => {
  const myChart = echarts.init(el)
  myChart.setOption({
    title: {
      text: `${selectTime.value[0] === selectTime.value[1] ? selectTime.value[0] : selectTime.value[0] + '~' + selectTime.value[1]} ${title}`,
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      triggerOn: 'click',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: 'Access From',
        type: 'pie',
        radius: '50%',
        data: data.length === 0
          ? [{ value: 0, name: '目前無資料' }]
          : data.map(item => ({ name: item.name, value: item.count })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          show: true,
          formatter: `{b}: {c} ${unit} ({d}%)`,
          color: 'inherit',
          borderRadius: 5,
          borderWidth: 1.5,
          padding: [5, 5, 5, 5],
          borderColor: 'inherit',
          fontSize: 14,
          fontWeight: 'bold',
          lineHeight: 14,
        }
      }
    ]
  })
}
// 獲取熱門飲料圖表的DOM
const hotDrink = ref<HTMLDivElement>()
// 獲取熱門配料圖表的DOM
const hotIngredients = ref<HTMLDivElement>()
// 獲取熱門付款方式圖表的DOM
const hotPayMethod = ref<HTMLDivElement>()

// 判斷當前要顯示哪個圖表
const initCharts = () => {
  if (!salesReport.value) return
  if (selectTime.value[0] === selectTime.value[1] && dataAnalysisStore.currentDataAnalysis === 0) {
    showOneDayBusiness()
    return
  }
  if (selectTime.value[0] != selectTime.value[1] && dataAnalysisStore.currentDataAnalysis === 0) {
    showRangeBusiness()
    return
  }
  if (dataAnalysisStore.currentDataAnalysis === 1) {
    showRanking(hotDrink.value, salesReport.value.topDrinks, '銷售前五名的飲料', '杯')
    return
  }
  if (dataAnalysisStore.currentDataAnalysis === 2) {
    showRanking(hotIngredients.value, salesReport.value.topAddOns, '銷售前五名的配料', '份')
    return
  }
  if (dataAnalysisStore.currentDataAnalysis === 3) {
    showRanking(hotPayMethod.value, salesReport.value.topPaymentMethods, '常用的前五項的付款方式', '次')
    return
  }
}

// 報表資料回來、選擇時間改變、或要觀看的分頁改變時，都要重新渲染圖表
// ——這三者分別對應「資料到位」「v-if 切到不同 DOM 節點」兩種情境，都
// 需要等 nextTick 讓對應的 <div ref> 掛載完成才能呼叫 echarts.init()。
watch([salesReport, () => selectTime.value, () => dataAnalysisStore.currentDataAnalysis], () => {
  nextTick(() => {
    initCharts()
  })
})
</script>

<style scoped></style>