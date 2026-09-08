<template>
  <div class="flex overflow-auto ">
    <!-- 左半部 -->
    <div class="w-3/5 ">
      <!-- 資訊顯示欄 -->
      <div class="w-full h-[70px] flex bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-xl rounded-lg">
        <!-- 資訊顯示欄左半部 -->
        <div class="xl:w-1/2 h-full lg:w-[40%] w-[35%]">
          <!-- 當前時間 -->
          <div class="w-full h-1/2 flex justify-start items-center">
            <div class="ml-2 text-lg flex md:flex-row flex-col ">
              <p class="mr-2 font-bold xl:text-lg lg:text-base md:text-sm text-xs">{{ getDate() }}</p>
              <p class="font-bold xl:text-lg lg:text-base md:text-sm text-xs">{{ time }}</p>
            </div>
          </div>
          <!-- 機台編號和班別 -->
          <div class="flex w-full h-1/2 items-center">
            <div class="mx-2 flex md:flex-row flex-col items-center justify-center ">
              <p class="text-surface-500 dark:text-surface-400 mr-2 font-bold xl:text-lg lg:text-base md:text-sm text-xs">機台編號</p>
              <p class="text-center font-bold xl:text-lg lg:text-base md:text-sm text-xs">A</p>
            </div>
            <div class=" flex md:flex-row flex-col items-start justify-center">
              <ShiftPanel :operator="`${fromSelection(loginStore.userInfo)?.jobTitle} - ${fromSelection(loginStore.userInfo)?.name}`" />
            </div>
            <!-- 內用／外帶（P13：規劃書 §10 P0「內用外帶」）：每筆訂單
                 送出當下的頻道選擇，不是持久設定，放在點餐頁最顯眼的
                 資訊列，跟班別狀態同一排。 -->
            <div class="ml-4 flex items-center gap-1" data-testid="order-channel-toggle">
              <button
type="button"
                class="rounded-lg px-2 py-1 text-xs font-bold transition-colors xl:text-sm"
                :class="orderChannel === '內用'
                  ? 'bg-primary-600 text-white'
                  : 'border border-surface-300 text-surface-600 hover:bg-surface-50 dark:border-surface-700 dark:text-surface-400 dark:hover:bg-surface-800'"
                @click="orderChannel = '內用'">內用</button>
              <button
type="button"
                class="rounded-lg px-2 py-1 text-xs font-bold transition-colors xl:text-sm"
                :class="orderChannel === '外帶'
                  ? 'bg-primary-600 text-white'
                  : 'border border-surface-300 text-surface-600 hover:bg-surface-50 dark:border-surface-700 dark:text-surface-400 dark:hover:bg-surface-800'"
                @click="orderChannel = '外帶'">外帶</button>
            </div>
          </div>
        </div>
        <!-- 資訊顯示欄右半部 -->
        <div class="xl:w-1/2 h-full lg:w-[60%] w-[65%]">
          <div class="h-full flex justify-between mr-2 items-center">
            <div class="flex-col">
              <!-- 購買袋子數量 -->
              <div class="flex mr-2">
                <p class="text-surface-500 dark:text-surface-400 mr-2 font-bold xl:text-base lg:text-sm md:text-xs sm:text-[11px] text-[10px]">購買袋子數量</p>
                <p class=" flex justify-end font-bold xl:text-base lg:text-sm md:text-xs sm:text-[11px] text-[10px]">{{ drinkStore.currentBagCount }}
                  個</p>
              </div>
              <!-- 當前飲料杯數 -->
              <div class="flex mr-2">
                <p class="text-surface-500 dark:text-surface-400 mr-2 font-bold xl:text-base lg:text-sm md:text-xs sm:text-[11px] text-[10px]">當前飲料杯數</p>
                <p class=" flex justify-end font-bold xl:text-base lg:text-sm md:text-xs sm:text-[11px] text-[10px]">{{ drinkStore.currentDrinkCount
                  }} 杯</p>
              </div>
            </div>
            <div class="flex-col">
              <!-- 目前累積金額 -->
              <div class="flex justify-end">
                <p class="text-surface-500 dark:text-surface-400 mr-2 font-bold xl:text-base lg:text-sm md:text-xs sm:text-[11px] text-[10px]">目前累積金額</p>
                <p class=" flex justify-end font-bold xl:text-base lg:text-sm md:text-xs sm:text-[11px] text-[10px]">$ {{ drinkStore.drinkTotalMoney
                  }} 元</p>
              </div>
              <!-- 優惠券已折抵金額 -->
              <div class="flex justify-end">
                <p class="text-surface-500 dark:text-surface-400 mr-2 font-bold xl:text-base lg:text-sm md:text-xs sm:text-[11px] text-[10px]">優惠券已折抵</p>
                <p class=" flex justify-end font-bold xl:text-base lg:text-sm md:text-xs sm:text-[11px] text-[10px]">$ {{ drinkStore.useDiscountPrice
                  }} 元</p>
              </div>
              <!-- 顧客應付價格 -->
              <div class="flex justify-end">
                <p class="text-surface-500 dark:text-surface-400 mr-2 font-bold xl:text-base lg:text-sm md:text-xs sm:text-[11px] text-[10px]">顧客應付金額</p>
                <p class=" flex justify-end font-bold xl:text-base lg:text-sm md:text-xs sm:text-[11px] text-[10px]">$ {{ drinkStore.drinkPayPrice }}
                  元</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 單號、服務人員、功能按鈕以及待付款清單 -->
      <div class="w-full h-[527px]">
        <!--  -->
        <div class="w-full h-[10%] bg-surface-100 dark:bg-surface-800 shadow-xl rounded-lg flex">
          <!-- 單號、服務人員、功能按鈕左半部 -->
          <div class="2xl:w-1/2 h-full flex justify-around items-center xl:w-[45%] lg:w-[40%] w-[30%]">
            <!-- 單號 -->
            <div class="w-1/2 flex h-1/2 items-center xl:flex-row flex-col justify-center">
              <p class="xl:mr-2 text-surface-500 dark:text-surface-400 font-bold 2xl:text-lg xl:text-sm lg:text-sm  text-[9px]">單號:</p>
              <p class="text-primary-600 dark:text-primary-400 font-bold 2xl:text-lg xl:text-sm lg:text-sm md:text-[10px] text-[9px]"> {{
                orderStore.nextOrderId }}
              </p>
            </div>
            <!-- 服務人員 -->
            <div class="w-1/2 h-full flex items-center xl:flex-row flex-col justify-center">
              <p class="xl:mr-2 text-surface-500 dark:text-surface-400 font-bold 2xl:text-lg xl:text-sm lg:text-sm md:text-[10px] text-[9px]">
                服務人員:</p>
              <p class="text-primary-600 dark:text-primary-400 font-bold 2xl:text-lg xl:text-sm lg:text-sm md:text-[10px] text-[9px]">{{
                `${fromSelection(loginStore.userInfo)?.jobTitle} -
                ${fromSelection(loginStore.userInfo)?.name} ` }}</p>
            </div>
          </div>
          <!-- 單號、服務人員、功能按鈕右半部 -->
          <div class="2xl:w-1/2 h-full flex items-center xl:w-[55%] lg:w-[60%] w-[70%]">
            <!-- 功能按鈕 -->
            <div class="w-full h-full flex items-center justify-end">
              <!-- 刪除已勾選商品 -->
              <button
