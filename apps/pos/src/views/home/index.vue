<template>
  <div class="flex flex-col lg:flex-row w-full h-full overflow-hidden bg-surface-100/50 dark:bg-surface-950">
    <div class="flex-1 flex flex-col h-full min-w-0 p-3 overflow-hidden">
      <div class="flex items-center justify-between rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 px-4 py-2.5 shadow-sm mb-3 shrink-0">
        <div class="flex items-center gap-4">
          <div class="flex items-baseline gap-2">
            <span class="text-sm font-black text-surface-900 dark:text-surface-100">{{ getDate() }}</span>
            <span class="text-xs font-mono font-bold text-surface-500 dark:text-surface-400">{{ time }}</span>
          </div>
          <span class="h-4 w-px bg-surface-200 dark:bg-surface-700"></span>
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-1 rounded-md bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 px-2 py-0.5 text-xs font-bold">
              <span>機台編號</span>
              <span class="font-mono">A</span>
            </div>
            <ShiftPanel :operator="`${fromSelection(loginStore.userInfo)?.jobTitle} - ${fromSelection(loginStore.userInfo)?.name}`" />
          </div>
        </div>

        <div class="flex items-center gap-3 text-xs font-bold text-surface-600 dark:text-surface-300">
          <div class="flex items-center gap-1.5 rounded-lg bg-surface-50 dark:bg-surface-800 px-2.5 py-1">
            <span class="text-surface-400">已選杯數:</span>
            <span class="text-primary-600 dark:text-primary-400 font-black">{{ drinkStore.currentDrinkCount }}</span>
            <span>杯</span>
          </div>
          <div class="flex items-center gap-1.5 rounded-lg bg-surface-50 dark:bg-surface-800 px-2.5 py-1">
            <span class="text-surface-400">袋子:</span>
            <span class="text-primary-600 dark:text-primary-400 font-black">{{ drinkStore.currentBagCount }}</span>
            <span>個</span>
          </div>
        </div>
      </div>

      <div class="flex-1 flex flex-col min-h-0 overflow-hidden">
        <DrinkType class="mb-2 shrink-0" />

        <div class="flex-1 min-h-0 overflow-y-auto pr-1">
          <DrinkMenu />
        </div>

        <DrinkCustomized class="mt-2 shrink-0" @add-drink="addNewDrink" />
      </div>
    </div>

    <div class="w-full lg:w-[480px] xl:w-[520px] flex flex-col h-full shrink-0 border-l border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-xl overflow-hidden">
      <div class="p-3 border-b border-surface-200 dark:border-surface-800 bg-surface-50/70 dark:bg-surface-900/90 shrink-0">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-surface-400">單號</span>
            <span class="text-base font-black text-primary-600 dark:text-primary-400 font-mono tracking-wide">
              #{{ orderStore.nextOrderId }}
            </span>
            <span class="text-xs text-surface-500 font-medium">
              ({{ fromSelection(loginStore.userInfo)?.jobTitle }} - {{ fromSelection(loginStore.userInfo)?.name }})
            </span>
          </div>

          <!-- data-testid 與樣式類別為 e2e 依賴，勿調整 -->
          <div class="flex items-center gap-1 bg-surface-200/70 dark:bg-surface-800 p-0.5 rounded-xl" data-testid="order-channel-toggle">
            <button
              type="button"
              class="rounded-lg px-2.5 py-1 text-xs font-bold transition-all select-none"
              :class="orderChannel === '外帶'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-surface-600 dark:text-surface-300 hover:text-surface-900'"
              @click="orderChannel = '外帶'">外帶</button>
            <button
              type="button"
              class="rounded-lg px-2.5 py-1 text-xs font-bold transition-all select-none"
              :class="orderChannel === '內用'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-surface-600 dark:text-surface-300 hover:text-surface-900'"
              @click="orderChannel = '內用'">內用</button>
            <input
              v-if="orderChannel === '內用'"
              v-model="tableNumberInput" type="text" placeholder="桌號"
              data-testid="table-number-input"
              class="w-14 rounded-md border border-surface-300 bg-white px-1.5 py-0.5 text-xs font-bold text-surface-700 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 ml-1" />
          </div>
        </div>

        <div class="flex items-center justify-between gap-1 pt-1 border-t border-surface-200/50 dark:border-surface-800">
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              class="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-2 py-1 text-xs font-bold text-surface-700 dark:text-surface-200 hover:bg-surface-100 select-none shadow-sm transition-colors"
              @click="clearSelectNotPay">
              刪除已勾選品項
            </button>
            <button
              type="button"
              class="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-2 py-1 text-xs font-bold text-surface-700 dark:text-surface-200 hover:bg-danger-50 hover:text-danger-600 hover:border-danger-200 select-none shadow-sm transition-colors"
              @click="clearNotPay">
              清空全部品項
            </button>
          </div>

          <div class="flex items-center gap-1.5">
            <ParkedOrdersPanel v-model:order-channel="orderChannel" v-model:invoice-carrier="invoiceCarrier" />
          </div>
        </div>
      </div>

      <div class="flex-1 min-h-[160px] overflow-y-auto border-b border-surface-200 dark:border-surface-800">
        <table class="w-full text-center text-xs">
          <thead class="sticky top-0 bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 font-bold border-b border-surface-200 dark:border-surface-700 z-10">
            <tr>
              <th class="px-2 py-2">
                <input
                  type="checkbox" :checked="allNotPaySelected"
                  class="rounded text-primary-600 focus:ring-primary-500 cursor-pointer"
                  @change="toggleSelectAll(($event.target as HTMLInputElement).checked)" />
              </th>
              <th class="px-1 py-2">序號</th>
              <th class="px-2 py-2">商品</th>
              <th class="px-1 py-2">單價</th>
              <th class="px-2 py-2">加料</th>
              <th class="px-1 py-2">配料金額</th>
              <th class="px-1 py-2">數量</th>
              <th class="px-1 py-2">折扣金額</th>
              <th class="px-2 py-2">使用折扣</th>
              <th class="px-2 py-2">小計</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
            <tr v-if="drinkStore.drinkNotPay.length === 0">
              <td colspan="10" class="py-12 text-center text-surface-400 dark:text-surface-500">
                <div class="flex flex-col items-center gap-2">
                  <p class="font-bold text-sm">目前無待付款的飲品</p>
                  <p class="text-xs">請點選左側選單加入購物車</p>
                </div>
              </td>
            </tr>
            <tr
              v-for="(row, index) in drinkStore.drinkNotPay"
              :key="row.id"
              data-testid="cart-row"
              class="transition-colors hover:bg-surface-50/80 dark:hover:bg-surface-800/40"
              :class="{ 'bg-primary-50/40 dark:bg-primary-950/20': drinkSelectList.includes(row) }">
              <td class="px-2 py-2">
                <input
                  type="checkbox" :checked="drinkSelectList.includes(row)"
                  class="rounded text-primary-600 focus:ring-primary-500 cursor-pointer"
                  @change="toggleSelect(row, ($event.target as HTMLInputElement).checked)" />
              </td>
              <td class="px-1 py-2 font-mono text-surface-500">{{ index + 1 }}</td>
              <td class="px-2 py-2 font-bold text-surface-900 dark:text-surface-100 max-w-[120px] truncate" :title="row.name">{{ row.name }}</td>
              <td class="px-1 py-2 font-mono">${{ row.price }}</td>
              <td class="px-2 py-2 text-surface-500 max-w-[90px] truncate" :title="String(row.addList)">{{ row.addList }}</td>
              <td class="px-1 py-2 font-mono">${{ row.addListPrice }}</td>
              <td class="px-1 py-2 font-black text-primary-600 dark:text-primary-400">{{ row.count }}</td>
              <td class="px-1 py-2 font-mono text-danger-600 dark:text-danger-400">-${{ row.discount }}</td>
              <td class="px-2 py-2">
                <div v-if="row.useDiscountPercent === '' && row.useDiscountMoney === '' && row.useDiscountFree === ''" class="text-surface-400 text-[10px]">
                  無
                </div>
                <div v-else class="flex flex-wrap gap-1 justify-center">
                  <span v-if="row.useDiscountFree != ''" class="rounded-full bg-info-100 px-1.5 py-0.5 text-[10px] text-info-700 dark:bg-info-950 dark:text-info-300">{{ row.useDiscountFree }}</span>
                  <span v-if="row.useDiscountPercent != ''" class="rounded-full bg-danger-100 px-1.5 py-0.5 text-[10px] text-danger-700 dark:bg-danger-950 dark:text-danger-300">{{ row.useDiscountPercent }}</span>
                  <span v-if="row.useDiscountMoney != ''" class="rounded-full bg-warning-100 px-1.5 py-0.5 text-[10px] text-warning-700 dark:bg-warning-950 dark:text-warning-300">{{ row.useDiscountMoney }}</span>
                </div>
              </td>
              <!-- e2e 依賴第 10 欄 (index 9) 為 line total，勿調整欄位順序 -->
              <td class="px-2 py-2 font-black font-mono text-surface-900 dark:text-surface-100">${{ row.totalPrice }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="p-2.5 border-b border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/60 shrink-0 flex flex-col gap-1.5">
        <!-- 按鈕文字為 e2e 依賴，勿調整 -->
        <div class="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            class="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 py-2 px-1 text-xs font-bold text-surface-700 dark:text-surface-200 hover:bg-surface-100 active:scale-95 transition-all shadow-sm flex items-center justify-center text-center select-none"
            @click="ecoDiscount">
            {{ discountStore.oftenUseDiscount[0].name }}
          </button>
          <button
            type="button"
            class="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 py-2 px-1 text-xs font-bold text-surface-700 dark:text-surface-200 hover:bg-surface-100 active:scale-95 transition-all shadow-sm flex items-center justify-center text-center select-none"
            @click="bottleDiscount">
            {{ discountStore.oftenUseDiscount[1].name }}
          </button>
          <button
            type="button"
            class="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 py-2 px-1 text-xs font-bold text-surface-700 dark:text-surface-200 hover:bg-surface-100 active:scale-95 transition-all shadow-sm flex items-center justify-center text-center select-none"
            @click="openBagDialog">
            加購袋子
          </button>
          <button
            type="button"
            class="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 py-2 px-1 text-xs font-bold text-surface-700 dark:text-surface-200 hover:bg-surface-100 active:scale-95 transition-all shadow-sm flex items-center justify-center text-center select-none"
            :class="{ 'opacity-40 pointer-events-none': !hasCapability(loginStore.userInfo, 'canOpenCashier') }"
            @click="openCashier">
            開收銀機
          </button>
        </div>

        <div class="grid grid-cols-3 gap-1.5">
          <InvoiceCarrierPanel v-model="invoiceCarrier" />
          <MemberPanel v-model="currentOrderMember" />
          <button
            type="button"
            class="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 py-2 px-1 text-xs font-bold text-surface-700 dark:text-surface-200 hover:bg-surface-100 active:scale-95 transition-all shadow-sm flex items-center justify-center text-center select-none"
            @click="openDiscountMenu">
            優惠券
          </button>
        </div>

        <div class="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            class="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 py-2 px-1 text-xs font-bold text-surface-700 dark:text-surface-200 hover:bg-surface-100 active:scale-95 transition-all shadow-sm flex items-center justify-center text-center select-none"
            @click="oftenUseDiscount1">
            {{ discountStore.oftenUseDiscount[2].name }}
          </button>
          <button
            type="button"
            class="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 py-2 px-1 text-xs font-bold text-surface-700 dark:text-surface-200 hover:bg-surface-100 active:scale-95 transition-all shadow-sm flex items-center justify-center text-center select-none"
            @click="oftenUseDiscount2">
            {{ discountStore.oftenUseDiscount[3].name }}
          </button>
          <button
            type="button"
            class="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 py-2 px-1 text-xs font-bold text-surface-700 dark:text-surface-200 hover:bg-surface-100 active:scale-95 transition-all shadow-sm flex items-center justify-center text-center select-none"
            @click="oftenUseDiscount3">
            {{ discountStore.oftenUseDiscount[4].name }}
          </button>
          <button
            type="button"
            class="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 py-2 px-1 text-xs font-bold text-surface-700 dark:text-surface-200 hover:bg-surface-100 active:scale-95 transition-all shadow-sm flex items-center justify-center text-center select-none"
            :class="{ 'opacity-40 pointer-events-none': !hasCapability(loginStore.userInfo, 'canFreeDrink') }"
            @click="freeDiscount">
            免費招待
          </button>
        </div>
      </div>

      <div class="p-3 bg-surface-50 dark:bg-surface-900 shrink-0 flex flex-col gap-2">
        <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-surface-500">
          <div class="flex justify-between">
            <span>累積金額:</span>
            <span class="font-bold text-surface-800 dark:text-surface-200">$ {{ drinkStore.drinkTotalMoney }}</span>
          </div>
          <div class="flex justify-between">
            <span>優惠折抵:</span>
            <span class="font-bold text-danger-600 dark:text-danger-400">-$ {{ drinkStore.useDiscountPrice }}</span>
          </div>
          <div class="flex justify-between">
            <span>購物袋數:</span>
            <span class="font-bold text-surface-800 dark:text-surface-200">{{ drinkStore.currentBagCount }} 個</span>
          </div>
          <div class="flex justify-between">
            <span>總出杯數:</span>
            <span class="font-bold text-surface-800 dark:text-surface-200">{{ drinkStore.currentDrinkCount }} 杯</span>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-surface-200 dark:border-surface-800">
          <div class="flex flex-col">
            <span class="text-[11px] font-bold uppercase tracking-wider text-surface-400">應付總額 DUE TOTAL</span>
            <span class="text-2xl font-black text-primary-600 dark:text-primary-400 font-mono">
              $ {{ drinkStore.drinkPayPrice }} 元
            </span>
          </div>

          <button
            type="button"
            data-testid="checkout-button"
            class="h-12 px-8 rounded-xl bg-primary-600 hover:bg-primary-700 active:scale-95 text-white font-black text-base lg:text-lg shadow-lg shadow-primary-600/30 transition-all select-none flex items-center justify-center gap-2"
            @click="openPaymentPanel">
            結帳
          </button>
        </div>

        <PaymentPanel
          :open="dialogPayment" :due-amount="drinkStore.drinkPayPrice" :payment-methods="orderStore.paymentList"
          @cancel="cancelPayment" @submit="submitPayment" />

        <ModalDialog v-model:open="dialogBag" title="加購袋子數量">
          <div class="mx-2 flex items-center gap-4">
            <SliderRoot
              :model-value="[bagCount]" :min="0" :max="100" :step="1"
              class="relative flex h-5 flex-1 items-center"
              @update:model-value="(value) => { bagCount = value?.[0] ?? 0 }">
              <SliderTrack class="relative h-1.5 w-full rounded-full bg-surface-200">
                <SliderRange class="absolute h-full rounded-full bg-primary-500" />
              </SliderTrack>
              <SliderThumb class="block h-4 w-4 rounded-full border-2 border-primary-500 bg-white shadow focus:outline-none" />
            </SliderRoot>
            <input
              v-model.number="bagCount" type="number" min="0" max="100"
              class="w-16 rounded-lg border border-surface-300 px-2 py-1 text-center text-sm" />
          </div>
          <div class="mt-6 flex justify-end gap-2">
            <button type="button" class="rounded-lg border border-surface-300 px-4 py-2 text-sm font-bold text-surface-700 hover:bg-surface-100" @click="closeBagCount">取消</button>
            <button type="button" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700" @click="changeBagCount">確定</button>
          </div>
        </ModalDialog>

        <ModalDialog v-model:open="dialogDiscount" title="選擇優惠券">
          <div class="mx-2 max-h-[60vh] overflow-auto">
            <div class="flex h-[85%] items-center justify-center">
              <div
                class="h-[85%] text-surface-700 dark:text-surface-100 bg-white dark:bg-surface-800 border rounded-lg border-surface-300 dark:border-surface-700 cursor-pointer px-1"
                :class="{ 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300': discountStore.discountMenu === 0 }"
                @click="changeMoneyDiscount">
                <p class="w-full h-full text-xl font-bold">現金折扣券</p>
              </div>
              <div
                class="h-[85%] text-surface-700 dark:text-surface-100 bg-white dark:bg-surface-800 border rounded-lg border-surface-300 dark:border-surface-700 cursor-pointer px-1 mx-2 "
                :class="{ 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300': discountStore.discountMenu === 1 }"
                @click="changePercentDiscount">
                <p class="w-full h-full text-xl font-bold">折數折扣券</p>
              </div>
            </div>
            <div v-if="discountStore.discountMenu === 0" class="my-2">
              <div class="mb-2">
                <div
                  v-for="item in sliceMoneyDiscount" :key="item.id" class="h-16 mb-1 flex justify-center items-center cursor-pointer bg-white dark:bg-surface-800 rounded-xl"
                  :class="{ 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300': discountStore.moneySelectingDiscountId === item.id }"
                  @click="selectMoneyDiscount(item.id)">
                  <p class="text-3xl font-bold select-none">{{ item.name }}</p>
                </div>
              </div>
              <div class="flex h-10 w-full items-center justify-between rounded-lg bg-surface-100 px-3 text-sm text-surface-600">
                <p>{{ `共 ${discountStore.moneyDiscount.length} 樣` }}</p>
                <AppPagination :page="moneyDiscountCurrentPage" :page-count="moneyDiscountPageCount" :total="discountStore.moneyDiscount.length" @update:page="handleMoneyDiscountCurrentChange" />
              </div>
            </div>
            <div v-if="discountStore.discountMenu === 1" class="my-2">
              <div class="mb-2">
                <div
                  v-for="item in slicePercentDiscount" :key="item.id" class="h-16 mb-1 flex justify-center items-center cursor-pointer bg-white dark:bg-surface-800 rounded-xl"
                  :class="{ 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300': discountStore.percentSelectingDiscountId === item.id }"
                  @click="selectPercentDiscount(item.id)">
                  <p class="text-3xl font-bold select-none">{{ item.name }}</p>
                </div>
              </div>
              <div class="flex h-10 w-full items-center justify-between rounded-lg bg-surface-100 px-3 text-sm text-surface-600">
                <p>{{ `共 ${discountStore.percentDiscount.length} 樣` }}</p>
                <AppPagination :page="percentDiscountCurrentPage" :page-count="percentDiscountPageCount" :total="discountStore.percentDiscount.length" @update:page="handlePercentDiscountCurrentChange" />
              </div>
            </div>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button type="button" class="rounded-lg border border-surface-300 px-4 py-2 text-sm font-bold text-surface-700 hover:bg-surface-100" @click="closeDiscount">取消</button>
            <button type="button" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700" @click="useDiscount">確定</button>
          </div>
        </ModalDialog>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getDate, getTime } from '@/utils/time'
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import DrinkType from './drinkType/index.vue'
import DrinkMenu from './drinkMenu/index.vue'
import DrinkCustomized from './drinkCustomized/index.vue'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui'
import ModalDialog from '@/components/ui/ModalDialog.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import PaymentPanel, { type TenderDraft } from '@/components/checkout/PaymentPanel.vue'
import ShiftPanel from '@/components/checkout/ShiftPanel.vue'
import ParkedOrdersPanel from '@/components/checkout/ParkedOrdersPanel.vue'
import InvoiceCarrierPanel from '@/components/checkout/InvoiceCarrierPanel.vue'
import MemberPanel from '@/components/checkout/MemberPanel.vue'
import { alert, confirm } from '@/composables/useConfirm'
import { prompt } from '@/composables/usePrompt'
import { showToast } from '@/composables/useToast'
import { useDrinkStore } from '@/stores/drink'
const drinkStore = useDrinkStore()
import { useDiscountStore } from '@/stores/discount'
const discountStore = useDiscountStore()
import { useOrderStore } from '@/stores/order'
const orderStore = useOrderStore()
import { useLoginStore } from '@/stores/login'
const loginStore = useLoginStore()
import type { CartLineItem, FormNumeric, OrderChannel, OrderRecord } from '@/types'
import { fromSelection, hasCapability } from '@/utils/selection'
import { getBusinessDate, priceLine, toggleContainer, toggleFree, toggleRate, type LineDiscountFlags, type OftenUseRates } from '@pos/domain'
import type { AppliedCoupon, InvoiceCarrier, Member } from '@pos/contract'
import { buildCreateOrderRequest } from '@/api/orders'
import { createAuditLog } from '@/api/audit-logs'
import { ApiError } from '@/api/http'
import { enqueueOrder } from '@/offline/outbox'
import { useOrderSync } from '@/offline/useOrderSync'

