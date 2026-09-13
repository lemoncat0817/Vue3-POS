<template>
  <ModalDialog :open="state.open" title="收據預覽" @update:open="onOpenChange">
    <div v-if="state.order" class="flex flex-col gap-4">
      <div
        class="receipt-print-area rounded-xl border border-dashed border-surface-300 bg-white p-4 font-mono text-sm text-surface-900 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100"
      >
        <div class="text-center">
          <p class="text-lg font-bold">POS 系統</p>
          <p class="text-xs text-surface-500 dark:text-surface-400">銷售收據</p>
        </div>
        <div class="my-2 border-t border-dashed border-surface-300 dark:border-surface-700" />
        <div class="flex flex-col gap-0.5 text-xs">
          <div class="flex justify-between">
            <span>訂單編號</span><span>{{ state.order.orderId }}</span>
          </div>
          <div class="flex justify-between">
            <span>訂單時間</span><span>{{ formatDateTime(state.order.orderTime) }}</span>
          </div>
          <div class="flex justify-between">
            <span>服務人員</span><span>{{ state.order.staff }}</span>
          </div>
          <div class="flex justify-between">
            <span>內用／外帶</span><span>{{ state.order.orderChannel }}</span>
          </div>
          <div class="flex justify-between">
            <span>發票號碼</span>
            <span>{{ state.order.invoiceNumber || '（尚未同步）' }}</span>
          </div>
          <div
            v-if="state.order.invoiceCarrier && state.order.invoiceCarrier.type !== '無載具'"
            class="flex justify-between"
          >
            <span>發票載具</span>
            <span
              >{{ state.order.invoiceCarrier.type }} {{ state.order.invoiceCarrier.value }}</span
            >
          </div>
          <div v-if="state.order.note" class="flex justify-between gap-2">
            <span class="shrink-0">備註</span>
            <span class="text-right whitespace-pre-wrap">{{ state.order.note }}</span>
          </div>
          <div v-if="state.order.memberId" class="flex justify-between">
            <span>會員</span>
            <span
              >{{ state.order.memberName ?? state.order.memberId
              }}{{ state.order.memberPhone ? `（${state.order.memberPhone}）` : '' }}</span
            >
          </div>
        </div>
        <div class="my-2 border-t border-dashed border-surface-300 dark:border-surface-700" />
        <table class="w-full text-xs">
          <thead>
            <tr class="text-left">
              <th class="pb-1">品項</th>
              <th class="pb-1 text-right">數量</th>
              <th class="pb-1 text-right">小計</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(line, index) in state.order.orderData" :key="index">
              <td class="py-0.5 align-top">
                {{ line.name }}
                <span
                  v-if="line.addList !== '無添加配料' && line.addList.length > 0"
                  class="block text-surface-500 dark:text-surface-400"
                >
                  ＋{{ formatAddList(line.addList) }}
                </span>
              </td>
              <td class="py-0.5 text-right align-top">{{ line.count }}</td>
              <td class="py-0.5 text-right align-top">${{ line.totalPrice }}</td>
            </tr>
          </tbody>
        </table>
        <div class="my-2 border-t border-dashed border-surface-300 dark:border-surface-700" />
        <div class="flex flex-col gap-0.5 text-xs">
          <div class="flex justify-between">
            <span>包材份數</span><span>{{ state.order.orderBagCount }} 份</span>
          </div>
          <div class="flex justify-between">
            <span>訂單原始金額</span><span>${{ state.order.orderTotalPrice }}</span>
          </div>
          <div v-if="state.order.orderDiscount > 0" class="flex justify-between">
            <span>優惠折抵（{{ state.order.discountName }}）</span
            ><span>−${{ state.order.orderDiscount }}</span>
          </div>
          <div class="flex justify-between text-sm font-bold">
            <span>應付金額</span><span>${{ state.order.orderPaymentPrice }}</span>
          </div>
          <div class="flex justify-between">
            <span>付款方式</span><span>{{ state.order.orderPayment }}</span>
          </div>
          <div v-if="state.order.pointsRedeemed > 0" class="flex justify-between">
            <span>本次折抵點數</span><span>−{{ state.order.pointsRedeemed }} 點</span>
          </div>
          <div v-if="state.order.pointsEarned > 0" class="flex justify-between">
            <span>本次獲得點數</span><span>+{{ state.order.pointsEarned }} 點</span>
          </div>
        </div>
        <div class="my-2 border-t border-dashed border-surface-300 dark:border-surface-700" />
        <p class="text-center text-xs text-surface-500 dark:text-surface-400">
          謝謝惠顧，歡迎再次光臨
        </p>
      </div>

      <div class="flex justify-end gap-2">
        <button
          type="button"
          class="rounded-lg border border-surface-300 px-4 py-2 text-sm font-bold text-surface-700 hover:bg-surface-100 dark:border-surface-700 dark:text-surface-200 dark:hover:bg-surface-800"
          @click="closeReceipt"
        >
          關閉
        </button>
        <button
          type="button"
          class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-700"
          data-testid="print-receipt"
          @click="print"
        >
          列印
        </button>
      </div>
    </div>
  </ModalDialog>
</template>

<script setup lang="ts">
// 全域收據預覽與列印視窗（掛載於 App.vue）
import ModalDialog from '@/components/ui/ModalDialog.vue'
import { closeReceipt, useReceiptPreviewState } from '@/composables/useReceiptPreview'
import { formatAddList } from '@/utils/catalog'
import { formatDateTime } from '@/utils/time'

const state = useReceiptPreviewState()

function onOpenChange(value: boolean) {
  if (!value) closeReceipt()
}

function print() {
  window.print()
}
</script>

<style>
@media print {
  body * {
    visibility: hidden;
  }
  .receipt-print-area,
  .receipt-print-area * {
    visibility: visible;
  }
  .receipt-print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
}
</style>