class="border border-surface-300 bg-white text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100 dark:hover:bg-surface-800 md:text-[10px] text-[8px] font-bold rounded-lg mr-2 px-1 select-none 2xl:text-base xl:text-sm lg:text-xs"
                @click="clearSelectNotPay">刪除已勾選品項</button>
              <!-- 清空全部品項 -->
              <button
class="border border-surface-300 bg-white text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100 dark:hover:bg-surface-800 md:text-[10px] text-[8px] font-bold rounded-lg mr-2 px-1 select-none 2xl:text-base xl:text-sm lg:text-xs"
                @click="clearNotPay">清空全部品項</button>
              <!-- 掛單／取單（P14：規劃書 §10 P0「掛單取單」）——見
                   components/checkout/ParkedOrdersPanel.vue 的說明。 -->
              <ParkedOrdersPanel v-model:order-channel="orderChannel" v-model:invoice-carrier="invoiceCarrier" />
              <!-- 結帳／付款 -->
              <!-- P6（規劃書 §10 P0「混合支付」）：原本「先選一種付款
                   方式→再按送出訂單→彈出一次性確認框」的三步流程，改成
                   單一按鈕直接開啟結帳面板（PaymentPanel），面板裡才是
                   真正組出這筆訂單要用哪些付款方式、各分擔多少的地方。
                   結帳前不再需要先「修改付款方式」——這件事本身就是每次
                   結帳當下才決定的，不是需要事先設定的持久狀態。 -->
              <!-- 結帳是這個工作區裡唯一的主要動作，維持品牌紅、跟前面
                   兩個次要動作（邊框樣式）明確區分——規劃書 §12「結帳
                   畫面上真正需要搶眼的只有金額與主要動作鍵」。 -->
              <button
class="bg-primary-600 text-white hover:bg-primary-700 md:text-[10px] text-[8px] font-bold rounded-lg mr-2 px-2 select-none 2xl:text-base xl:text-sm lg:text-xs"
                data-testid="checkout-button" @click="openPaymentPanel">結帳</button>
              <PaymentPanel
                :open="dialogPayment" :due-amount="drinkStore.drinkPayPrice" :payment-methods="orderStore.paymentList"
                @cancel="cancelPayment" @submit="submitPayment" />
            </div>
          </div>
        </div>
        <!-- 待付款清單 -->
        <!-- P8：組件庫替換——el-table（含 type="selection" 勾選欄）改用
             純 HTML table + 原生 checkbox，取代方式與 order/index.vue、
             offerSetting/index.vue 一致。這份清單本來就沒有分頁（原本
             也沒有 :total／el-pagination），維持全量顯示。 -->
        <div class="w-full h-[90%] overflow-auto rounded-lg border border-surface-200">
          <table class="w-full text-center text-sm">
            <thead class="sticky top-0 bg-surface-100 text-xs font-bold text-surface-500">
              <tr>
                <th class="px-2 py-2">
                  <input
                    type="checkbox" :checked="allNotPaySelected"
                    @change="toggleSelectAll(($event.target as HTMLInputElement).checked)" />
                </th>
                <th class="px-2 py-2">序號</th>
                <th class="px-2 py-2">商品</th>
                <th class="px-2 py-2">單價</th>
                <th class="px-2 py-2">加料</th>
                <th class="px-2 py-2">配料金額</th>
                <th class="px-2 py-2">數量</th>
                <th class="px-2 py-2">折扣金額</th>
                <th class="px-2 py-2">使用的折扣</th>
                <th class="px-2 py-2">小計</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-100">
              <tr v-if="drinkStore.drinkNotPay.length === 0">
                <td colspan="10" class="px-2 py-8 text-surface-400">目前無待付款的飲品</td>
              </tr>
              <tr v-for="(row, index) in drinkStore.drinkNotPay" :key="row.id" data-testid="cart-row" class="hover:bg-surface-50">
                <td class="px-2 py-2">
                  <input
                    type="checkbox" :checked="drinkSelectList.includes(row)"
                    @change="toggleSelect(row, ($event.target as HTMLInputElement).checked)" />
                </td>
                <td class="px-2 py-2">{{ index + 1 }}</td>
                <td class="px-2 py-2">{{ row.name }}</td>
                <td class="px-2 py-2">{{ row.price }} 元</td>
                <td class="px-2 py-2">{{ row.addList }}</td>
                <td class="px-2 py-2">{{ row.addListPrice }} 元</td>
                <td class="px-2 py-2">{{ row.count }} 杯</td>
                <td class="px-2 py-2">{{ row.discount }} 元</td>
                <td class="px-2 py-2">
                  <div v-if="row.useDiscountPercent === '' && row.useDiscountMoney === '' && row.useDiscountFree === ''">
                    無使用折扣
                  </div>
                  <div v-else class="flex flex-wrap justify-center gap-1">
                    <span v-if="row.useDiscountFree != ''" class="rounded-full bg-info-100 px-2 py-0.5 text-info-700 dark:bg-info-950 dark:text-info-300">{{ row.useDiscountFree }}</span>
                    <span v-if="row.useDiscountPercent != ''" class="rounded-full bg-danger-100 px-2 py-0.5 text-danger-700 dark:bg-danger-950 dark:text-danger-300">{{ row.useDiscountPercent }}</span>
                    <span v-if="row.useDiscountMoney != ''" class="rounded-full bg-warning-100 px-2 py-0.5 text-warning-700 dark:bg-warning-950 dark:text-warning-300">{{ row.useDiscountMoney }}</span>
                  </div>
                </td>
                <td class="px-2 py-2 font-bold">{{ row.totalPrice }}元</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <!-- 主要功能區、數量設置鍵盤 -->
      <div class="w-full h-[281px] flex justify-around border-solid border-t-2 border-surface-200 dark:border-surface-800">
        <!-- 主要功能區 -->
        <div class="lg:w-[65%] h-[95%] w-[60%] mt-2 place-items-center grid grid-cols-5 lg:gap-x-3 gap-x-3.5 ml-1">
          <!-- 載具（P15：規劃書 §10 P0「發票」）——見
               components/checkout/InvoiceCarrierPanel.vue 的說明。 -->
          <InvoiceCarrierPanel v-model="invoiceCarrier" />
          <!-- 加購袋子 -->
          <button