const orderSync = useOrderSync()

const time = ref('')
onMounted(() => {
  setInterval(() => {
    time.value = getTime()
  }, 1000);
})
// 已知缺陷：未保存 setInterval 回傳的 id，clearInterval(undefined) 實際上不會清除計時器。
onUnmounted(() => {
  clearInterval(undefined)
})

// drinkStore 不直接彈窗，只在待付款清單清空時遞增 cartClearedNotice，這裡負責顯示提示。
watch(() => drinkStore.cartClearedNotice, () => {
  void alert({
    title: '通知',
    description: '待付款清單已無品項，套用優惠券以及加購的袋子數量已重置',
    confirmText: '繼續選取品項',
  })
})

const addNewDrink = () => {
  if (fromSelection(drinkStore.drinkItem) === undefined) {
    void alert({ title: '通知', description: '飲品未選擇', confirmText: '繼續選取' })
    return
  }
  if (fromSelection(drinkStore.drinkItem)?.customized != 'none') {
    if (drinkStore.drinkSetSugar === '') {
      void alert({ title: '通知', description: '糖度未選擇', confirmText: '繼續選取' })
      return
    }
  }
  if (fromSelection(drinkStore.drinkItem)?.customized != 'none') {
    if (drinkStore.drinkSetIce === '') {
      void alert({ title: '通知', description: '冰塊未選擇', confirmText: '繼續選取' })
      return
    }
  }
  if (fromSelection(drinkStore.drinkItem)?.customized != 'none') {
    if (drinkStore.drinkSetSize === '') {
      void alert({ title: '通知', description: '容器大小未選擇', confirmText: '繼續選取' })
      return
    }
  } else {
    drinkStore.drinkSetSize = 'L杯'
  }
  if (Number(drinkStore.drinkCount) < 1) {
    void alert({ title: '通知', description: '飲料杯數不能小於一杯', confirmText: '繼續設定' })
    return
  }
  const selectedDrink = fromSelection(drinkStore.drinkItem)!
  const newDrink: CartLineItem = {
    id: drinkStore.drinkNotPay.length + 1,
    name: selectedDrink.customized === 'none' ? selectedDrink.name : `${selectedDrink.name},${drinkStore.drinkSetSugar}/${drinkStore.drinkSetIce},${drinkStore.drinkSetSize}`,
    price: drinkStore.drinkSetSize === 'L杯' ? selectedDrink.priceL : selectedDrink.priceBottle,
    size: drinkStore.drinkSetSize === 'L杯' ? 'L' : 'bottle',
    count: parseInt(drinkStore.drinkCount),
    discount: 0,
    addList: drinkStore.drinkAddList.map(item => item.name).length === 0 ? '無添加配料' : drinkStore.drinkAddList.map(item => item.name),
    addListPrice: drinkStore.drinkAddList.reduce((acc, cur) => acc + Number(cur.price), 0),
    totalPrice: drinkStore.drinkCurrentTotal,
    currentDiscountPercent: 1,
    currentDiscountMoney: 0,
    useDiscountPercent: '',
    useDiscountMoney: '',
    useDiscountFree: '',
    freeDiscount: false,
    ecoDiscount: false,
    bottleDiscount: false,
    oftenUseDiscount1: false,
    oftenUseDiscount2: false,
    oftenUseDiscount3: false,
  }
  drinkStore.drinkNotPay.push(newDrink)
  drinkStore.drinkTypeMenu = ''
  drinkStore.drinkItem = []
  drinkStore.drinkSetSugar = ''
  drinkStore.drinkSetIce = ''
  drinkStore.drinkSetSize = ''
  drinkStore.drinkAddList = []
  drinkStore.drinkCount = '0'
}

