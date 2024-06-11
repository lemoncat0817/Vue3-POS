<template>
  <div class="w-full flex items-center flex-col overflow-y-auto ">
    <div class="2xl:w-[85%] xl:w-[90%] lg:w-[95%] mt-10 flex flex-col items-center">
      <h1
        class="text-3xl text-white font-bold text-center border-2 border-solid border-black rounded-lg bg-red-500 px-2">
        數據分析</h1>
      <div class="mt-5 flex justify-center items-center">
        <div @click="dataAnalysisStore.currentDataAnalysis = 0"
          class="px-2 border-2 border-solid border-black text-center lg:mx-3 mx-1 text-blue-800 bg-red-500 rounded-lg font-bold lg:text-2xl text-md cursor-pointer select-none"
          :class="{ 'bg-yellow-400': dataAnalysisStore.currentDataAnalysis === 0 }">
          營業額</div>
        <div @click="dataAnalysisStore.currentDataAnalysis = 1"
          class="px-2 border-2 border-solid border-black text-center lg:mx-3 mx-1 text-blue-800 bg-red-500 rounded-lg font-bold lg:text-2xl text-md cursor-pointer select-none"
          :class="{ 'bg-yellow-400': dataAnalysisStore.currentDataAnalysis === 1 }">
          熱門飲料</div>
        <div @click="dataAnalysisStore.currentDataAnalysis = 2"
          class="px-2 border-2 border-solid border-black text-center lg:mx-3 mx-1 text-blue-800 bg-red-500 rounded-lg font-bold lg:text-2xl text-md cursor-pointer select-none"
          :class="{ 'bg-yellow-400': dataAnalysisStore.currentDataAnalysis === 2 }">
          熱門配料</div>
        <div @click="dataAnalysisStore.currentDataAnalysis = 3"
          class="px-2 border-2 border-solid border-black text-center lg:mx-3 mx-1 text-blue-800 bg-red-500 rounded-lg font-bold lg:text-2xl text-md cursor-pointer select-none"
          :class="{ 'bg-yellow-400': dataAnalysisStore.currentDataAnalysis === 3 }">
          常用付款方式</div>
        <el-date-picker class="border-2 border-solid border-black mx-3 font-bold text-2xl select-none"
          v-model="selectTime" type="daterange" range-separator="到" start-placeholder="開始時間" end-placeholder="結束時間"
          format="YYYY/MM/DD" value-format="YYYY/MM/DD" />
      </div>
      <div class="w-4/5 mt-10 ">
        <div v-if="selectTime[0] === selectTime[1] && dataAnalysisStore.currentDataAnalysis === 0" class="h-[530px]"
          ref="oneDayBusiness" />
        <div v-if="selectTime[0] != selectTime[1] && dataAnalysisStore.currentDataAnalysis === 0" class="h-[530px]"
          ref="rangeBusiness" />
        <div v-if="dataAnalysisStore.currentDataAnalysis === 1" class="h-[530px]" ref="hotDrink" />
        <div v-if="dataAnalysisStore.currentDataAnalysis === 2" class="h-[530px]" ref="hotIngredients" />
        <div v-if="dataAnalysisStore.currentDataAnalysis === 3" class="h-[530px]" ref="hotPayMethod" />
      </div>
    </div>
  </div>
</template>

<script setup>
import * as echarts from 'echarts'
import { ref, onMounted, watch, nextTick } from 'vue'
import { useOrderStore } from "@/stores/order"
const orderStore = useOrderStore()
import { useDataAnalysisStore } from "@/stores/dataAnalysis"
const dataAnalysisStore = useDataAnalysisStore()
import { getDate } from '@/utils/time'