class="2xl:w-28 lg:w-20 lg:h-20 2xl:h-28 xl:w-24 xl:h-24 md:w-14 md:h-14 w-11 h-11 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-xl  text-surface-700 dark:text-surface-100 font-bold 2xl:text-2xl xl:text-xl lg:text-lg md:text-sm sm:text-xs text-[8px] px-0.5 select-none active:bg-primary-50 dark:active:bg-surface-700"
            @click="openBagDialog">加購袋子</button>
          <!-- 加購袋子選單 -->
          <!-- P8：組件庫替換——el-slider（連拖曳滑桿跟旁邊的數字輸入框
               都要）改用 Reka UI 的 Slider 原語＋原生數字輸入框。 -->
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
          <!-- 免費招待 -->
          <button
class="2xl:w-28 lg:w-20 lg:h-20 2xl:h-28 xl:w-24 xl:h-24 md:w-14 md:h-14 w-11 h-11 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-xl  text-surface-700 dark:text-surface-100 font-bold 2xl:text-2xl xl:text-xl lg:text-lg md:text-sm sm:text-xs text-[8px] px-0.5 select-none active:bg-primary-50 dark:active:bg-surface-700"
            :class="{ 'opacity-50': fromSelection(loginStore.userInfo)?.canFreeDrink === 'X', 'pointer-events-none': fromSelection(loginStore.userInfo)?.canFreeDrink === 'X' }"
            @click="freeDiscount">免費招待</button>
          <!-- 環保折扣 -->
          <button
class="2xl:w-28 lg:w-20 lg:h-20 2xl:h-28 xl:w-24 xl:h-24 md:w-14 md:h-14 w-11 h-11 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-xl  text-surface-700 dark:text-surface-100 font-bold 2xl:text-2xl xl:text-xl lg:text-lg md:text-sm sm:text-xs text-[8px] px-0.5 select-none active:bg-primary-50 dark:active:bg-surface-700"
            @click="ecoDiscount">{{
              discountStore.oftenUseDiscount[0].name }}</button>
          <!-- 瓶裝折扣 -->
          <button
class="2xl:w-28 lg:w-20 lg:h-20 2xl:h-28 xl:w-24 xl:h-24 md:w-14 md:h-14 w-11 h-11 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-xl  text-surface-700 dark:text-surface-100 font-bold 2xl:text-2xl xl:text-xl lg:text-lg md:text-sm sm:text-xs text-[8px] px-0.5 select-none active:bg-primary-50 dark:active:bg-surface-700"
            @click="bottleDiscount">{{
              discountStore.oftenUseDiscount[1].name }}</button>
          <!-- 開收銀機 -->
          <button
class="2xl:w-28 lg:w-20 lg:h-20 2xl:h-28 xl:w-24 xl:h-24 md:w-14 md:h-14 w-11 h-11 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-xl  text-surface-700 dark:text-surface-100 font-bold 2xl:text-2xl xl:text-xl lg:text-lg md:text-sm sm:text-xs text-[8px] px-0.5 select-none active:bg-primary-50 dark:active:bg-surface-700"
            :class="{ 'opacity-50': fromSelection(loginStore.userInfo)?.canOpenCashier === 'X', 'pointer-events-none': fromSelection(loginStore.userInfo)?.canOpenCashier === 'X' }"
            @click="openCashier">開收銀機</button>
          <!-- 優惠券 -->
          <button