const clearNotPay = async () => {
  if (drinkStore.drinkNotPay.length === 0) {
    void alert({ title: '通知', description: '待付款清單為空，無法清空項目', confirmText: '繼續選取品項' })
    return
  }
  const result = await confirm({ title: '警告', description: '確定要清除所有待付款的飲品嗎?' })
  if (result !== 'confirm') return
  drinkStore.drinkNotPay = []
  showToast('清除成功', 'success')
}
const drinkSelectList = ref<CartLineItem[]>([])
const allNotPaySelected = computed(() =>
  drinkStore.drinkNotPay.length > 0 && drinkSelectList.value.length === drinkStore.drinkNotPay.length)
const toggleSelectAll = (checked: boolean) => {
  drinkSelectList.value = checked ? [...drinkStore.drinkNotPay] : []
}
const toggleSelect = (item: CartLineItem, checked: boolean) => {
  if (checked) {
    if (!drinkSelectList.value.includes(item)) drinkSelectList.value.push(item)
  } else {
    drinkSelectList.value = drinkSelectList.value.filter(selected => selected !== item)
  }
}
const clearSelectNotPay = async () => {
  if (drinkSelectList.value.length === 0) {
    void alert({ title: '通知', description: '尚未選取品項', confirmText: '繼續選取品項' })
    return
  }
  const result = await confirm({ title: '警告', description: '確定要清除所有已選的待付款的飲品嗎?' })
  if (result !== 'confirm') return
  drinkStore.drinkNotPay = drinkStore.drinkNotPay.filter(item => !drinkSelectList.value.includes(item))
  showToast('清除成功', 'success')
}

