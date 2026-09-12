<template>
  <div
    class="flex flex-col lg:flex-row w-full h-full overflow-hidden bg-surface-100/50 dark:bg-surface-950"
  >
    <div class="flex-1 flex flex-col h-full min-w-0 p-3 overflow-hidden">
      <div
        class="flex items-center justify-between rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 px-4 py-2.5 shadow-sm mb-3 shrink-0"
      >
        <div class="flex items-center gap-4">
          <div class="flex items-baseline gap-2">
            <span class="text-sm font-black text-surface-900 dark:text-surface-100">{{
              getDate()
            }}</span>
            <span class="text-xs font-mono font-bold text-surface-500 dark:text-surface-400">{{
              time
            }}</span>
          </div>
          <span class="h-4 w-px bg-surface-200 dark:bg-surface-700"></span>
          <div class="flex items-center gap-2">
            <div
              class="rounded-md bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 px-2 py-0.5 text-xs font-bold"
            >
              機台編號 A
            </div>
            <ShiftPanel
              :operator="`${fromSelection(loginStore.userInfo)?.jobTitle} - ${fromSelection(loginStore.userInfo)?.name}`"
            />
            <!-- 開收銀機是收銀機層級的操作（不對應特定訂單），比照班別面板放在頭部，不跟購物車操作混在一起。 -->
            <button
              type="button"
              class="rounded-md border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-2 py-1 text-xs font-bold text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors select-none"
              :class="{
                'opacity-40 pointer-events-none': !hasCapability(
                  loginStore.userInfo,
                  'canOpenCashier'
                )
              }"
              @click="openCashier"
            >
              開收銀機
            </button>
          </div>
        </div>

        <div
          class="flex items-center gap-3 text-xs font-bold text-surface-600 dark:text-surface-300"
        >
          <div
            class="flex items-center gap-1.5 rounded-lg bg-surface-50 dark:bg-surface-800 px-2.5 py-1"
          >
            <span class="text-surface-400">已選份數:</span>
            <span class="text-primary-600 dark:text-primary-400 font-black">{{
              catalogStore.currentItemCount
            }}</span>
            <span>份</span>
          </div>
          <div
            class="flex items-center gap-1.5 rounded-lg bg-surface-50 dark:bg-surface-800 px-2.5 py-1"
          >
            <span class="text-surface-400">包材:</span>
            <span class="text-primary-600 dark:text-primary-400 font-black">{{
              catalogStore.currentBagCount
            }}</span>
            <span>份</span>
          </div>
        </div>
      </div>

      <div class="flex-1 flex flex-col min-h-0 overflow-hidden">
        <CategoryTabs class="mb-2 shrink-0" />

        <div class="flex-1 min-h-0 overflow-y-auto px-1">
          <ProductMenu />
        </div>

        <ProductModifiers
          class="mt-2 shrink-0"
          @add-product="addNewProduct"
          @save-edit="saveEditProduct"
          @cancel-edit="catalogStore.cancelEditLine()"
        />
      </div>
    </div>

    <div
      class="w-full lg:w-[480px] xl:w-[520px] flex flex-col h-full shrink-0 border-l border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-xl overflow-hidden"
    >
      <div
        class="p-3 border-b border-surface-200 dark:border-surface-800 bg-surface-50/70 dark:bg-surface-900/90 shrink-0"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-surface-400">單號</span>
            <span
              class="text-base font-black text-primary-600 dark:text-primary-400 font-mono tracking-wide"
            >
              #{{ orderStore.nextOrderId }}
            </span>
            <span class="text-xs text-surface-500 font-medium">
              ({{ fromSelection(loginStore.userInfo)?.jobTitle }} -
              {{ fromSelection(loginStore.userInfo)?.name }})
            </span>
          </div>

          <!-- data-testid 與樣式類別為 e2e 依賴，勿調整 -->
          <div
            class="flex items-center gap-1 bg-surface-200/70 dark:bg-surface-800 p-0.5 rounded-xl"
            data-testid="order-channel-toggle"
          >
            <button
              type="button"
              class="rounded-lg px-2.5 py-1 text-xs font-bold transition-all select-none"
              :class="
                orderChannel === '外帶'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-surface-600 dark:text-surface-300 hover:text-surface-900'
              "
              @click="orderChannel = '外帶'"
            >
              外帶
            </button>
            <button
              type="button"
              class="rounded-lg px-2.5 py-1 text-xs font-bold transition-all select-none"
              :class="
                orderChannel === '內用'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-surface-600 dark:text-surface-300 hover:text-surface-900'
              "
              @click="orderChannel = '內用'"
            >
              內用
            </button>
            <input
              v-if="orderChannel === '內用'"
              v-model="tableNumberInput"
              type="text"
              placeholder="桌號"
              data-testid="table-number-input"
              class="w-14 rounded-md border border-surface-300 bg-white px-1.5 py-0.5 text-xs font-bold text-surface-700 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 ml-1"
            />
          </div>
        </div>

        <div class="pt-1 border-t border-surface-200/50 dark:border-surface-800">
          <input
            v-model="orderNote"
            type="text"
            maxlength="200"
            placeholder="訂單備註（選填，例如：外送地址、取件時間、特殊需求...）"
            class="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-2.5 py-1.5 text-xs text-surface-700 dark:text-surface-200 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div class="flex items-center justify-between gap-1 pt-1.5">
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              class="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-2 py-1 text-xs font-bold text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 select-none shadow-sm transition-colors"
              @click="clearSelectNotPay"
            >
              刪除已勾選品項
            </button>
            <button
              type="button"
              class="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-2 py-1 text-xs font-bold text-surface-700 dark:text-surface-200 hover:bg-danger-50 hover:text-danger-600 hover:border-danger-200 select-none shadow-sm transition-colors"
              @click="clearNotPay"
            >
              清空全部品項
            </button>
          </div>

          <div class="flex items-center gap-1.5">
            <ParkedOrdersPanel
              v-model:order-channel="orderChannel"
              v-model:invoice-carrier="invoiceCarrier"
              v-model:order-note="orderNote"
            />
          </div>
        </div>
      </div>

      <div
        class="flex-1 min-h-[160px] overflow-y-auto border-b border-surface-200 dark:border-surface-800"
      >
        <table class="w-full text-center text-xs">
          <thead
            class="sticky top-0 z-10 border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400"
          >
            <tr>
              <th class="px-2 py-2">
                <input
                  type="checkbox"
                  :checked="allNotPaySelected"
                  class="rounded text-primary-600 focus:ring-primary-500 cursor-pointer"
                  @change="toggleSelectAll(($event.target as HTMLInputElement).checked)"
                />
              </th>
              <th class="px-1 py-2">序號</th>
              <th class="px-2 py-2">商品</th>
              <th class="px-1 py-2">單價</th>
              <th class="px-2 py-2">加購</th>
              <th class="px-1 py-2">加購金額</th>
              <th class="px-1 py-2">數量</th>
              <th class="px-1 py-2">折扣金額</th>
              <th class="px-2 py-2">使用折扣</th>
              <th class="px-2 py-2">小計</th>
              <th class="px-1 py-2 w-14"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
            <tr v-if="catalogStore.cartLines.length === 0">
              <td colspan="11" class="py-12 text-center text-surface-400 dark:text-surface-500">
                <div class="flex flex-col items-center gap-2">
                  <p class="font-bold text-sm">目前無待付款的品項</p>
                  <p class="text-xs">請點選左側選單加入購物車</p>
                </div>
              </td>
            </tr>
            <tr
              v-for="(row, index) in catalogStore.cartLines"
              :key="row.id"
              data-testid="cart-row"
              class="transition-colors hover:bg-surface-50/80 dark:hover:bg-surface-800/40"
              :class="{
                'bg-primary-50/40 dark:bg-primary-950/20':
                  selectedLines.includes(row) && catalogStore.editingLine !== row,
                'bg-primary-100/60 dark:bg-primary-950/50 ring-2 ring-inset ring-primary-500/50':
                  catalogStore.editingLine === row
              }"
            >
              <td class="px-2 py-2">
                <input
                  type="checkbox"
                  :checked="selectedLines.includes(row)"
                  class="rounded text-primary-600 focus:ring-primary-500 cursor-pointer"
                  @change="toggleSelect(row, ($event.target as HTMLInputElement).checked)"
                />
              </td>
              <td class="px-1 py-2 font-mono text-surface-500">{{ index + 1 }}</td>
              <td
                class="px-2 py-2 font-bold max-w-[130px] truncate cursor-pointer group/name select-none"
                :title="`${row.name} (點擊重新編輯規格)`"
                @click="handleStartEditLine(row)"
              >
                <div class="flex items-center gap-1">
                  <span
                    class="truncate transition-colors"
                    :class="
                      catalogStore.editingLine === row
                        ? 'text-primary-600 dark:text-primary-400 font-black'
                        : 'text-surface-900 dark:text-surface-100 group-hover/name:text-primary-600 dark:group-hover/name:text-primary-400'
                    "
                  >
                    {{ row.name }}
                  </span>
                  <span
                    v-if="catalogStore.editingLine === row"
                    class="shrink-0 rounded bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-1 py-0.5 text-[9px] font-black border border-primary-300 dark:border-primary-700"
                  >
                    編輯中
                  </span>
                </div>
              </td>
              <td class="px-1 py-2 font-mono">${{ row.price }}</td>
              <td
                class="px-2 py-2 text-surface-500 max-w-[90px] truncate"
                :title="String(row.addList)"
              >
                {{ row.addList }}
              </td>
              <td class="px-1 py-2 font-mono">${{ row.addListPrice }}</td>
              <td class="px-1 py-2 font-black text-primary-600 dark:text-primary-400">
                <QuantityKeypadPopover
                  :model-value="row.count"
                  @update:model-value="updateLineCount(row, $event)"
                >
                  <template #trigger="{ open }">
                    <button
                      type="button"
                      class="inline-flex items-center justify-center min-w-[2rem] h-6 px-1.5 rounded-md border border-primary-200 dark:border-primary-800 bg-primary-50/70 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-mono font-black text-xs hover:bg-primary-100 dark:hover:bg-primary-900/60 hover:border-primary-400 active:scale-95 transition-all select-none cursor-pointer shadow-xs group"
                      :class="{ 'ring-2 ring-primary-500/40 border-primary-500': open }"
                      title="點擊修改數量"
                    >
                      <span>{{ row.count }}</span>
                      <span
                        class="text-[9px] text-primary-500/70 ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >✎</span
                      >
                    </button>
                  </template>
                </QuantityKeypadPopover>
              </td>
              <td class="px-1 py-2 font-mono text-danger-600 dark:text-danger-400">
                -${{ row.discount }}
              </td>
              <td class="px-2 py-2">
                <div
                  v-if="!row.freeDiscount && !row.quickDiscountName"
                  class="text-surface-400 text-[10px]"
                >
                  無
                </div>
                <div v-else class="flex flex-wrap gap-1 justify-center">
                  <span
                    v-if="row.freeDiscount"
                    class="rounded-full bg-info-100 px-1.5 py-0.5 text-[10px] text-info-700 dark:bg-info-950 dark:text-info-300"
                    >招待</span
                  >
                  <span
                    v-if="row.quickDiscountName"
                    class="rounded-full bg-warning-100 px-1.5 py-0.5 text-[10px] text-warning-700 dark:bg-warning-950 dark:text-warning-300"
                    >{{ row.quickDiscountName }}</span
                  >
                </div>
              </td>
              <!-- e2e 依賴第 10 欄 (index 9) 為 line total，勿調整欄位順序 -->
              <td class="px-2 py-2 font-black font-mono text-surface-900 dark:text-surface-100">
                ${{ row.totalPrice }}
              </td>
              <td class="px-1 py-2 text-center whitespace-nowrap">
                <div class="inline-flex items-center justify-center gap-0.5">
                  <button
                    type="button"
                    class="p-1 rounded-lg transition-colors select-none cursor-pointer group"
                    :class="
                      catalogStore.editingLine === row
                        ? 'text-primary-600 bg-primary-100/80 dark:bg-primary-900/60 ring-1 ring-primary-500'
                        : 'text-surface-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/40'
                    "
                    :title="catalogStore.editingLine === row ? '正在編輯此品項' : '編輯品項規格與配料'"
                    @click.stop="handleStartEditLine(row)"
                  >
                    <Pencil class="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                  </button>
                  <button
                    type="button"
                    class="p-1 rounded-lg text-surface-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950/40 transition-colors select-none cursor-pointer group"
                    title="刪除此品項"
                    @click.stop="removeLine(row)"
                  >
                    <Trash2 class="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        class="p-2.5 border-b border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/60 shrink-0 flex flex-col gap-1.5"
      >
        <div class="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            class="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 py-2 px-1 text-xs font-bold text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 active:scale-95 transition-all shadow-sm flex items-center justify-center text-center select-none"
            @click="openBagDialog"
          >
            加購包材
          </button>
          <button
            type="button"
            class="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 py-2 px-1 text-xs font-bold text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 active:scale-95 transition-all shadow-sm flex items-center justify-center text-center select-none"
            :class="{
              'opacity-40 pointer-events-none': !hasCapability(loginStore.userInfo, 'canCompItem')
            }"
            @click="applyFreeDiscount"
          >
            招待
          </button>
        </div>

        <div class="grid grid-cols-3 gap-1.5">
          <InvoiceCarrierPanel v-model="invoiceCarrier" />
          <MemberPanel v-model="currentOrderMember" />
          <button
            type="button"
            class="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 py-2 px-1 text-xs font-bold text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 active:scale-95 transition-all shadow-sm flex items-center justify-center text-center select-none"
            @click="openDiscountMenu"
          >
            優惠券
          </button>
        </div>

        <!-- 快速折扣：依後台設定的清單動態渲染，筆數不固定 -->
        <div v-if="discountStore.quickDiscounts.length > 0" class="flex flex-wrap gap-1.5">
          <button
            v-for="quickDiscount in discountStore.quickDiscounts"
            :key="String(quickDiscount.id)"
            type="button"
            class="flex-1 min-w-[88px] rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 py-2 px-1 text-xs font-bold text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 active:scale-95 transition-all shadow-sm flex items-center justify-center text-center select-none"
            @click="applyQuickDiscount(quickDiscount.id)"
          >
            {{ quickDiscount.name }}
          </button>
        </div>
      </div>

      <div class="p-3 bg-surface-50 dark:bg-surface-900 shrink-0 flex flex-col gap-2">
        <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-surface-500">
          <div class="flex justify-between">
            <span>累積金額:</span>
            <span class="font-bold text-surface-800 dark:text-surface-200"
              >$ {{ catalogStore.cartTotalMoney }}</span
            >
          </div>
          <div class="flex justify-between">
            <span>優惠折抵:</span>
            <span class="font-bold text-danger-600 dark:text-danger-400"
              >-$ {{ catalogStore.useDiscountPrice }}</span
            >
          </div>
          <div class="flex justify-between">
            <span>包材份數:</span>
            <span class="font-bold text-surface-800 dark:text-surface-200"
              >{{ catalogStore.currentBagCount }} 份</span
            >
          </div>
          <div class="flex justify-between">
            <span>總出餐數:</span>
            <span class="font-bold text-surface-800 dark:text-surface-200"
              >{{ catalogStore.currentItemCount }} 份</span
            >
          </div>
        </div>

        <div
          class="flex items-center justify-between pt-2 border-t border-surface-200 dark:border-surface-800"
        >
          <div class="flex flex-col">
            <span class="text-[11px] font-bold uppercase tracking-wider text-surface-400"
              >應付總額 DUE TOTAL</span
            >
            <span class="text-2xl font-black text-primary-600 dark:text-primary-400 font-mono">
              $ {{ catalogStore.cartPayPrice }} 元
            </span>
          </div>

          <button
            type="button"
            data-testid="checkout-button"
            class="h-12 px-8 rounded-xl bg-primary-600 hover:bg-primary-700 active:scale-95 text-white font-black text-base lg:text-lg shadow-lg shadow-primary-600/30 transition-all select-none flex items-center justify-center gap-2"
            @click="openPaymentPanel"
          >
            結帳
          </button>
        </div>

        <PaymentPanel
          :open="dialogPayment"
          :due-amount="catalogStore.cartPayPrice"
          :payment-methods="orderStore.paymentList"
          @cancel="cancelPayment"
          @submit="submitPayment"
        />

        <ModalDialog v-model:open="dialogBag" title="加購包材數量">
          <div class="mx-2 flex items-center gap-4">
            <SliderRoot
              :model-value="[bagCount]"
              :min="0"
              :max="100"
              :step="1"
              class="relative flex h-5 flex-1 items-center"
              @update:model-value="
                (value) => {
                  bagCount = value?.[0] ?? 0
                }
              "
            >
              <SliderTrack class="relative h-1.5 w-full rounded-full bg-surface-200 dark:bg-surface-700">
                <SliderRange class="absolute h-full rounded-full bg-primary-500" />
              </SliderTrack>
              <SliderThumb
                class="block h-4 w-4 rounded-full border-2 border-primary-500 bg-white dark:bg-surface-100 shadow focus:outline-none"
              />
            </SliderRoot>
            <input
              v-model.number="bagCount"
              type="number"
              min="0"
              max="100"
              class="w-16 rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 px-2 py-1 text-center text-sm text-surface-900 dark:text-surface-100 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div class="mt-6 flex justify-end gap-2">
            <button
              type="button"
              class="rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-sm font-bold text-surface-700 dark:text-surface-200 transition-colors hover:bg-surface-100 dark:hover:bg-surface-800"
              @click="closeBagCount"
            >
              取消
            </button>
            <button
              type="button"
              class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-700"
              @click="changeBagCount"
            >
              確定
            </button>
          </div>
        </ModalDialog>

        <ModalDialog v-model:open="dialogDiscount" title="選擇優惠券">
          <div class="mx-2 max-h-[60vh] overflow-auto">
            <p
              v-if="discountStore.orderCoupons.length === 0"
              class="py-10 text-center text-sm text-surface-400"
            >
              無可用優惠券
            </p>
            <div v-else class="mb-2">
              <div
                v-for="item in sliceOrderCoupons"
                :key="item.id"
                class="h-16 mb-1.5 flex items-center justify-between gap-3 px-4 cursor-pointer bg-white dark:bg-surface-800 border rounded-xl border-surface-200 dark:border-surface-700"
                :class="{
                  'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300':
                    discountStore.selectingOrderCouponId === item.id
                }"
                @click="selectOrderCoupon(item.id)"
              >
                <p class="text-xl font-bold select-none">{{ item.name }}</p>
                <span
                  class="shrink-0 rounded-md px-2 py-0.5 text-xs font-bold"
                  :class="
                    item.kind === 'amount'
                      ? 'bg-success-50 text-success-600 dark:bg-success-950/40 dark:text-success-400'
                      : 'bg-info-50 text-info-600 dark:bg-info-950/40 dark:text-info-400'
                  "
                >
                  {{ item.kind === 'amount' ? '定額' : '折數' }}
                </span>
              </div>
            </div>
            <div
              class="flex h-10 w-full items-center justify-between rounded-lg bg-surface-100 dark:bg-surface-800/80 px-3 text-sm text-surface-600 dark:text-surface-300"
            >
              <p>{{ `共 ${discountStore.orderCoupons.length} 樣` }}</p>
              <AppPagination
                :page="orderCouponCurrentPage"
                :page-count="orderCouponPageCount"
                :total="discountStore.orderCoupons.length"
                @update:page="handleOrderCouponCurrentChange"
              />
            </div>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button
              type="button"
              class="rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-sm font-bold text-surface-700 dark:text-surface-200 transition-colors hover:bg-surface-100 dark:hover:bg-surface-800"
              @click="closeDiscount"
            >
              取消
            </button>
            <button
              type="button"
              class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-700"
              @click="useDiscount"
            >
              確定
            </button>
          </div>
        </ModalDialog>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getDate, getTime } from '@/utils/time'
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import CategoryTabs from './categoryTabs/index.vue'
import ProductMenu from './productMenu/index.vue'
import ProductModifiers from './productModifiers/index.vue'
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
import { useCatalogStore } from '@/stores/catalog'
const catalogStore = useCatalogStore()
import { useDiscountStore } from '@/stores/discount'
const discountStore = useDiscountStore()
import { useOrderStore } from '@/stores/order'
const orderStore = useOrderStore()
import { useLoginStore } from '@/stores/login'
const loginStore = useLoginStore()
import type { CartLineItem, FormNumeric, OrderChannel, OrderRecord } from '@/types'
import { fromSelection, hasCapability } from '@/utils/selection'
import {
  getBusinessDate,
  priceLine,
  toggleFree,
  toggleQuickDiscount,
  type LineDiscountFlags,
  type QuickDiscount
} from '@pos/domain'
import type { AppliedCoupon, InvoiceCarrier, Member } from '@pos/contract'
import { buildCreateOrderRequest } from '@/api/orders'
import { createAuditLog } from '@/api/audit-logs'
import { apiErrorMessage } from '@/api/http'
import { enqueueOrder } from '@/offline/outbox'
import { useOrderSync } from '@/offline/useOrderSync'
import QuantityKeypadPopover from '@/components/ui/QuantityKeypadPopover.vue'
import { Trash2, Pencil } from 'lucide-vue-next'