class="2xl:w-28 lg:w-20 lg:h-20 2xl:h-28 xl:w-24 xl:h-24 md:w-14 md:h-14 w-11 h-11 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-xl  text-surface-700 dark:text-surface-100 font-bold 2xl:text-2xl xl:text-xl lg:text-lg md:text-sm sm:text-xs text-[8px] px-0.5 select-none active:bg-primary-50 dark:active:bg-surface-700"
            @click="openDiscountMenu">優惠券</button>
          <!-- 優惠券選單 -->
          <!-- P8：組件庫替換——el-dialog、el-pagination 換法跟上面付款
               方式選單一致。 -->
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
                <!-- 現金折扣券分頁器 -->
                <div class="flex h-10 w-full items-center justify-around rounded-lg bg-surface-100 px-2 text-sm text-surface-600">
                  <p>{{ `共 ${discountStore.moneyDiscount.length} 樣` }}</p>
                  <div class="flex items-center gap-2">
                    <button
                      type="button" class="rounded border border-surface-300 px-2 disabled:opacity-40"
                      :disabled="moneyDiscountCurrentPage <= 1" @click="handleMoneyDiscountCurrentChange(moneyDiscountCurrentPage - 1)">‹</button>
                    <button
                      type="button" class="rounded border border-surface-300 px-2 disabled:opacity-40"
                      :disabled="moneyDiscountCurrentPage >= moneyDiscountPageCount" @click="handleMoneyDiscountCurrentChange(moneyDiscountCurrentPage + 1)">›</button>
                  </div>
                  <p>{{ `${discountStore.moneyDiscount.length > 0 ? moneyDiscountCurrentPage : 0}/${moneyDiscountPageCount}頁` }}</p>
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
                <!-- 折數折扣券分頁器 -->
                <div class="flex h-10 w-full items-center justify-around rounded-lg bg-surface-100 px-2 text-sm text-surface-600">
                  <p>{{ `共 ${discountStore.percentDiscount.length} 樣` }}</p>
                  <div class="flex items-center gap-2">
                    <button
                      type="button" class="rounded border border-surface-300 px-2 disabled:opacity-40"
                      :disabled="percentDiscountCurrentPage <= 1" @click="handlePercentDiscountCurrentChange(percentDiscountCurrentPage - 1)">‹</button>
                    <button
                      type="button" class="rounded border border-surface-300 px-2 disabled:opacity-40"
                      :disabled="percentDiscountCurrentPage >= percentDiscountPageCount" @click="handlePercentDiscountCurrentChange(percentDiscountCurrentPage + 1)">›</button>
                  </div>
                  <p>{{ `${discountStore.percentDiscount.length > 0 ? percentDiscountCurrentPage : 0}/${percentDiscountPageCount}頁` }}</p>
                </div>
              </div>
            </div>
            <div class="mt-4 flex justify-end gap-2">
              <button type="button" class="rounded-lg border border-surface-300 px-4 py-2 text-sm font-bold text-surface-700 hover:bg-surface-100" @click="closeDiscount">取消</button>
              <button type="button" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700" @click="useDiscount">確定</button>
            </div>
          </ModalDialog>
          <!-- 九折 -->
          <button
class="2xl:w-28 lg:w-20 lg:h-20 2xl:h-28 xl:w-24 xl:h-24 md:w-14 md:h-14 w-11 h-11 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-xl  text-surface-700 dark:text-surface-100 font-bold 2xl:text-2xl xl:text-xl lg:text-lg md:text-sm sm:text-xs text-[8px] px-0.5 select-none active:bg-primary-50 dark:active:bg-surface-700"
            @click="oftenUseDiscount1">{{
              discountStore.oftenUseDiscount[2].name }}</button>
          <!-- 八五折 -->
          <button
class="2xl:w-28 lg:w-20 lg:h-20 2xl:h-28 xl:w-24 xl:h-24 md:w-14 md:h-14 w-11 h-11 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-xl  text-surface-700 dark:text-surface-100 font-bold 2xl:text-2xl xl:text-xl lg:text-lg md:text-sm sm:text-xs text-[8px] px-0.5 select-none active:bg-primary-50 dark:active:bg-surface-700"
            @click="oftenUseDiscount2">{{
              discountStore.oftenUseDiscount[3].name }}</button>
          <!-- 員工八折 -->
          <button
class="2xl:w-28 lg:w-20 lg:h-20 2xl:h-28 xl:w-24 xl:h-24 md:w-14 md:h-14 w-11 h-11 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-xl  text-surface-700 dark:text-surface-100 font-bold 2xl:text-2xl xl:text-xl lg:text-lg md:text-sm sm:text-xs text-[8px] px-0.5 select-none active:bg-primary-50 dark:active:bg-surface-700"
            @click="oftenUseDiscount3">{{
              discountStore.oftenUseDiscount[4].name }}</button>
        </div>
        <!-- 數量設置鍵盤 -->
        <div class="lg:w-[30%] h-[95%] w-[35%] mt-2 bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-xl">
          <div class="w-full h-1/5 flex items-center justify-around">
            <input
v-model="drinkStore.drinkCount" oninput="value=value.replace(/[^\d]/g,'')" maxlength="5" disabled
              class="w-[65%] h-4/5 ml-2 border border-surface-300 dark:border-surface-700 text-right p-2 text-surface-700 dark:text-surface-100 font-bold text-3xl 	" />
            <button
class="w-[20%] lg:h-4/5 h-[70%] ml-2 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-100 border border-surface-300 dark:border-surface-700 xl:rounded-xl lg:rounded-lg rounded-md font-bold xl:text-3xl lg:text-2xl select-none	 active:bg-primary-50 dark:active:bg-surface-700"
              @click="addCount('delete')">←</button>
          </div>
          <div class="w-full h-1/5 flex items-center justify-around ">
            <button
class="w-[20%]  bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-100 border border-surface-300 dark:border-surface-700 xl:rounded-xl lg:rounded-lg font-bold 2xl:text-xl xl:text-lg lg:text-sm md:text-xs text-[10px] rounded-md select-none active:bg-primary-50 dark:active:bg-surface-700"
              @click="addCount('7')">7</button>
            <button
class="w-[20%]  bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-100 border border-surface-300 dark:border-surface-700 xl:rounded-xl lg:rounded-lg font-bold 2xl:text-xl xl:text-lg lg:text-sm md:text-xs text-[10px] rounded-md select-none active:bg-primary-50 dark:active:bg-surface-700"
              @click="addCount('8')">8</button>
            <button
class="w-[20%]  bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-100 border border-surface-300 dark:border-surface-700 xl:rounded-xl lg:rounded-lg font-bold 2xl:text-xl xl:text-lg lg:text-sm md:text-xs text-[10px] rounded-md select-none active:bg-primary-50 dark:active:bg-surface-700"
              @click="addCount('9')">9</button>
            <!-- 「新增」是這組鍵盤的確認動作（把目前選好的品項＋杯數
                 加進待付款清單），跟純粹輸入數字的按鍵不同語意，維持
                 品牌色。 -->
            <button