// 預設「外帶」：多數訂單本來就是外帶，純粹少按一次，不是業務規則優先順序。
const orderChannel = ref<OrderChannel>('外帶')

// 這一次交易的個別需求（客人這次要不要用手機條碼），下一位客人多半不會
// 延續同一個選擇，submitPayment() 送出後會重置；orderChannel 則不重置。
const invoiceCarrier = ref<InvoiceCarrier>({ type: '無載具' })

// 同 invoiceCarrier，屬於單次交易的個別需求，送單後重置回預設值。
const currentOrderMember = ref<Member | null>(null)

// 純文字輸入，故意不跟桌況資料綁外鍵（見 dining_tables 說明），只在選了「內用」時顯示。
const tableNumberInput = ref('')

const dialogBag = ref(false)
const bagCount = ref(1)
const openBagDialog = () => {
  bagCount.value = 1
  dialogBag.value = true
}
// 純取消不算錯誤，不額外顯示提示。
const closeBagCount = () => {
  dialogBag.value = false
}
const changeBagCount = () => {
  drinkStore.currentBagCount = bagCount.value
  dialogBag.value = false
  showToast('修改加購袋子數量成功', 'success')
}

// 沒有對應交易的開錢箱動作（例如換零錢、盤點現金）需要記錄理由，否則錢箱
// 可能被任何人在沒有交易紀錄下隨時打開，是實際的內控缺口；理由寫入伺服端
// audit_logs（見 api/audit-logs.ts），而不是只印在瀏覽器主控台。
const openCashier = async () => {
  const reason = await prompt({
    title: '開啟收銀機',
    description: '沒有對應交易的開錢箱動作需要記錄理由，方便之後對帳與稽核',
    label: '理由',
    placeholder: '例如：協助客人換零錢、盤點現金',
    confirmText: '開啟',
  })
  if (reason === null) return
  try {
    await createAuditLog({
      action: 'cashier_open',
      operator: `${fromSelection(loginStore.userInfo)?.jobTitle} - ${fromSelection(loginStore.userInfo)?.name}`,
      detail: reason,
    })
    showToast('收銀機已開啟', 'success')
  } catch (err) {
    showToast(err instanceof ApiError ? `操作失敗：${err.message}` : '連不上伺服端，請確認網路連線', 'error')
  }
}