// 營業額相關的功能
// 當前選擇的時間預設為當天
const selectTime = ref([getDate(), getDate()])
// 時間區間只有一天的營業額
// 獲得圖表一天的DOM
const oneDayBusiness = ref()
// 計算營業時間的8-22
const businessHoursOfADay = (startTime, endTime) => {
  let label = []
  for (let hours = startTime; hours <= endTime; hours++) {
    label.push(`${hours < 10 ? '0' + hours : hours}:00`)
  }
  return label
}
// 計算營業額8-22每小時分別的營業額
const sumOfBusinessOfADay = (startTime, endTime, date) => {
  let label = []
  let data = []
  for (let hours = startTime; hours <= endTime; hours++) {
    data = orderStore.order.filter(order => order.orderTime.slice(0, 10) === date && order.orderTime.slice(11, 13) === `${hours < 10 ? '0' + hours : hours}`)
    label.push(data.map(data => data.orderPaymentPrice).reduce((acc, cur) => acc + cur, 0))
  }
  return label
}
// 展示一天的營業額
const showOneDayBusiness = (date) => {
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
      data: businessHoursOfADay(8, 22),
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
        data: sumOfBusinessOfADay(8, 22, date),
        type: 'line',
        smooth: true
      }
    ]
  })
}
// 獲得範圍營業額圖表的DOM
const rangeBusiness = ref()
// 獲得選擇的時間的範圍日期
const getRangeDate = (startDate, endDate) => {
  const dateArray = []
  let currentDate = new Date(startDate.replace(/-/g, '/'))
  const end = new Date(endDate.replace(/-/g, '/'))
  while (currentDate <= end) {
    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, '0') // 月份是0索引的
    const day = String(currentDate.getDate()).padStart(2, '0')
    const formattedDate = `${year}/${month}/${day}`
    dateArray.push(formattedDate)
    currentDate.setDate(currentDate.getDate() + 1)
  }
  return dateArray
}
// 計算營業額所選的時間範圍每天分別的營業額
const sumOfBusinessOfRange = (dateLength) => {
  let label = []
  let data = []
  for (let date = 0; date < dateLength; date++) {
    data = orderStore.order.filter(order => order.orderTime.slice(0, 10) === getRangeDate(selectTime.value[0], selectTime.value[1])[date])
    label.push(data.map(data => data.orderPaymentPrice).reduce((acc, cur) => acc + cur, 0))
  }
  return label
}
// 展示所選範圍的營業額
const showRangeBusiness = () => {
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
      data: getRangeDate(selectTime.value[0], selectTime.value[1]),
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
        data: sumOfBusinessOfRange(getRangeDate(selectTime.value[0], selectTime.value[1]).length),
        type: 'line',
        smooth: true
      }
    ]
  })
}
// 獲取熱門飲料圖表的DOM
const hotDrink = ref()
// 計算營業額所選的時間範圍每天分別的熱銷的飲料前五名
const sumOfDrinkOfRange = (dateLength) => {
  let data = []
  let itemCounts = {}
  for (let date = 0; date < dateLength; date++) {
    data = orderStore.order.filter(order => order.orderTime.slice(0, 10) === getRangeDate(selectTime.value[0], selectTime.value[1])[date])
    data.forEach(data => {
      data.orderData.forEach(item => {
        if (itemCounts[item.name]) {
          itemCounts[item.name] += item.count
        } else {
          itemCounts[item.name] = item.count
        }
      })
    })
  }
  let sortedItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])
  let topFiveItems = sortedItems.slice(0, 5)
  let chartData = topFiveItems.map(item => ({ name: item[0], value: item[1] }))
  return chartData
}
// 展示所選範圍的熱門飲料前五名
const showRangeHotDrink = () => {
  const myChart = echarts.init(hotDrink.value)
  myChart.setOption({
    title: {
      text: `${selectTime.value[0] === selectTime.value[1] ? selectTime.value[0] : selectTime.value[0] + '~' + selectTime.value[1]} 銷售前五名的飲料`,
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
        data: sumOfDrinkOfRange(getRangeDate(selectTime.value[0], selectTime.value[1]).length) == '' ? [{ value: 0, name: '目前無資料' }] : sumOfDrinkOfRange(getRangeDate(selectTime.value[0], selectTime.value[1]).length),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          show: true,
          formatter: '{b}: {c} 杯 ({d}%)',
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
// 獲取熱門配料圖表的DOM
const hotIngredients = ref()
// 計算營業額所選的時間範圍每天分別的熱銷的配料前五名
const sumOfIngredientsOfRange = (dateLength) => {
  let data = []
  let itemCounts = {}
  for (let date = 0; date < dateLength; date++) {
    data = orderStore.order.filter(order => order.orderTime.slice(0, 10) === getRangeDate(selectTime.value[0], selectTime.value[1])[date])
    data.forEach(data => {
      data.orderData.forEach(item => {
        if (item.addList != '無添加配料') {
          item.addList.forEach(addItem => {
            if (itemCounts[addItem]) {
              itemCounts[addItem] += item.count
            } else {
              itemCounts[addItem] = item.count
            }
          })
        }
      })
    })
  }
  let sortedItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])
  let topFiveItems = sortedItems.slice(0, 5)
  let chartData = topFiveItems.map(item => ({ name: item[0], value: item[1] }))
  return chartData
}
// 展示所選範圍的熱門配料前五名
const showRangeHotIngredients = () => {
  const myChart = echarts.init(hotIngredients.value)
  myChart.setOption({
    title: {
      text: `${selectTime.value[0] === selectTime.value[1] ? selectTime.value[0] : selectTime.value[0] + '~' + selectTime.value[1]} 銷售前五名的配料`,
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
        data: sumOfIngredientsOfRange(getRangeDate(selectTime.value[0], selectTime.value[1]).length) == '' ? [{ value: 0, name: '目前無資料' }] : sumOfIngredientsOfRange(getRangeDate(selectTime.value[0], selectTime.value[1]).length),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          show: true,
          formatter: '{b}: {c} 份 ({d}%)',
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
// 獲取熱門付款方式圖表的DOM
const hotPayMethod = ref()
// 計算營業額所選的時間範圍每天分別的熱銷的付款方式前五名
const sumOfPayMethodOfRange = (dateLength) => {
  let data = []
  let itemCounts = {}
  for (let date = 0; date < dateLength; date++) {
    data = orderStore.order.filter(order => order.orderTime.slice(0, 10) === getRangeDate(selectTime.value[0], selectTime.value[1])[date])
    data.forEach(data => {
      if (itemCounts[data.orderPayment]) {
        itemCounts[data.orderPayment] += 1
      } else {
        itemCounts[data.orderPayment] = 1
      }
    })
  }
  let sortedItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])
  let topFiveItems = sortedItems.slice(0, 5)
  let chartData = topFiveItems.map(item => ({ name: item[0], value: item[1] }))
  return chartData
}
// 展示所選範圍的熱門付款方式前五名
const showRangeHotPayMethod = () => {
  const myChart = echarts.init(hotPayMethod.value)
  myChart.setOption({
    title: {
      text: `${selectTime.value[0] === selectTime.value[1] ? selectTime.value[0] : selectTime.value[0] + '~' + selectTime.value[1]} 常用的前五項的付款方式`,
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
        data: sumOfPayMethodOfRange(getRangeDate(selectTime.value[0], selectTime.value[1]).length) == '' ? [{ value: 0, name: '目前無資料' }] : sumOfPayMethodOfRange(getRangeDate(selectTime.value[0], selectTime.value[1]).length),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          show: true,
          formatter: '{b}: {c} 次 ({d}%)',
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

// 判斷當前要顯示哪個圖表
const initCharts = () => {
  if (selectTime.value[0] === selectTime.value[1] && dataAnalysisStore.currentDataAnalysis === 0) {
    showOneDayBusiness(selectTime.value[0])
    return
  }
  if (selectTime.value[0] != selectTime.value[1] && dataAnalysisStore.currentDataAnalysis === 0) {
    showRangeBusiness()
    return
  }
  if (dataAnalysisStore.currentDataAnalysis === 1) {
    showRangeHotDrink()
    return
  }
  if (dataAnalysisStore.currentDataAnalysis === 2) {
    showRangeHotIngredients()
    return
  }
  if (dataAnalysisStore.currentDataAnalysis === 3) {
    showRangeHotPayMethod()
    return
  }
}

// 選擇時間改變時顯示當前所選擇的時間的營業額
watch(() => selectTime.value, () => {
  nextTick(() => {
    initCharts()
  })
})
// 要觀看的數據改變時重新渲染頁面
watch(() => dataAnalysisStore.currentDataAnalysis, () => {
  nextTick(() => {
    initCharts()
  })
})
// 頁面刷新時顯示當前所選擇的時間的營業額
onMounted(() => {
  nextTick(() => {
    initCharts()
  })
})
</script>

<style scoped></style>