class="w-[20%] bg-primary-600 text-white hover:bg-primary-700 xl:rounded-xl lg:rounded-lg font-bold 2xl:text-xl xl:text-lg lg:text-sm md:text-xs text-[10px] rounded-md select-none"
              @click="addNewDrink">新增</button>
          </div>
          <div class="w-full h-1/5 flex items-center justify-around ">
            <button
class="w-[20%]  bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-100 border border-surface-300 dark:border-surface-700 xl:rounded-xl lg:rounded-lg font-bold 2xl:text-xl xl:text-lg lg:text-sm md:text-xs text-[10px] rounded-md select-none active:bg-primary-50 dark:active:bg-surface-700"
              @click="addCount('4')">4</button>
            <button
class="w-[20%]  bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-100 border border-surface-300 dark:border-surface-700 xl:rounded-xl lg:rounded-lg font-bold 2xl:text-xl xl:text-lg lg:text-sm md:text-xs text-[10px] rounded-md select-none active:bg-primary-50 dark:active:bg-surface-700"
              @click="addCount('5')">5</button>
            <button
class="w-[20%] bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-100 border border-surface-300 dark:border-surface-700 xl:rounded-xl lg:rounded-lg font-bold 2xl:text-xl xl:text-lg lg:text-sm md:text-xs text-[10px] rounded-md select-none active:bg-primary-50 dark:active:bg-surface-700"
              @click="addCount('6')">6</button>
            <button
class="w-[20%]  bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-100 border border-surface-300 dark:border-surface-700 xl:rounded-xl lg:rounded-lg font-bold 2xl:text-xl xl:text-lg lg:text-sm md:text-xs text-[10px] rounded-md select-none active:bg-primary-50 dark:active:bg-surface-700"
              @click="drinkStore.drinkCount = '10'">10</button>
          </div>
          <div class="w-full h-1/5 flex items-center justify-around ">
            <button
class="w-[20%]  bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-100 border border-surface-300 dark:border-surface-700 xl:rounded-xl lg:rounded-lg font-bold 2xl:text-xl xl:text-lg lg:text-sm md:text-xs text-[10px] rounded-md select-none active:bg-primary-50 dark:active:bg-surface-700"
              @click="addCount('1')">1</button>
            <button
class="w-[20%]  bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-100 border border-surface-300 dark:border-surface-700 xl:rounded-xl lg:rounded-lg font-bold 2xl:text-xl xl:text-lg lg:text-sm md:text-xs text-[10px] rounded-md select-none active:bg-primary-50 dark:active:bg-surface-700"
              @click="addCount('2')">2</button>
            <button
class="w-[20%]  bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-100 border border-surface-300 dark:border-surface-700 xl:rounded-xl lg:rounded-lg font-bold 2xl:text-xl xl:text-lg lg:text-sm md:text-xs text-[10px] rounded-md select-none active:bg-primary-50 dark:active:bg-surface-700"
              @click="addCount('3')">3</button>
            <button
class="w-[20%]  bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-100 border border-surface-300 dark:border-surface-700 xl:rounded-xl lg:rounded-lg font-bold 2xl:text-xl xl:text-lg lg:text-sm md:text-xs text-[10px] rounded-md select-none active:bg-primary-50 dark:active:bg-surface-700"
              @click="drinkStore.drinkCount = '50'">50</button>
          </div>
          <div class="w-full h-1/5 flex items-center justify-around ">
            <button
class="w-[20%]  bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-100 border border-surface-300 dark:border-surface-700 xl:rounded-xl lg:rounded-lg font-bold 2xl:text-xl xl:text-lg lg:text-sm md:text-xs text-[10px] rounded-md select-none active:bg-primary-50 dark:active:bg-surface-700"
              @click="addCount('0')">0</button>
            <button
class="w-[20%]  bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-100 border border-surface-300 dark:border-surface-700 xl:rounded-xl lg:rounded-lg font-bold 2xl:text-xl xl:text-lg lg:text-sm md:text-xs text-[10px] rounded-md select-none active:bg-primary-50 dark:active:bg-surface-700"
              @click="addCount('00')">00</button>
            <button
class="w-[20%]  bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-100 border border-surface-300 dark:border-surface-700 xl:rounded-xl lg:rounded-lg font-bold 2xl:text-xl xl:text-lg lg:text-sm md:text-xs text-[10px] rounded-md select-none active:bg-primary-50 dark:active:bg-surface-700"
              @click="drinkStore.drinkCount = '0'">重設</button>
            <button
class="w-[20%]  bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-100 border border-surface-300 dark:border-surface-700 xl:rounded-xl lg:rounded-lg font-bold 2xl:text-xl xl:text-lg lg:text-sm md:text-xs text-[10px] rounded-md select-none active:bg-primary-50 dark:active:bg-surface-700"
              @click="drinkStore.drinkCount = '100'">100</button>
          </div>
        </div>
      </div>
    </div>
    <!-- 右半部 -->
    <div class="w-2/5  border-solid border-l-2 border-surface-200 dark:border-surface-800 ">
      <!-- 飲料類型 -->
      <div class="w-full h-[308px] ">
        <DrinkType />
      </div>
      <!-- 飲料品項 -->
      <div class="w-full h-[308px]">
        <DrinkMenu />
      </div>
      <!-- 飲料客製化 -->
      <div class="w-full h-[263px]">
        <DrinkCustomized />
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
import PaymentPanel, { type TenderDraft } from '@/components/checkout/PaymentPanel.vue'
import ShiftPanel from '@/components/checkout/ShiftPanel.vue'
import ParkedOrdersPanel from '@/components/checkout/ParkedOrdersPanel.vue'
import InvoiceCarrierPanel from '@/components/checkout/InvoiceCarrierPanel.vue'
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
import { fromSelection } from '@/utils/selection'
import { getBusinessDate, priceLine, toggleContainer, toggleFree, toggleRate, type LineDiscountFlags, type OftenUseRates } from '@pos/domain'
import type { AppliedCoupon, InvoiceCarrier } from '@pos/contract'
import { buildCreateOrderRequest } from '@/api/orders'
import { enqueueOrder } from '@/offline/outbox'
import { useOrderSync } from '@/offline/useOrderSync'

