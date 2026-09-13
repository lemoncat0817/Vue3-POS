import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  DEFAULT_BUSINESS_DAY_START_HOUR,
  DEFAULT_POINTS_PER_CURRENCY_UNIT,
  DEFAULT_POINTS_REDEMPTION_RATE,
  getBusinessDate
} from '@pos/domain'
import type { OrderRecord, PaymentMethod } from '@/types'

export const useOrderStore = defineStore(
  'order',
  () => {
    const currentOrderNumber = ref(1)
    const paymentList = ref<PaymentMethod[]>([
      {
        id: 1,
        name: '現金',
        disabled: false,
        useMethod: '紙鈔'
      },
      {
        id: 2,
        name: '信用卡',
        disabled: false,
        useMethod: '感應'
      },

      {
        id: 3,
        name: 'LinePay',
        disabled: false,
        useMethod: '掃描'
      },
      {
        id: 4,
        name: '街口支付',
        disabled: false,
        useMethod: '掃描'
      },
      {
        id: 5,
        name: '台灣Pay',
        disabled: false,
        useMethod: '掃描'
      },
      {
        id: 6,
        name: 'ApplePay',
        disabled: false,
        useMethod: '感應'
      },
      {
        id: 7,
        name: 'Pi錢包',
        disabled: false,
        useMethod: '掃描'
      },
      {
        id: 8,
        name: '全支付',
        disabled: false,
        useMethod: '掃描'
      },
      {
        id: 9,
        name: '悠遊付',
        disabled: false,
        useMethod: '掃描'
      }
    ])
    const order = ref<OrderRecord[]>([])
    const businessDayStartHour = ref(DEFAULT_BUSINESS_DAY_START_HOUR)
    const pointsRedemptionRate = ref(DEFAULT_POINTS_REDEMPTION_RATE)
    const pointsPerCurrencyUnit = ref(DEFAULT_POINTS_PER_CURRENCY_UNIT)
    const lastBusinessDate = ref(getBusinessDate(new Date(), businessDayStartHour.value))

    const nextOrderId = computed(() => {
      const today = getBusinessDate(new Date(), businessDayStartHour.value)
      const seq = today === lastBusinessDate.value ? currentOrderNumber.value : 1
      return `${today}${seq}`
    })

    const issueOrderId = () => {
      const today = getBusinessDate(new Date(), businessDayStartHour.value)
      if (today !== lastBusinessDate.value) {
        currentOrderNumber.value = 1
        lastBusinessDate.value = today
      }
      const id = `${today}${currentOrderNumber.value}`
      currentOrderNumber.value++
      return id
    }

    const reconcileOrderId = (
      localOrderId: string,
      serverOrderId: string,
      invoiceNumber: string
    ) => {
      const record = order.value.find((item) => item.orderId === localOrderId)
      if (record) {
        record.orderId = serverOrderId
        record.invoiceNumber = invoiceNumber
      }
    }

    const hydratePaymentMethodsFromServer = (methods: PaymentMethod[]) => {
      paymentList.value = methods
    }

    const hydrateBusinessDayStartHourFromServer = (hour: number) => {
      businessDayStartHour.value = hour
    }

    const hydratePointsRedemptionRateFromServer = (rate: number) => {
      pointsRedemptionRate.value = rate
    }

    const hydratePointsPerCurrencyUnitFromServer = (value: number) => {
      pointsPerCurrencyUnit.value = value
    }

    return {
      currentOrderNumber,
      order,
      paymentList,
      businessDayStartHour,
      pointsRedemptionRate,
      pointsPerCurrencyUnit,
      hydratePaymentMethodsFromServer,
      hydrateBusinessDayStartHourFromServer,
      hydratePointsRedemptionRateFromServer,
      hydratePointsPerCurrencyUnitFromServer,
      nextOrderId,
      issueOrderId,
      reconcileOrderId
    }
  },
  {
    persist: true
  }
)
