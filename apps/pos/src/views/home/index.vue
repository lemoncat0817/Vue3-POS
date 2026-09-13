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
            <TableNumberCombobox v-if="orderChannel === '內用'" v-model="tableNumberInput" />
            <input
              v-if="orderChannel === '內用'"
              :value="guestCountInput ?? ''"
              type="text"
              inputmode="numeric"
              min="1"
              maxlength="3"
              placeholder="人數"
              title="用餐人數（選填）"
              class="w-14 rounded-md border border-surface-300 bg-white px-1.5 py-0.5 text-xs font-bold text-surface-700 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 ml-1"
              @input="guestCountInput = parseOptionalInt(($event.target as HTMLInputElement).value)"
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
              class="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-2 py-1 text-xs font-bold text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 select-none shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-surface-800"
              :disabled="!canClearSelected"
              :title="canClearSelected ? undefined : '請先勾選待付款品項'"
              @click="clearSelectNotPay"
            >
              刪除已勾選品項
            </button>
            <button
              type="button"
              class="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-2 py-1 text-xs font-bold text-surface-700 dark:text-surface-200 hover:bg-danger-50 hover:text-danger-600 hover:border-danger-200 select-none shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-surface-700 disabled:hover:border-surface-200 dark:disabled:hover:bg-surface-800 dark:disabled:hover:text-surface-200"
              :disabled="!canClearAll"
              :title="canClearAll ? undefined : '待付款清單已經是空的'"
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
                :title="formatAddList(row.addList)"
              >
                {{ formatAddList(row.addList) }}
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
            class="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 py-2 px-1 text-xs font-bold text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 active:scale-95 transition-all shadow-sm flex items-center justify-center text-center select-none disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 disabled:hover:bg-white dark:disabled:hover:bg-surface-800"
            :disabled="!canApplyFreeDiscount"
            :title="freeDiscountDisabledReason || undefined"
            @click="applyFreeDiscount"
          >
            招待
          </button>
        </div>

        <div class="grid grid-cols-3 gap-1.5">
          <InvoiceCarrierPanel v-model="invoiceCarrier" />
          <MemberPanel
            v-model="currentOrderMember"
            v-model:points-to-redeem="pointsToRedeem"
            :redemption-rate="orderStore.pointsRedemptionRate"
          />
          <button
            type="button"
            class="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 py-2 px-1 text-xs font-bold text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 active:scale-95 transition-all shadow-sm flex items-center justify-center text-center select-none disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 disabled:hover:bg-white dark:disabled:hover:bg-surface-800"
            :disabled="!canUseCoupon"
            :title="canUseCoupon ? undefined : '待付款清單是空的，無法使用優惠券'"
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
            class="flex-1 min-w-[88px] rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 py-2 px-1 text-xs font-bold text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 active:scale-95 transition-all shadow-sm flex items-center justify-center text-center select-none disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 disabled:hover:bg-white dark:disabled:hover:bg-surface-800"
            :disabled="!canApplyQuickDiscount"
            :title="quickDiscountDisabledReason || undefined"
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
          <div v-if="pointsToRedeem > 0" class="flex justify-between">
            <span>點數折抵:</span>
            <span class="font-bold text-danger-600 dark:text-danger-400"
              >-$ {{ catalogStore.cartPayPrice - finalPayablePrice }}</span
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
              >應付總額</span
            >
            <span class="text-2xl font-black text-primary-600 dark:text-primary-400 font-mono">
              $ {{ finalPayablePrice }} 元
            </span>
          </div>

          <button
            type="button"
            data-testid="checkout-button"
            class="h-12 px-8 rounded-xl bg-primary-600 hover:bg-primary-700 active:scale-95 text-white font-black text-base lg:text-lg shadow-lg shadow-primary-600/30 transition-all select-none flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 disabled:hover:bg-primary-600"
            :disabled="!canCheckout"
            :title="canCheckout ? undefined : '訂單內沒有品項，無法送單'"
            @click="openPaymentPanel"
          >
            結帳
          </button>
        </div>

        <PaymentPanel
          :open="dialogPayment"
          :due-amount="finalPayablePrice"
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
              :value="bagCount"
              type="text"
              inputmode="numeric"
              min="0"
              max="100"
              maxlength="3"
              class="w-16 rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 px-2 py-1 text-center text-sm text-surface-900 dark:text-surface-100 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              @input="bagCount = parseRequiredInt(($event.target as HTMLInputElement).value, { max: 100 })"
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
import { formatAddList } from '@/utils/catalog'
import { getDate, getTime } from '@/utils/time'
import { parseOptionalInt, parseRequiredInt } from '@/utils/numberInput'
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import CategoryTabs from './categoryTabs/index.vue'
import ProductMenu from './productMenu/index.vue'
import ProductModifiers from './productModifiers/index.vue'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui'
import ModalDialog from '@/components/ui/ModalDialog.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import TableNumberCombobox from '@/components/ui/TableNumberCombobox.vue'
import PaymentPanel, { type TenderDraft } from '@/components/checkout/PaymentPanel.vue'
import ShiftPanel from '@/components/checkout/ShiftPanel.vue'
import ParkedOrdersPanel from '@/components/checkout/ParkedOrdersPanel.vue'
import InvoiceCarrierPanel from '@/components/checkout/InvoiceCarrierPanel.vue'
import MemberPanel from '@/components/checkout/MemberPanel.vue'
import { confirm } from '@/composables/useConfirm'
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
  redemptionValueForPoints,
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
onUnmounted(() => {
  clearInterval(undefined)
})