const orderSync = useOrderSync()

// 當前時間相關功能
// 存放當前時間
const time = ref('')
// 頁面刷新時當前時間開始跑
onMounted(() => {
  setInterval(() => {
    time.value = getTime()
  }, 1000);
})
// 離開頁面時當前時間清除
// 這裡的 setInterval 從未把回傳的計時器 id 存起來，所以 clearInterval
// 實際上從來沒有真正清除過計時器（呼叫時沒有 id 可清，等同無作用）——
// 這是型別遷移過程中新發現、原本 18 項缺陷目錄未收錄的問題，P0 只如實
// 標記型別（傳入 undefined 滿足簽章、不改變「沒有真的清除」這個行為），
// 修正留待 P1 一併處理計時器生命週期。
onUnmounted(() => {
  clearInterval(undefined)
})

// D-13 修復：drink.ts 的 store 不再直接彈窗（狀態層不依賴 UI 套件），
// 只在待付款清單清空時遞增 cartClearedNotice；實際顯示提示的責任交給
// 這個會渲染清單的元件自己 watch。
//
// P8：ElMessageBox.alert／confirm／ElMessage 全部改用 composables/
// useConfirm.ts（alert()／confirm()）與 useToast.ts（見 views/order/
// index.vue、views/home/drinkCustomized/index.vue 的說明，同一套
// 基礎設施）。alert() 沒有 `.catch()`——原本 ElMessageBox.alert 也沒有，
// 呼叫端不需要處理「使用者拒絕了一個只有一顆按鈕的通知」這種不存在的
// 狀況，見 useConfirm.ts 的說明。
watch(() => drinkStore.cartClearedNotice, () => {
  void alert({
    title: '通知',
    description: '待付款清單已無品項，套用優惠券以及加購的袋子數量已重置',
    confirmText: '繼續選取品項',
  })
})

// 杯數相關功能
// 新增飲料杯數
const addCount = (num: string) => {
  // 如果按刪除鍵刪除最右側的數字
  // 如果刪除後只剩一個數字，則重置為0
  if (num === 'delete') {
    if (drinkStore.drinkCount === '' || drinkStore.drinkCount.length === 1) {
      drinkStore.drinkCount = '0'
      return
    } else {
      drinkStore.drinkCount = drinkStore.drinkCount.slice(0, -1)
      return
    }
  }
  // 防止杯數超出5位數
  if (num === '00') {
    if (drinkStore.drinkCount.length >= 4) {
      return
    }
  } else {
    if (drinkStore.drinkCount.length >= 5) {
      return
    }
  }
  // 如果當前杯數為0，則新增杯數時將預設的0清除
  if (drinkStore.drinkCount === '0') {
    drinkStore.drinkCount = ''
    // 如果杯數為0，則不允許按0  
    if (num === '0' || num === '00') {
      drinkStore.drinkCount = '0'
      return
    }
  }
  // 新增選擇的數字在杯數上
  drinkStore.drinkCount += num
}

// 添加至待付款區相關功能
// 添加飲料的資訊進入store
const addNewDrink = () => {
  // 如果沒選擇品項不能送單
  if (fromSelection(drinkStore.drinkItem) === undefined) {
    void alert({ title: '通知', description: '飲品未選擇', confirmText: '繼續選取' })
    return
  }
  // 如果需客製化但沒選擇糖度不能送單
  if (fromSelection(drinkStore.drinkItem)?.customized != 'none') {
    if (drinkStore.drinkSetSugar === '') {
      void alert({ title: '通知', description: '糖度未選擇', confirmText: '繼續選取' })
      return
    }
  }
  // 如果需客製化但沒選擇冰塊不能送單
  if (fromSelection(drinkStore.drinkItem)?.customized != 'none') {
    if (drinkStore.drinkSetIce === '') {
      void alert({ title: '通知', description: '冰塊未選擇', confirmText: '繼續選取' })
      return
    }
  }
  // 如果需客製化但沒選擇容器大小不能送單
  if (fromSelection(drinkStore.drinkItem)?.customized != 'none') {
    if (drinkStore.drinkSetSize === '') {
      void alert({ title: '通知', description: '容器大小未選擇', confirmText: '繼續選取' })
      return
    }
  } // 如果不需客製化則容器大小固定為L杯
  else {
    drinkStore.drinkSetSize = 'L杯'
  }
  // 如果杯數小於一杯不能送單
  if (Number(drinkStore.drinkCount) < 1) {
    void alert({ title: '通知', description: '飲料杯數不能小於一杯', confirmText: '繼續設定' })
    return
  }
  // 送出訂單的格式
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
  // 送出訂單至待付款區
  drinkStore.drinkNotPay.push(newDrink)
  // 成功送單後將菜單區重置
  drinkStore.drinkTypeMenu = ''
  drinkStore.drinkItem = []
  drinkStore.drinkSetSugar = ''
  drinkStore.drinkSetIce = ''
  drinkStore.drinkSetSize = ''
  drinkStore.drinkAddList = []
  drinkStore.drinkCount = '0'
}

// 刪除待付款的清單項目相關功能
// 清除待付款的清單所有項目
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
// 定義已勾選的待付款項目的清單
const drinkSelectList = ref<CartLineItem[]>([])
// P8：組件庫替換——el-table 的 type="selection" 勾選欄改用原生
// checkbox（見上方模板），這裡改成直接操作 drinkSelectList 本身，
// 取代原本 el-table 專屬的 @selection-change 事件。
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
// 清除待付款的清單已選項目
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

// 內用／外帶（P13：規劃書 §10 P0「內用外帶」）。預設「外帶」——這個
// 專案原本就只有加購袋子這個間接暗示外帶的欄位，多數訂單本來就是
// 外帶，改成明確的頻道選擇後，這裡的預設值只是操作上少按一次，不是
// 業務規則本身要求外帶優先。
const orderChannel = ref<OrderChannel>('外帶')