const orderSync = useOrderSync()

const time = ref('')
onMounted(() => {
  setInterval(() => {
    time.value = getTime()
  }, 1000)
})
// 已知缺陷：未保存 setInterval 回傳的 id，clearInterval(undefined) 實際上不會清除計時器。
onUnmounted(() => {
  clearInterval(undefined)
})

// catalogStore 不直接彈窗，只在待付款清單清空時遞增 cartClearedNotice，這裡負責顯示提示。
watch(
  () => catalogStore.cartClearedNotice,
  () => {
    void alert({
      title: '通知',
      description: '待付款清單已無品項，套用優惠券以及加購的包材份數已重置',
      confirmText: '繼續選取品項'
    })
  }
)

const addNewProduct = () => {
  const selectedProduct = fromSelection(catalogStore.selectedProduct)
  if (selectedProduct === undefined) {
    void alert({ title: '通知', description: '品項未選擇', confirmText: '繼續選取' })
    return
  }
  if (!catalogStore.requiredModifiersSatisfied) {
    void alert({ title: '通知', description: '規格尚未選擇完整', confirmText: '繼續選取' })
    return
  }
  if (Number(catalogStore.productCount) < 1) {
    void alert({ title: '通知', description: '數量不能小於一份', confirmText: '繼續設定' })
    return
  }
  const modifierNames = catalogStore.selectedModifierNames
  const addOnNames = catalogStore.selectedAddOnOptions.map((option) => option.name)
  const newLine: CartLineItem = {
    id: catalogStore.cartLines.length + 1,
    name:
      modifierNames.length === 0
        ? selectedProduct.name
        : `${selectedProduct.name},${modifierNames.join('/')}`,
    price: Number(selectedProduct.basePrice) + catalogStore.selectedModifierPriceDelta,
    count: parseInt(catalogStore.productCount),
    discount: 0,
    addList: addOnNames.length === 0 ? '無添加配料' : addOnNames,
    addListPrice: catalogStore.selectedAddOnPriceDelta,
    totalPrice: catalogStore.productCurrentTotal,
    freeDiscount: false,
    quickDiscountId: null,
    quickDiscountName: '',
    productId: String(selectedProduct.id),
    selectedModifiers: JSON.parse(JSON.stringify(catalogStore.selectedModifiers))
  }
  catalogStore.cartLines.push(newLine)
  catalogStore.selectedCategoryId = ''
  catalogStore.selectedProduct = []
  catalogStore.selectedModifiers = {}
  catalogStore.productCount = '0'
}