watch(
  () => catalogStore.cartClearedNotice,
  () => {
    showToast('待付款清單已無品項，套用優惠券以及加購的包材份數已重置')
  }
)

// 排除已套用折扣品項以避免合併時非預期擴大折扣範圍。
function isSameCartLine(existing: CartLineItem, incoming: CartLineItem): boolean {
  return (
    existing.productId === incoming.productId &&
    existing.name === incoming.name &&
    Number(existing.price) === Number(incoming.price) &&
    existing.addListPrice === incoming.addListPrice &&
    JSON.stringify(existing.addList) === JSON.stringify(incoming.addList) &&
    JSON.stringify(existing.selectedModifiers ?? {}) ===
      JSON.stringify(incoming.selectedModifiers ?? {}) &&
    existing.discount === 0 &&
    !existing.freeDiscount &&
    existing.quickDiscountId === null
  )
}

const addNewProduct = () => {
  const selectedProduct = fromSelection(catalogStore.selectedProduct)
  if (selectedProduct === undefined) {
    showToast('品項未選擇', 'error')
    return
  }
  if (!catalogStore.requiredModifiersSatisfied) {
    showToast('規格尚未選擇完整', 'error')
    return
  }
  if (Number(catalogStore.productCount) < 1) {
    showToast('數量不能小於一份', 'error')
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
  const existingLine = catalogStore.cartLines.find((line) => isSameCartLine(line, newLine))
  if (existingLine) {
    updateLineCount(existingLine, existingLine.count + newLine.count)
  } else {
    catalogStore.cartLines.push(newLine)
  }
  catalogStore.selectedCategoryId = ''
  catalogStore.selectedProduct = []
  catalogStore.selectedModifiers = {}
  catalogStore.productCount = '1'
}

const canClearAll = computed(() => catalogStore.cartLines.length > 0)
const clearNotPay = async () => {
  if (catalogStore.cartLines.length === 0) {
    showToast('待付款清單為空，無法清空項目', 'error')
    return
  }
  const result = await confirm({ title: '警告', description: '確定要清除所有待付款的品項嗎?' })
  if (result !== 'confirm') return
  catalogStore.cancelEditLine()
  catalogStore.suppressClearedNotice = true
  catalogStore.cartLines = []
  await nextTick()
  catalogStore.suppressClearedNotice = false
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
const canClearSelected = computed(() => selectedLines.value.length > 0)
const clearSelectNotPay = async () => {
  if (selectedLines.value.length === 0) {
    showToast('尚未選取品項', 'error')
    return
  }
  const result = await confirm({ title: '警告', description: '確定要清除所有已選的待付款品項嗎?' })
  if (result !== 'confirm') return
  catalogStore.suppressClearedNotice = true
  catalogStore.cartLines = catalogStore.cartLines.filter(
    (item) => !selectedLines.value.includes(item)
  )
  await nextTick()
  catalogStore.suppressClearedNotice = false
  showToast('清除成功', 'success')
}

const orderChannel = ref<OrderChannel>('外帶')
const invoiceCarrier = ref<InvoiceCarrier>({ type: '無載具' })
const currentOrderMember = ref<Member | null>(null)
const pointsToRedeem = ref(0)
const finalPayablePrice = computed(() =>
  Math.max(
    0,
    catalogStore.cartPayPrice - redemptionValueForPoints(pointsToRedeem.value, orderStore.pointsRedemptionRate)
  )
)

const tableNumberInput = ref('')
const guestCountInput = ref<number | null>(null)
const orderNote = ref('')

const dialogBag = ref(false)
const bagCount = ref(1)
const openBagDialog = () => {
  bagCount.value = 1
  dialogBag.value = true
}
const closeBagCount = () => {
  dialogBag.value = false
}
const changeBagCount = () => {
  catalogStore.currentBagCount = bagCount.value
  dialogBag.value = false
  showToast('修改包材份數成功', 'success')
}

// 無交易開錢箱需留存稽核原因。
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

const handleStartEditLine = (line: CartLineItem) => {
  const ok = catalogStore.startEditLine(line)
  if (!ok) {
    showToast('找不到此品項的原始菜單資料，無法重新客製', 'error')
  }
}

const saveEditProduct = () => {
  const line = catalogStore.editingLine
  if (!line) return

  const selectedProduct = fromSelection(catalogStore.selectedProduct)
  if (selectedProduct === undefined) {
    showToast('品項未選擇', 'error')
    return
  }
  if (!catalogStore.requiredModifiersSatisfied) {
    showToast('規格尚未選擇完整', 'error')
    return
  }
  const count = parseInt(catalogStore.productCount)
  if (isNaN(count) || count < 1) {
    showToast('數量不能小於一份', 'error')
    return
  }

  const modifierNames = catalogStore.selectedModifierNames
  const unitPrice = Number(selectedProduct.basePrice) + catalogStore.selectedModifierPriceDelta
  const addList = catalogStore.selectedAddOnOptions.map((option) => option.name)
  const addListPrice = catalogStore.selectedAddOnPriceDelta

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
  showToast('尚未選取品項', 'error')
}
const stillFreeAlert = () => {
  showToast('選取的品項中有品項尚未取消招待無法再套用折扣', 'error')
}

const canApplyFreeDiscount = computed(
  () => selectedLines.value.length > 0 && hasCapability(loginStore.userInfo, 'canCompItem')
)
const freeDiscountDisabledReason = computed(() => {
  if (!hasCapability(loginStore.userInfo, 'canCompItem')) return '沒有招待品項的權限'
  if (selectedLines.value.length === 0) return '請先勾選待付款品項'
  return ''
})

const applyFreeDiscount = () => {
  if (selectedLines.value.length <= 0) {
    noSelectionAlert()
    return
  }
  applyDiscountToggle(toggleFree)
}

const canApplyQuickDiscount = computed(
  () => selectedLines.value.length > 0 && !selectedLines.value.every((item) => item.freeDiscount)
)
const quickDiscountDisabledReason = computed(() => {
  if (selectedLines.value.length === 0) return '請先勾選待付款品項'
  if (selectedLines.value.every((item) => item.freeDiscount)) return '選取的品項皆已招待，無法再套用折扣'
  return ''
})

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
const canUseCoupon = computed(() => catalogStore.cartLines.length > 0)
const openDiscountMenu = () => {
  if (catalogStore.cartLines.length <= 0) {
    showToast('待付款清單是空的無法使用優惠券', 'error')
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

// 送單確認已由 PaymentPanel 滿額送出驗證涵蓋，此處不另跳二次確認框。
const dialogPayment = ref(false)
const canCheckout = computed(
  () => catalogStore.cartLines.length > 0 || catalogStore.currentBagCount > 0
)
const openPaymentPanel = () => {
  if (catalogStore.cartLines.length <= 0 && catalogStore.currentBagCount <= 0) {
    showToast('訂單內沒有品項無法送單', 'error')
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
    // orderPayment 為顯示用摘要，多筆支付方式以頓號連接。
    orderPayment: tenders.map((tender) => tender.method).join('、'),
    orderDiscount: catalogStore.cartTotalMoney + catalogStore.currentBagCount - finalPayablePrice.value,
    orderPaymentPrice: finalPayablePrice.value,
    discountName:
      pointsToRedeem.value > 0
        ? discountStore.currentDiscountName === ''
          ? '點數折抵'
          : `${discountStore.currentDiscountName}、點數折抵`
        : discountStore.currentDiscountName === ''
          ? '無'
          : discountStore.currentDiscountName,
    refundedAmount: 0,
    voidReason: null,
    voidedBy: null,
    voidedAt: null,
    // 送單當下先佔位，真正的發票號碼由 SyncWorker 同步回來後補上。
    invoiceNumber: '',
    invoiceCarrier: invoiceCarrier.value,
    memberId: currentOrderMember.value?.id ?? null,
    // 本機樂觀估算點數，實際以伺服端計算回應為準。
    pointsEarned: currentOrderMember.value
      ? Math.floor(finalPayablePrice.value / orderStore.pointsPerCurrencyUnit)
      : 0,
    pointsRedeemed: currentOrderMember.value ? pointsToRedeem.value : 0,
    tableNumber: orderChannel.value === '內用' ? tableNumberInput.value.trim() || null : null,
    note: orderNote.value.trim() || null
  }

  // 清空待付款清單前需先擷取套用的折價券 ID，避免重置後丟失。
  const appliedCoupon: AppliedCoupon =
    discountStore.orderCouponId !== 0
      ? { type: 'coupon', couponId: String(discountStore.orderCouponId) }
      : { type: 'none' }

  let request: ReturnType<typeof buildCreateOrderRequest>
  try {
    request = buildCreateOrderRequest({
      businessDate: getBusinessDate(new Date(), orderStore.businessDayStartHour),
      staff: toPayOrder.staff,
      lines: toPayOrder.orderData,
      bagCount: toPayOrder.orderBagCount,
      tenders,
      appliedCoupon,
      orderChannel: toPayOrder.orderChannel,
      invoiceCarrier: toPayOrder.invoiceCarrier,
      memberId: toPayOrder.memberId ?? null,
      pointsToRedeem: toPayOrder.pointsRedeemed,
      tableNumber: toPayOrder.tableNumber ?? null,
      guestCount: orderChannel.value === '內用' ? guestCountInput.value : null,
      note: toPayOrder.note ?? null
    })
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
    return
  }

  orderStore.order.push(toPayOrder)
  showToast('訂單送出成功', 'success')

  // 本機樂觀扣減庫存，避免送單同步完成前超賣。
  for (const line of toPayOrder.orderData) {
    const item = catalogStore.products.find((product) => product.name === line.name)
    if (item && typeof item.stock === 'number') {
      item.stock = Math.max(0, item.stock - line.count)
    }
    const addOnNames = Array.isArray(line.addList) ? line.addList : []
    for (const addOnName of addOnNames) {
      for (const group of catalogStore.modifierGroups) {
        const option = group.options.find((opt) => opt.name === addOnName)
        if (option && typeof option.stock === 'number') {
          option.stock = Math.max(0, option.stock - line.count)
          break
        }
      }
    }
  }

  // 佇列成功後主動觸發同步以縮短連線時的等待延遲。
  void enqueueOrder(request, toPayOrder.orderId).then(() => orderSync.syncNow())
  invoiceCarrier.value = { type: '無載具' }
  currentOrderMember.value = null
  pointsToRedeem.value = 0
  tableNumberInput.value = ''
  guestCountInput.value = null
  orderNote.value = ''

  // 抑制清空提示避免覆蓋剛剛顯示的訂單成功 toast。
  catalogStore.suppressClearedNotice = true
  catalogStore.cartLines = []
  await nextTick()
  catalogStore.suppressClearedNotice = false
}
</script>

<style lang="scss" scoped></style>