// 把 discountStore.oftenUseDiscount（表單輸入可能是字串）轉成 pos-domain
// 計價引擎要的固定 5 筆數值設定。
const oftenUseRates = (): OftenUseRates => {
  const toRate = (d: (typeof discountStore.oftenUseDiscount)[number]) => ({
    name: d.name,
    discountMoney: Number(d.discountMoney),
    discountPercent: Number(d.discountPercent),
  })
  const [eco, bottle, rate1, rate2, rate3] = discountStore.oftenUseDiscount
  return [toRate(eco), toRate(bottle), toRate(rate1), toRate(rate2), toRate(rate3)]
}

// 對目前已勾選的品項套用同一種旗標切換，並用 priceLine() 重新計算金額，
// 取代六個函式各自手動改欄位的寫法。
const applyDiscountToggle = (toggle: (flags: LineDiscountFlags) => LineDiscountFlags) => {
  const rates = oftenUseRates()
  drinkSelectList.value.forEach(item => {
    const nextFlags = toggle(item)
    const priced = priceLine({ price: Number(item.price), count: item.count, addListPrice: item.addListPrice }, nextFlags, rates)
    Object.assign(item, nextFlags, priced)
  })
}

const noSelectionAlert = () => {
  void alert({ title: '通知', description: '尚未選取品項', confirmText: '繼續選取品項' })
}
const stillFreeAlert = () => {
  void alert({ title: '通知', description: '選取的品項中有品項尚未取消免費招待無法再添加折扣', confirmText: '重新選取' })
}