const clearNotPay = async () => {
  if (catalogStore.cartLines.length === 0) {
    void alert({
      title: '通知',
      description: '待付款清單為空，無法清空項目',
      confirmText: '繼續選取品項'
    })
    return
  }
  const result = await confirm({ title: '警告', description: '確定要清除所有待付款的品項嗎?' })
  if (result !== 'confirm') return
  catalogStore.cancelEditLine()
  catalogStore.cartLines = []
  showToast('清除成功', 'success')
}
const selectedLines = ref<CartLineItem[]>([])
const allNotPaySelected = computed(
  () =>
    catalogStore.cartLines.length > 0 &&
    selectedLines.value.length === catalogStore.cartLines.length
)
const toggleSelectAll = (checked: boolean) => {
  selectedLines.value = checked ? [...catalogStore.cartLines] : []
}
const toggleSelect = (item: CartLineItem, checked: boolean) => {
  if (checked) {
    if (!selectedLines.value.includes(item)) selectedLines.value.push(item)
  } else {
    selectedLines.value = selectedLines.value.filter((selected) => selected !== item)
  }
}
const clearSelectNotPay = async () => {
  if (selectedLines.value.length === 0) {
    void alert({ title: '通知', description: '尚未選取品項', confirmText: '繼續選取品項' })
    return
  }
  const result = await confirm({ title: '警告', description: '確定要清除所有已選的待付款品項嗎?' })
  if (result !== 'confirm') return
  catalogStore.cartLines = catalogStore.cartLines.filter(
    (item) => !selectedLines.value.includes(item)
  )
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

// 訂單備註（外送地址、取件時間、客製化需求等），跟 invoiceCarrier 一樣屬於這筆
// 交易的個別需求，送單後重置；掛單／取單時隨 ParkedOrdersPanel 一併保存與還原。
const orderNote = ref('')

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
  catalogStore.currentBagCount = bagCount.value
  dialogBag.value = false
  showToast('修改包材份數成功', 'success')
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
    confirmText: '開啟'
  })
  if (reason === null) return
  try {
    await createAuditLog({
      action: 'cashier_open',
      operator: `${fromSelection(loginStore.userInfo)?.jobTitle} - ${fromSelection(loginStore.userInfo)?.name}`,
      detail: reason
    })
    showToast('收銀機已開啟', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}

// 把 discountStore.quickDiscounts（表單輸入可能是字串）轉成 pos-domain
// 計價引擎要的數值型快速折扣清單。
const quickDiscountsForPricing = (): QuickDiscount[] =>
  discountStore.quickDiscounts.map((d) => ({
    id: String(d.id),
    name: d.name,
    kind: d.kind,
    value: Number(d.value)
  }))

// 開始重新編輯購物車品項
const handleStartEditLine = (line: CartLineItem) => {
  const ok = catalogStore.startEditLine(line)
  if (!ok) {
    showToast('找不到此品項的原始菜單資料，無法重新客製', 'error')
  }
}

// 儲存重新編輯的品項規格與數量
const saveEditProduct = () => {
  const line = catalogStore.editingLine
  if (!line) return

  const selectedProduct = fromSelection(catalogStore.selectedProduct)
  if (selectedProduct === undefined) {
    void alert({ title: '通知', description: '品項未選擇', confirmText: '繼續選取' })
    return
  }
  if (!catalogStore.requiredModifiersSatisfied) {
    void alert({ title: '通知', description: '規格尚未選擇完整', confirmText: '繼續選取' })
    return
  }
  const count = parseInt(catalogStore.productCount)
  if (isNaN(count) || count < 1) {
    void alert({ title: '通知', description: '數量不能小於一份', confirmText: '繼續設定' })
    return
  }

  const modifierNames = catalogStore.selectedModifierNames
  const unitPrice = Number(selectedProduct.basePrice) + catalogStore.selectedModifierPriceDelta
  const addList = catalogStore.selectedAddOnOptions.map((option) => option.name)
  const addListPrice = catalogStore.selectedAddOnPriceDelta

  // 保留原有折扣旗標重新以 priceLine 計算折扣後小計
  const flags: LineDiscountFlags = {
    freeDiscount: line.freeDiscount,
    quickDiscountId: line.quickDiscountId
  }
  const quickDiscounts = quickDiscountsForPricing()
  const priced = priceLine(
    {
      price: unitPrice,
      addListPrice,
      count
    },
    flags,
    quickDiscounts
  )

  // 原地更新購物車品項屬性
  line.name =
    modifierNames.length === 0
      ? selectedProduct.name
      : `${selectedProduct.name},${modifierNames.join('/')}`
  line.price = unitPrice
  line.count = count
  line.addList = addList.length === 0 ? '無添加配料' : addList
  line.addListPrice = addListPrice
  line.discount = priced.discount
  line.totalPrice = priced.totalPrice
  line.quickDiscountName = priced.quickDiscountName
  line.productId = String(selectedProduct.id)
  line.selectedModifiers = JSON.parse(JSON.stringify(catalogStore.selectedModifiers))

  catalogStore.cancelEditLine()
  showToast(`已更新「${line.name.split(',')[0] ?? line.name}」規格`, 'success')
}

// 單行快速刪除購物車品項
const removeLine = async (item: CartLineItem) => {
  const result = await confirm({
    title: '確認刪除',
    description: `確定要自購物車移除「${item.name}」嗎？`
  })
  if (result !== 'confirm') return
  if (catalogStore.editingLine === item) {
    catalogStore.cancelEditLine()
  }
  catalogStore.cartLines = catalogStore.cartLines.filter((line) => line !== item)
  selectedLines.value = selectedLines.value.filter((selected) => selected !== item)
  showToast(`已移除「${item.name}」`, 'success')
}

// 修改購物車單一品項數量，並即時以 priceLine() 重算小計與折扣
const updateLineCount = (item: CartLineItem, newCountStr: string | number) => {
  const parsed = parseInt(String(newCountStr))
  const count = isNaN(parsed) || parsed < 1 ? 1 : parsed
  item.count = count

  const discounts = quickDiscountsForPricing()
  const flags: LineDiscountFlags = {
    freeDiscount: item.freeDiscount,
    quickDiscountId: item.quickDiscountId
  }
  const priced = priceLine(
    { price: Number(item.price), count: item.count, addListPrice: item.addListPrice },
    flags,
    discounts
  )
  Object.assign(item, priced)
}

// 對目前已勾選的品項套用同一種旗標切換，並用 priceLine() 重新計算金額，
// 取代逐一折扣各自手動改欄位的寫法。
const applyDiscountToggle = (toggle: (flags: LineDiscountFlags) => LineDiscountFlags) => {
  const discounts = quickDiscountsForPricing()
  selectedLines.value.forEach((item) => {
    const nextFlags = toggle({
      freeDiscount: item.freeDiscount,
      quickDiscountId: item.quickDiscountId
    })
    const priced = priceLine(
      { price: Number(item.price), count: item.count, addListPrice: item.addListPrice },
      nextFlags,
      discounts
    )
    Object.assign(item, nextFlags, priced)
  })
}

const noSelectionAlert = () => {
  void alert({ title: '通知', description: '尚未選取品項', confirmText: '繼續選取品項' })
}
const stillFreeAlert = () => {
  void alert({
    title: '通知',
    description: '選取的品項中有品項尚未取消招待無法再套用折扣',
    confirmText: '重新選取'
  })
}

// 招待
const applyFreeDiscount = () => {
  if (selectedLines.value.length <= 0) {
    noSelectionAlert()
    return
  }
  applyDiscountToggle(toggleFree)
}
// 快速折扣：依後台設定的清單動態套用，同一時間每個品項只能套用一筆。
const applyQuickDiscount = (id: FormNumeric) => {
  if (selectedLines.value.length <= 0) {
    noSelectionAlert()
    return
  }
  if (selectedLines.value.every((item) => item.freeDiscount)) {
    stillFreeAlert()
    return
  }
  applyDiscountToggle((flags) => toggleQuickDiscount(flags, String(id)))
}

const dialogDiscount = ref(false)
const openDiscountMenu = () => {
  if (catalogStore.cartLines.length <= 0) {
    void alert({
      title: '通知',
      description: '待付款清單是空的無法使用優惠券',
      confirmText: '繼續選取'
    })
  } else {
    discountStore.selectingOrderCouponId = discountStore.orderCouponId
    dialogDiscount.value = true
  }
}
const selectOrderCoupon = (id: FormNumeric) => {
  discountStore.selectingOrderCouponId = discountStore.selectingOrderCouponId === id ? 0 : id
}
const orderCouponCurrentPage = ref(1)
const handleOrderCouponCurrentChange = (page: number) => {
  orderCouponCurrentPage.value = page
}
const sliceOrderCoupons = computed(() => {
  return discountStore.orderCoupons.slice(
    (orderCouponCurrentPage.value - 1) * 5,
    orderCouponCurrentPage.value * 5
  )
})
const orderCouponPageCount = computed(() =>
  Math.max(Math.ceil(discountStore.orderCoupons.length / 5), 1)
)
const closeDiscount = () => {
  dialogDiscount.value = false
}
const useDiscount = () => {
  if (discountStore.selectingOrderCouponId !== 0) {
    discountStore.orderCouponId = discountStore.selectingOrderCouponId
    const coupon = discountStore.orderCoupons.find(
      (item) => item.id === discountStore.orderCouponId
    )!
    discountStore.currentDiscountName = coupon.name
    dialogDiscount.value = false
    showToast(`使用${coupon.name}成功`, 'success')
  } else {
    discountStore.orderCouponId = 0
    discountStore.currentDiscountName = ''
    dialogDiscount.value = false
    showToast('成功取消已套用的優惠券', 'success')
  }
}

// PaymentPanel 要求「湊到剩餘應付為 0 才能按確認送出」，本身就是不可能
// 誤觸的確認動作，取代原本兩層各自獨立的通用確認框。
const dialogPayment = ref(false)
const openPaymentPanel = () => {
  if (catalogStore.cartLines.length <= 0 && catalogStore.currentBagCount <= 0) {
    void alert({
      title: '通知',
      description: '訂單內沒有品項無法送單',
      confirmText: '繼續添加品項'
    })
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
    orderData: catalogStore.cartLines,
    orderBagCount: catalogStore.currentBagCount,
    orderCupCount: catalogStore.currentItemCount,
    orderTotalPrice: catalogStore.cartTotalMoney,
    // orderPayment 是顯示用摘要（多筆 tender 用頓號連接），需跟伺服端算出的摘要規則一致。
    orderPayment: tenders.map((tender) => tender.method).join('、'),
    orderDiscount: catalogStore.useDiscountPrice,
    orderPaymentPrice: catalogStore.cartPayPrice,
    discountName:
      discountStore.currentDiscountName === '' ? '無' : discountStore.currentDiscountName,
    refundedAmount: 0,
    voidReason: null,
    voidedBy: null,
    voidedAt: null,
    // 送單當下先佔位，真正的發票號碼由 SyncWorker 同步回來後補上。
    invoiceNumber: '',
    invoiceCarrier: invoiceCarrier.value,
    memberId: currentOrderMember.value?.id ?? null,
    tableNumber: orderChannel.value === '內用' ? tableNumberInput.value.trim() || null : null,
    note: orderNote.value.trim() || null
  }

  // 訂單層級折價券只送「套用了哪張」，折抵金額由伺服端重算。要在清空
  // 待付款清單（連帶重置 discountStore 選取狀態）之前先讀出目前套用的是哪一張。
  const appliedCoupon: AppliedCoupon =
    discountStore.orderCouponId !== 0
      ? { type: 'coupon', couponId: String(discountStore.orderCouponId) }
      : { type: 'none' }

  // 先組出並驗證要送給伺服端的請求——驗證失敗就整個中止，不要讓「訂單送出
  // 成功」的提示、本機樂觀扣庫存、清空購物車這些動作在驗證失敗後半路發生
  // （buildCreateOrderRequest 內部會 parse，理論上不該失敗，但錯就該整單擋下）。
  let request: ReturnType<typeof buildCreateOrderRequest>
  try {
    request = buildCreateOrderRequest({
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
      note: toPayOrder.note ?? null
    })
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
    return
  }

  orderStore.order.push(toPayOrder)
  showToast('訂單送出成功', 'success')

  // 先在本機樂觀扣減庫存：訂單要等背景同步到伺服端才真的扣庫存，若不在
  // 這裡先扣，點餐頁在同步完成前仍能繼續選到已經賣完的品項。
  for (const line of toPayOrder.orderData) {
    const item = catalogStore.products.find((product) => product.name === line.name)
    if (item && typeof item.stock === 'number') {
      item.stock = Math.max(0, item.stock - line.count)
    }
    const addOnNames = Array.isArray(line.addList) ? line.addList : []
    for (const addOnName of addOnNames) {
      // 比對方式比照後端 deductStock()：用名稱回查，第一個符合的就當作那筆加購。
      for (const group of catalogStore.modifierGroups) {
        const option = group.options.find((opt) => opt.name === addOnName)
        if (option && typeof option.stock === 'number') {
          option.stock = Math.max(0, option.stock - line.count)
          break
        }
      }
    }
  }

  // 訂單先入本機離線佇列，不管有沒有網路都會成功；SyncWorker 背景送到
  // 伺服端。這裡額外呼叫 syncNow() 只是「有網路時不用乾等下一次輪詢」，
  // 不是同步成敗的必要步驟。用 toPayOrder.orderData 而非稍後會被清空的 catalogStore.cartLines。
  void enqueueOrder(request, toPayOrder.orderId).then(() => orderSync.syncNow())
  invoiceCarrier.value = { type: '無載具' }
  currentOrderMember.value = null
  tableNumberInput.value = ''
  orderNote.value = ''

  catalogStore.cartLines = []
}
</script>

<style lang="scss" scoped></style>