// 發票載具（P15：規劃書 §10 P0「發票」）。預設「無載具」（紙本發票）。
// 跟 orderChannel 不同，這裡選填的是「這一次交易」的個別需求（客人
// 這次要不要用手機條碼），下一位客人多半不會延續同一個選擇，所以在
// submitPayment() 送出訂單後會重置回預設值，orderChannel 則刻意不重置
// （見 orderChannel 的說明）。
const invoiceCarrier = ref<InvoiceCarrier>({ type: '無載具' })

// 控制袋子數量相關功能
// 控制加購袋子視窗
const dialogBag = ref(false)
// 定義袋子數量
const bagCount = ref(1)
// 打開加購袋子選單
const openBagDialog = () => {
  bagCount.value = 1
  dialogBag.value = true
}
// 關閉修改選單
// P8：原本這裡取消也會跳一次 ElMessage.error('取消操作')——取消操作
// 本身不是錯誤，這裡跟訂單頁／優惠設定頁的作法一致，不再為單純按下
// 取消額外顯示提示，見 views/order/index.vue 的說明。
const closeBagCount = () => {
  dialogBag.value = false
}
// 修改目前加購的袋子數量
const changeBagCount = () => {
  drinkStore.currentBagCount = bagCount.value
  dialogBag.value = false
  showToast('修改加購袋子數量成功', 'success')
}

// 開啟收銀機（P16：規劃書 §10 P0「周邊模擬」；載具已改由
// InvoiceCarrierPanel 處理，見 P15 的說明）。
//
// 這顆按鈕原本只彈一句「開啟收銀機」就結束，沒有真的模擬任何周邊
// 裝置的實際用途，也沒有區分「結帳當下開錢箱」跟「沒有交易、單純想
// 開錢箱」這兩種完全不同的情境——後者（例如幫客人換零錢、盤點現金）
// 在真正的收銀機上是需要交代理由的操作，沒有這道防線的話，錢箱可以
// 被任何人在沒有交易紀錄的情況下隨時打開，是實際的內控缺口。這裡
// 用 prompt() 要求輸入理由才會「開啟」，理由跟操作時間目前只印在
// 瀏覽器主控台（模擬印在稽核用的交易紀錄紙帶上），沒有另外存進
// 伺服端——單店單機情境下，這個成本比照本專案其他「延後到有真正
// 需求才加後端」的取捨（見 D-04／D-10 的說明），不是遺漏。
const openCashier = async () => {
  const reason = await prompt({
    title: '開啟收銀機',
    description: '沒有對應交易的開錢箱動作需要記錄理由，方便之後對帳與稽核',
    label: '理由',
    placeholder: '例如：協助客人換零錢、盤點現金',
    confirmText: '開啟',
  })
  if (reason === null) return
  console.info(`[收銀機] ${getDate()} ${getTime()} ${fromSelection(loginStore.userInfo)?.name} 開啟收銀機：${reason}`)
  showToast('收銀機已開啟', 'success')
}

// 折扣相關功能
// 免費招待
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

// 對目前已勾選的品項套用同一種旗標切換，並用 priceLine() 重新計算金額。
// 取代原本六個函式各自手動改欄位的寫法（見 pricing.ts 的說明），修復
// D-01（套用與取消計算式不對稱）與 D-02（清除折數折扣時欄位名稱打錯）。
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

// 優惠券相關功能
// 控制優惠券視窗開關
const dialogDiscount = ref(false)
// 打開折價券菜單
const openDiscountMenu = () => {
  if (drinkStore.drinkNotPay.length <= 0) {
    void alert({ title: '通知', description: '待付款清單是空的無法使用優惠券', confirmText: '繼續選取' })
  } else {
    discountStore.moneySelectingDiscountId = discountStore.moneyDiscountId
    discountStore.percentSelectingDiscountId = discountStore.percentDiscountId
    dialogDiscount.value = true
  }
}
// 切換至現金折價券介面
const changeMoneyDiscount = () => {
  discountStore.discountMenu = 0
  discountStore.percentSelectingDiscountId = 0
}
// 切換至打折折價券介面
const changePercentDiscount = () => {
  discountStore.discountMenu = 1
  discountStore.moneySelectingDiscountId = 0
}
// 選取現金折價券
const selectMoneyDiscount = (id: FormNumeric) => {
  if (discountStore.moneySelectingDiscountId === id) {
    discountStore.moneySelectingDiscountId = 0
  } else {
    discountStore.moneySelectingDiscountId = id
  }
}
// 現金折扣券分頁器
// 當前現金折扣券所選的頁數
const moneyDiscountCurrentPage = ref(1)
// 控制當前所選的頁數
const handleMoneyDiscountCurrentChange = (page: number) => {
  moneyDiscountCurrentPage.value = page
}
// 計算並切換當前現金折扣券頁面內容
const sliceMoneyDiscount = computed(() => {
  return discountStore.moneyDiscount.slice((moneyDiscountCurrentPage.value - 1) * 5, moneyDiscountCurrentPage.value * 5)
})
const moneyDiscountPageCount = computed(() => Math.max(Math.ceil(discountStore.moneyDiscount.length / 5), 1))
// 選取打折折價券
const selectPercentDiscount = (id: FormNumeric) => {
  if (discountStore.percentSelectingDiscountId === id) {
    discountStore.percentSelectingDiscountId = 0
  } else {
    discountStore.percentSelectingDiscountId = id
  }
}
// 折數折扣券分頁器
// 當前折數折扣券所選的頁數
const percentDiscountCurrentPage = ref(1)
// 控制當前所選的頁數
const handlePercentDiscountCurrentChange = (page: number) => {
  percentDiscountCurrentPage.value = page
}
// 計算並切換當前折數折扣券頁面內容
const slicePercentDiscount = computed(() => {
  return discountStore.percentDiscount.slice((percentDiscountCurrentPage.value - 1) * 5, percentDiscountCurrentPage.value * 5)
})
const percentDiscountPageCount = computed(() => Math.max(Math.ceil(discountStore.percentDiscount.length / 5), 1))
// 關閉優惠券選單
const closeDiscount = () => {
  dialogDiscount.value = false
}
// 使用優惠券
const useDiscount = () => {
  // 使用現金折價券
  if (discountStore.moneySelectingDiscountId != 0) {
    discountStore.moneyDiscountId = discountStore.moneySelectingDiscountId
    discountStore.currentMoneyDiscount = discountStore.moneyDiscount.find(item => item.id === discountStore.moneyDiscountId)!.discountMoney
    const currentMoneyDiscountName = discountStore.moneyDiscount.find(item => item.id === discountStore.moneyDiscountId)!.name
    discountStore.currentDiscountName = currentMoneyDiscountName
    discountStore.percentDiscountId = 0
    dialogDiscount.value = false
    showToast(`使用${currentMoneyDiscountName}成功`, 'success')
  }
  // 使用折數折價券
  if (discountStore.percentSelectingDiscountId != 0) {
    discountStore.percentDiscountId = discountStore.percentSelectingDiscountId
    discountStore.currentPercentDiscount = discountStore.percentDiscount.find(item => item.id === discountStore.percentDiscountId)!.discountMoney
    const currentPercentDiscountName = discountStore.percentDiscount.find(item => item.id === discountStore.percentDiscountId)!.name
    discountStore.currentDiscountName = currentPercentDiscountName
    discountStore.moneyDiscountId = 0
    dialogDiscount.value = false
    showToast(`使用${currentPercentDiscountName}成功`, 'success')
  }
  // 取消套用任何折價券
  if (discountStore.moneySelectingDiscountId === 0 && discountStore.percentSelectingDiscountId === 0) {
    discountStore.currentMoneyDiscount = 0
    discountStore.moneyDiscountId = 0
    discountStore.percentDiscountId = 0
    discountStore.currentDiscountName = ''
    dialogDiscount.value = false
    showToast('成功取消已套用的優惠券', 'success')
  }
}