// 招待
const freeDiscount = () => {
  if (Number(drinkSelectList.value) <= 0) {
    noSelectionAlert()
    return
  }
  applyDiscountToggle(toggleFree)
}
// 環保折扣
const ecoDiscount = () => {
  if (Number(drinkSelectList.value) <= 0) {
    noSelectionAlert()
    return
  }
  if (drinkSelectList.value.every(item => item.freeDiscount)) {
    stillFreeAlert()
    return
  }
  applyDiscountToggle(flags => toggleContainer(flags, 'eco'))
}
// 瓶裝折扣
const bottleDiscount = () => {
  if (Number(drinkSelectList.value) <= 0) {
    noSelectionAlert()
    return
  }
  if (drinkSelectList.value.every(item => item.freeDiscount)) {
    stillFreeAlert()
    return
  }
  if (!drinkSelectList.value.every(item => item.size === 'bottle')) {
    void alert({ title: '通知', description: '選取的所有品項都要是瓶裝才可以使用此功能', confirmText: '重新選取品項' })
    return
  }
  applyDiscountToggle(flags => toggleContainer(flags, 'bottle'))
}
// 常用折數折扣1（九折）
const oftenUseDiscount1 = () => {
  if (Number(drinkSelectList.value) <= 0) {
    noSelectionAlert()
    return
  }
  if (drinkSelectList.value.every(item => item.freeDiscount)) {
    stillFreeAlert()
    return
  }
  applyDiscountToggle(flags => toggleRate(flags, 1))
}
// 常用折數折扣2（八五折）
const oftenUseDiscount2 = () => {
  if (Number(drinkSelectList.value) <= 0) {
    noSelectionAlert()
    return
  }
  if (drinkSelectList.value.every(item => item.freeDiscount)) {
    stillFreeAlert()
    return
  }
  applyDiscountToggle(flags => toggleRate(flags, 2))
}
// 常用折數折扣3（員工八折）
const oftenUseDiscount3 = () => {
  if (Number(drinkSelectList.value) <= 0) {
    noSelectionAlert()
    return
  }
  if (drinkSelectList.value.every(item => item.freeDiscount)) {
    stillFreeAlert()
    return
  }
  applyDiscountToggle(flags => toggleRate(flags, 3))
}