// 送出訂單相關功能
//
// P6（規劃書 §10 P0「混合支付」）：原本「送出訂單」是單一按鈕——先跳
// 一次「確定要送出訂單嗎?」的通用確認框，再跳一次依 useMethod 而定
// 的「應支付…」提示，兩次都跟實際付款方式無關，純粹是操作確認。現在
// 改用 PaymentPanel（見 components/checkout/PaymentPanel.vue）取代
// 這兩層確認：面板本身要求「湊到剩餘應付為 0 才能按確認送出」，這件
// 事本身就是不可能誤觸的確認動作，不需要額外再包一層通用確認框。
const dialogPayment = ref(false)
// 打開結帳面板（先擋掉購物車是空的情況，這是舊版「送出訂單」按鈕
// 原本就有的檢查，行為不變）
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
// 結帳面板確認送出：這裡才是真正組出訂單、送進離線佇列的地方。
const submitPayment = async (tenders: TenderDraft[]) => {
  dialogPayment.value = false

  // 送出訂單的格式；orderPayment 是顯示用摘要（多筆 tender 用頓號
  // 連接），跟伺服端 orders.ts 算出來的摘要規則一致。
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
    orderPayment: tenders.map((tender) => tender.method).join('、'),
    orderDiscount: drinkStore.useDiscountPrice,
    orderPaymentPrice: drinkStore.drinkPayPrice,
    discountName: discountStore.currentDiscountName === '' ? '無' : discountStore.currentDiscountName,
    refundedAmount: 0,
    voidReason: null,
    voidedBy: null,
    voidedAt: null,
    // 送單當下先佔位；伺服端配發的真正發票號碼稍後由 SyncWorker
    // 同步回來（見 offline/sync-worker.ts 的 reconcileOrderId 說明，
    // 目前發票號碼只顯示在訂單列表頁，不影響離線佇列本身）。
    invoiceNumber: '',
    invoiceCarrier: invoiceCarrier.value,
  }
  orderStore.order.push(toPayOrder)
  showToast('訂單送出成功', 'success')

  // P5：訂單層級折價券只送「套用了哪張」，折抵金額由伺服端查真正
  // 的折價券資料重算（見 api/orders.ts 的說明）。要在這裡（清空
  // 待付款清單、連帶重置 discountStore 的選取狀態之前）就讀出
  // 目前實際套用的是哪一張，晚一步讀就會被 watch(drinkNotPay) 的
  // 重置邏輯清空。
  const appliedCoupon: AppliedCoupon =
    discountStore.moneyDiscountId !== 0
      ? { type: 'money', couponId: String(discountStore.moneyDiscountId) }
      : discountStore.percentDiscountId !== 0
        ? { type: 'percent', couponId: String(discountStore.percentDiscountId) }
        : { type: 'none' }

  // P3：訂單先入本機離線佇列，不管有沒有網路都會成功——沖泡飲料、
  // 收現金這些現場動作不能被 Wi-Fi 斷線卡住。SyncWorker（見
  // App.vue、src/offline/）背景把它送到伺服端；這裡額外呼叫一次
  // syncNow() 只是「有網路時不用乾等下一次輪詢」，不是同步送單
  // 成敗的必要步驟——就算這次呼叫本身也失敗，佇列裡的紀錄還在，
  // 之後照樣會被重試。用 toPayOrder.orderData（而不是待會就會被
  // 清空的 drinkStore.drinkNotPay）取品項清單。
  const request = buildCreateOrderRequest({
    businessDate: getBusinessDate(new Date()),
    staff: toPayOrder.staff,
    lines: toPayOrder.orderData,
    bagCount: toPayOrder.orderBagCount,
    tenders,
    appliedCoupon,
    orderChannel: toPayOrder.orderChannel,
    invoiceCarrier: toPayOrder.invoiceCarrier,
  })
  void enqueueOrder(request, toPayOrder.orderId).then(() => orderSync.syncNow())
  // 載具是這一次交易的個別需求，下一位客人多半不會延續同一個選擇
  // （見 invoiceCarrier 的說明），送出後重置回預設值。
  invoiceCarrier.value = { type: '無載具' }

  drinkStore.drinkNotPay = []
}
</script>

<style lang="scss" scoped></style>