const dialogDiscount = ref(false)
const openDiscountMenu = () => {
  if (drinkStore.drinkNotPay.length <= 0) {
    void alert({ title: '通知', description: '待付款清單是空的無法使用優惠券', confirmText: '繼續選取' })
  } else {
    discountStore.moneySelectingDiscountId = discountStore.moneyDiscountId
    discountStore.percentSelectingDiscountId = discountStore.percentDiscountId
    dialogDiscount.value = true
  }
}
const changeMoneyDiscount = () => {
  discountStore.discountMenu = 0
  discountStore.percentSelectingDiscountId = 0
}
const changePercentDiscount = () => {
  discountStore.discountMenu = 1
  discountStore.moneySelectingDiscountId = 0
}
const selectMoneyDiscount = (id: FormNumeric) => {
  if (discountStore.moneySelectingDiscountId === id) {
    discountStore.moneySelectingDiscountId = 0
  } else {
    discountStore.moneySelectingDiscountId = id
  }
}
const moneyDiscountCurrentPage = ref(1)
const handleMoneyDiscountCurrentChange = (page: number) => {
  moneyDiscountCurrentPage.value = page
}
const sliceMoneyDiscount = computed(() => {
  return discountStore.moneyDiscount.slice((moneyDiscountCurrentPage.value - 1) * 5, moneyDiscountCurrentPage.value * 5)
})
const moneyDiscountPageCount = computed(() => Math.max(Math.ceil(discountStore.moneyDiscount.length / 5), 1))
const selectPercentDiscount = (id: FormNumeric) => {
  if (discountStore.percentSelectingDiscountId === id) {
    discountStore.percentSelectingDiscountId = 0
  } else {
    discountStore.percentSelectingDiscountId = id
  }
}
const percentDiscountCurrentPage = ref(1)
const handlePercentDiscountCurrentChange = (page: number) => {
  percentDiscountCurrentPage.value = page
}
const slicePercentDiscount = computed(() => {
  return discountStore.percentDiscount.slice((percentDiscountCurrentPage.value - 1) * 5, percentDiscountCurrentPage.value * 5)
})
const percentDiscountPageCount = computed(() => Math.max(Math.ceil(discountStore.percentDiscount.length / 5), 1))
const closeDiscount = () => {
  dialogDiscount.value = false
}
const useDiscount = () => {
  if (discountStore.moneySelectingDiscountId != 0) {
    discountStore.moneyDiscountId = discountStore.moneySelectingDiscountId
    discountStore.currentMoneyDiscount = discountStore.moneyDiscount.find(item => item.id === discountStore.moneyDiscountId)!.discountMoney
    const currentMoneyDiscountName = discountStore.moneyDiscount.find(item => item.id === discountStore.moneyDiscountId)!.name
    discountStore.currentDiscountName = currentMoneyDiscountName
    discountStore.percentDiscountId = 0
    dialogDiscount.value = false
    showToast(`使用${currentMoneyDiscountName}成功`, 'success')
  }
  if (discountStore.percentSelectingDiscountId != 0) {
    discountStore.percentDiscountId = discountStore.percentSelectingDiscountId
    discountStore.currentPercentDiscount = discountStore.percentDiscount.find(item => item.id === discountStore.percentDiscountId)!.discountMoney
    const currentPercentDiscountName = discountStore.percentDiscount.find(item => item.id === discountStore.percentDiscountId)!.name
    discountStore.currentDiscountName = currentPercentDiscountName
    discountStore.moneyDiscountId = 0
    dialogDiscount.value = false
    showToast(`使用${currentPercentDiscountName}成功`, 'success')
  }
  if (discountStore.moneySelectingDiscountId === 0 && discountStore.percentSelectingDiscountId === 0) {
    discountStore.currentMoneyDiscount = 0
    discountStore.moneyDiscountId = 0
    discountStore.percentDiscountId = 0
    discountStore.currentDiscountName = ''
    dialogDiscount.value = false
    showToast('成功取消已套用的優惠券', 'success')
  }
}

// PaymentPanel 要求「湊到剩餘應付為 0 才能按確認送出」，本身就是不可能
// 誤觸的確認動作，取代原本兩層各自獨立的通用確認框。
const dialogPayment = ref(false)
const openPaymentPanel = () => {
  if (drinkStore.drinkNotPay.length <= 0 && drinkStore.currentBagCount <= 0) {
    void alert({ title: '通知', description: '訂單內沒有品項無法送單', confirmText: '繼續添加品項' })
    return
  }
  dialogPayment.value = true
}
const cancelPayment = () => {
  dialogPayment.value = false
}
const submitPayment = async (tenders: TenderDraft[]) => {
  dialogPayment.value = false

  const toPayOrder: OrderRecord = {
    orderId: orderStore.issueOrderId(),
    orderTime: `${getDate()} ${getTime()}`,
    orderStatus: '已完成',
    orderChannel: orderChannel.value,
    staff: `${fromSelection(loginStore.userInfo)?.jobTitle} - ${fromSelection(loginStore.userInfo)?.name} `,
    orderData: drinkStore.drinkNotPay,
    orderBagCount: drinkStore.currentBagCount,
    orderCupCount: drinkStore.currentDrinkCount,
    orderTotalPrice: drinkStore.drinkTotalMoney,
    // orderPayment 是顯示用摘要（多筆 tender 用頓號連接），需跟伺服端算出的摘要規則一致。
    orderPayment: tenders.map((tender) => tender.method).join('、'),
    orderDiscount: drinkStore.useDiscountPrice,
    orderPaymentPrice: drinkStore.drinkPayPrice,
    discountName: discountStore.currentDiscountName === '' ? '無' : discountStore.currentDiscountName,
    refundedAmount: 0,
    voidReason: null,
    voidedBy: null,
    voidedAt: null,
    // 送單當下先佔位，真正的發票號碼由 SyncWorker 同步回來後補上。
    invoiceNumber: '',
    invoiceCarrier: invoiceCarrier.value,
    memberId: currentOrderMember.value?.id ?? null,
    tableNumber: orderChannel.value === '內用' ? tableNumberInput.value.trim() || null : null,
  }
  orderStore.order.push(toPayOrder)
  showToast('訂單送出成功', 'success')

  // 先在本機樂觀扣減庫存：訂單要等背景同步到伺服端才真的扣庫存，若不在
  // 這裡先扣，點餐頁在同步完成前仍能繼續選到已經賣完的品項。
  for (const line of toPayOrder.orderData) {
    const item = drinkStore.drinkType.flatMap((group) => group.drinkList).find((drink) => drink.name === line.name)
    if (item && typeof item.stock === 'number') {
      item.stock = Math.max(0, item.stock - line.count)
    }
    const addOnNames = Array.isArray(line.addList) ? line.addList : []
    for (const addOnName of addOnNames) {
      const addOn = drinkStore.drinkAdd.find((option) => option.name === addOnName)
      if (addOn && typeof addOn.stock === 'number') {
        addOn.stock = Math.max(0, addOn.stock - line.count)
      }
    }
  }

  // 訂單層級折價券只送「套用了哪張」，折抵金額由伺服端重算。要在清空
  // 待付款清單（連帶重置 discountStore 選取狀態）之前先讀出目前套用的是哪一張。
  const appliedCoupon: AppliedCoupon =
    discountStore.moneyDiscountId !== 0
      ? { type: 'money', couponId: String(discountStore.moneyDiscountId) }
      : discountStore.percentDiscountId !== 0
        ? { type: 'percent', couponId: String(discountStore.percentDiscountId) }
        : { type: 'none' }

  // 訂單先入本機離線佇列，不管有沒有網路都會成功；SyncWorker 背景送到
  // 伺服端。這裡額外呼叫 syncNow() 只是「有網路時不用乾等下一次輪詢」，
  // 不是同步成敗的必要步驟。用 toPayOrder.orderData 而非稍後會被清空的 drinkStore.drinkNotPay。
  const request = buildCreateOrderRequest({
    businessDate: getBusinessDate(new Date()),
    staff: toPayOrder.staff,
    lines: toPayOrder.orderData,
    bagCount: toPayOrder.orderBagCount,
    tenders,
    appliedCoupon,
    orderChannel: toPayOrder.orderChannel,
    invoiceCarrier: toPayOrder.invoiceCarrier,
    memberId: toPayOrder.memberId ?? null,
    tableNumber: toPayOrder.tableNumber ?? null,
  })
  void enqueueOrder(request, toPayOrder.orderId).then(() => orderSync.syncNow())
  invoiceCarrier.value = { type: '無載具' }
  currentOrderMember.value = null
  tableNumberInput.value = ''

  drinkStore.drinkNotPay = []
}
</script>

<style lang="scss" scoped></style>
