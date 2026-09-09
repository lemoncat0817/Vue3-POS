<template>
  <div class="flex w-full flex-col items-center bg-surface-50 dark:bg-surface-950 px-4 py-8">
    <div class="flex w-full max-w-7xl flex-col gap-6">
      <div class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-primary-100 dark:bg-primary-950/60 px-3 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300 border border-primary-200/50 dark:border-primary-800/40">
              <Receipt class="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
              ORDER MANAGEMENT
            </span>
            <span class="inline-flex items-center gap-1 rounded-full bg-success-100 dark:bg-success-950/60 px-2.5 py-0.5 text-[11px] font-semibold text-success-700 dark:text-success-400 border border-success-200/50 dark:border-success-800/40">
              <span class="h-1.5 w-1.5 rounded-full bg-success-500 animate-pulse"></span>
              雲端連線同步中
            </span>
          </div>
          <h1 class="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-surface-900 dark:text-surface-100">訂單</h1>
          <p class="mt-1 text-sm text-surface-500 dark:text-surface-400">查看、篩選、管理已送出的訂單</p>
        </div>

        <!-- Quick Status Chips Filter -->
        <div class="flex flex-wrap items-center gap-1.5 bg-surface-100 dark:bg-surface-900 p-1.5 rounded-xl border border-surface-200 dark:border-surface-800 text-xs font-semibold">
          <button
            type="button"
            class="rounded-lg px-3 py-1.5 transition-all"
            :class="!filterOrderStatus && !filterOrderPayMethod ? 'bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 shadow-sm font-bold' : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'"
            @click="resetFilter">
            全部訂單
          </button>
          <button
            type="button"
            class="rounded-lg px-3 py-1.5 transition-all flex items-center gap-1"
            :class="filterOrderStatus === '已完成' ? 'bg-success-500 text-white shadow-sm font-bold' : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'"
            @click="quickFilterStatus('已完成')">
            <CheckCircle2 class="h-3.5 w-3.5" />
            已完成
          </button>
          <button
            type="button"
            class="rounded-lg px-3 py-1.5 transition-all flex items-center gap-1"
            :class="filterOrderStatus === '已取消' ? 'bg-danger-500 text-white shadow-sm font-bold' : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'"
            @click="quickFilterStatus('已取消')">
            <AlertTriangle class="h-3.5 w-3.5" />
            已取消 / 作廢
          </button>
          <button
            type="button"
            class="rounded-lg px-3 py-1.5 transition-all flex items-center gap-1"
            :class="filterOrderPayMethod === '現金' ? 'bg-primary-500 text-white shadow-sm font-bold' : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'"
            @click="quickFilterPayment('現金')">
            <DollarSign class="h-3.5 w-3.5" />
            現金付款
          </button>
        </div>
      </div>

      <!-- KPI Summary Cards Banner -->
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
        <!-- Card 1: 訂單總量 -->
        <div class="relative overflow-hidden rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4 shadow-sm transition-all hover:shadow-md">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">總訂單筆數</span>
            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-200/50 dark:border-primary-800/40">
              <ShoppingBag class="h-4.5 w-4.5" />
            </div>
          </div>
          <div class="mt-3 flex items-baseline gap-2">
            <span class="text-2xl font-black text-surface-900 dark:text-surface-100">{{ orderStats.totalCount }}</span>
            <span class="text-xs font-semibold text-surface-500 dark:text-surface-400">筆</span>
          </div>
          <p class="mt-1 text-xs text-surface-400 dark:text-surface-500">累計建立的所有訂單</p>
        </div>

        <!-- Card 2: 營收淨額 -->
        <div class="relative overflow-hidden rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4 shadow-sm transition-all hover:shadow-md">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">營收淨額</span>
            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-success-50 dark:bg-success-950/60 text-success-600 dark:text-success-400 border border-success-200/50 dark:border-success-800/40">
              <DollarSign class="h-4.5 w-4.5" />
            </div>
          </div>
          <div class="mt-3 flex items-baseline gap-1">
            <span class="text-xs font-bold text-success-600 dark:text-success-400">$</span>
            <span class="text-2xl font-black text-surface-900 dark:text-surface-100">{{ orderStats.totalRevenue.toLocaleString() }}</span>
            <span class="text-xs font-semibold text-surface-500 dark:text-surface-400">元</span>
          </div>
          <p class="mt-1 text-xs text-surface-400 dark:text-surface-500">已扣除退款與作廢</p>
        </div>

        <!-- Card 3: 訂單完成率 -->
        <div class="relative overflow-hidden rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4 shadow-sm transition-all hover:shadow-md">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">有效完成</span>
            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-info-50 dark:bg-info-950/60 text-info-600 dark:text-info-400 border border-info-200/50 dark:border-info-800/40">
              <CheckCircle2 class="h-4.5 w-4.5" />
            </div>
          </div>
          <div class="mt-3 flex items-baseline gap-2">
            <span class="text-2xl font-black text-surface-900 dark:text-surface-100">{{ orderStats.completedCount }}</span>
            <span class="text-xs font-bold text-success-600 dark:text-success-400">({{ orderStats.completeRate }}%)</span>
          </div>
          <p class="mt-1 text-xs text-surface-400 dark:text-surface-500">正常出餐結單筆數</p>
        </div>

        <!-- Card 4: 異常紀錄 -->
        <div class="relative overflow-hidden rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4 shadow-sm transition-all hover:shadow-md">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">異常流向</span>
            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-warning-50 dark:bg-warning-950/60 text-warning-600 dark:text-warning-400 border border-warning-200/50 dark:border-warning-800/40">
              <RotateCcw class="h-4.5 w-4.5" />
            </div>
          </div>
          <div class="mt-3 flex items-baseline gap-1">
            <span class="text-2xl font-black text-surface-900 dark:text-surface-100">{{ orderStats.voidCount }}</span>
            <span class="text-xs font-semibold text-danger-500">作廢</span>
            <span class="mx-1 text-surface-300 dark:text-surface-700">/</span>
            <span class="text-2xl font-black text-surface-900 dark:text-surface-100">{{ orderStats.refundCount }}</span>
            <span class="text-xs font-semibold text-warning-500">退款</span>
          </div>
          <p class="mt-1 text-xs text-surface-400 dark:text-surface-500">主管授權與客訴處理</p>
        </div>
      </div>

      <!-- Filter Card -->
      <div class="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4 shadow-sm">
        <div class="mb-3 flex items-center justify-between">
          <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">
            <Filter class="h-3.5 w-3.5 text-primary-500" />
            進階條件篩選
          </div>
          <span v-if="hasActiveFilter" class="rounded-md bg-primary-50 dark:bg-primary-950/50 px-2 py-0.5 text-[11px] font-semibold text-primary-600 dark:text-primary-400">
            篩選中
          </span>
        </div>

        <!-- UI-4：已套用的篩選條件原本只有一顆「篩選中」徽章，看不出
             現在到底套了哪幾條，也無法單獨移除其中一條。改成可個別
             移除的 chip 列，每個欄位各自的 × 只清那一格，「清除全部」
             等同於既有的重置篩選按鈕。 -->
        <div v-if="hasActiveFilter" class="mb-3 flex flex-wrap items-center gap-1.5">
          <button
            v-if="filterOrderId" type="button"
            class="inline-flex items-center gap-1 rounded-full bg-primary-50 dark:bg-primary-950/40 px-2.5 py-1 text-[11px] font-bold text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/60"
            @click="filterOrderId = ''">
            訂單編號：{{ filterOrderId }}<X class="h-3 w-3" />
          </button>
          <button
            v-if="filterOrderTime" type="button"
            class="inline-flex items-center gap-1 rounded-full bg-primary-50 dark:bg-primary-950/40 px-2.5 py-1 text-[11px] font-bold text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/60"
            @click="filterOrderTime = ''">
            訂單時間：{{ filterOrderTime }}<X class="h-3 w-3" />
          </button>
          <button
            v-if="filterOrderStaff" type="button"
            class="inline-flex items-center gap-1 rounded-full bg-primary-50 dark:bg-primary-950/40 px-2.5 py-1 text-[11px] font-bold text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/60"
            @click="filterOrderStaff = ''">
            服務人員：{{ filterOrderStaff }}<X class="h-3 w-3" />
          </button>
          <button
            v-if="filterOrderStatus" type="button"
            class="inline-flex items-center gap-1 rounded-full bg-primary-50 dark:bg-primary-950/40 px-2.5 py-1 text-[11px] font-bold text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/60"
            @click="filterOrderStatus = ''">
            訂單狀態：{{ filterOrderStatus }}<X class="h-3 w-3" />
          </button>
          <button
            v-if="filterOrderPayMethod" type="button"
            class="inline-flex items-center gap-1 rounded-full bg-primary-50 dark:bg-primary-950/40 px-2.5 py-1 text-[11px] font-bold text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/60"
            @click="filterOrderPayMethod = ''">
            付款方式：{{ filterOrderPayMethod }}<X class="h-3 w-3" />
          </button>
          <button type="button" class="text-[11px] font-bold text-surface-400 hover:text-danger-600 dark:hover:text-danger-400 underline underline-offset-2" @click="resetFilter">
            清除全部
          </button>
        </div>

        <div class="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <label class="flex flex-col gap-1 text-xs font-bold text-surface-600 dark:text-surface-300">
            <span class="flex items-center gap-1 text-surface-500 dark:text-surface-400">
              <Search class="h-3 w-3" />
              訂單編號
            </span>
            <input
              v-model="filterOrderId"
              class="rounded-xl border border-surface-300 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/60 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 outline-none transition-all focus:border-primary-500 focus:bg-white dark:focus:bg-surface-800 focus:ring-2 focus:ring-primary-500/20"
              placeholder="輸入訂單編號" />
          </label>
          <label class="flex flex-col gap-1 text-xs font-bold text-surface-600 dark:text-surface-300">
            <span class="flex items-center gap-1 text-surface-500 dark:text-surface-400">
              <Clock class="h-3 w-3" />
              訂單時間
            </span>
            <input
              v-model="filterOrderTime"
              class="rounded-xl border border-surface-300 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/60 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 outline-none transition-all focus:border-primary-500 focus:bg-white dark:focus:bg-surface-800 focus:ring-2 focus:ring-primary-500/20"
              placeholder="輸入訂單時間" />
          </label>
          <label class="flex flex-col gap-1 text-xs font-bold text-surface-600 dark:text-surface-300">
            <span class="flex items-center gap-1 text-surface-500 dark:text-surface-400">
              <User class="h-3 w-3" />
              服務人員
            </span>
            <input
              v-model="filterOrderStaff"
              class="rounded-xl border border-surface-300 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/60 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 outline-none transition-all focus:border-primary-500 focus:bg-white dark:focus:bg-surface-800 focus:ring-2 focus:ring-primary-500/20"
              placeholder="輸入服務人員" />
          </label>
          <label class="flex flex-col gap-1 text-xs font-bold text-surface-600 dark:text-surface-300">
            <span class="flex items-center gap-1 text-surface-500 dark:text-surface-400">
              <Tag class="h-3 w-3" />
              訂單狀態
            </span>
            <input
              v-model="filterOrderStatus"
              class="rounded-xl border border-surface-300 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/60 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 outline-none transition-all focus:border-primary-500 focus:bg-white dark:focus:bg-surface-800 focus:ring-2 focus:ring-primary-500/20"
              placeholder="輸入訂單狀態" />
          </label>
          <label class="flex flex-col gap-1 text-xs font-bold text-surface-600 dark:text-surface-300">
            <span class="flex items-center gap-1 text-surface-500 dark:text-surface-400">
              <CreditCard class="h-3 w-3" />
              付款方式
            </span>
            <input
              v-model="filterOrderPayMethod"
              class="rounded-xl border border-surface-300 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/60 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 outline-none transition-all focus:border-primary-500 focus:bg-white dark:focus:bg-surface-800 focus:ring-2 focus:ring-primary-500/20"
              placeholder="輸入付款方式" />
          </label>
          <div class="flex items-end">
            <button
              type="button"
              class="flex w-full items-center justify-center gap-1.5 rounded-xl border border-surface-300 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 px-3 py-2 text-sm font-bold text-surface-700 dark:text-surface-300 transition-all hover:bg-surface-200 dark:hover:bg-surface-700 active:scale-95"
              @click="resetFilter">
              <RotateCcw class="h-3.5 w-3.5" />
              重置篩選
            </button>
          </div>
        </div>
      </div>

      <!-- Main Order Table Card -->
      <div class="overflow-hidden rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">
              <tr>
                <th class="w-10 px-3 py-3.5 text-center">
                  <input
                    type="checkbox" aria-label="全選本頁訂單"
                    :checked="allVisibleSelected" :indeterminate="someVisibleSelected && !allVisibleSelected"
                    class="rounded text-primary-600 focus:ring-primary-500"
                    @change="toggleSelectAllVisible(($event.target as HTMLInputElement).checked)">
                </th>
                <th class="w-12 px-3 py-3.5 text-center" />
                <th v-for="header in leafHeaders" :key="header.id" class="px-4 py-3.5">
                  <!-- UI-4：header 不能直接用 {{ }} 文字插值——多數欄位
                       的 header 是純字串沒問題，但金額欄的 header 改用
                       render function（靠右對齊）之後，文字插值只會把
                       函式原始碼字串化印出來。跟 cell 一樣一律透過
                       FlexRender 呼叫，字串與函式兩種 columnDef.header
                       都能正確渲染。 -->
                  <FlexRender v-if="!header.isPlaceholder" :render="header.column.columnDef.header" :props="header.getContext()" />
                </th>
              </tr>
            </thead>
            <tbody
              :key="tableRenderKey"
              class="divide-y divide-surface-100 dark:divide-surface-800">
              <template v-if="table.getRowModel().rows.length === 0">
                <tr>
                  <td :colspan="leafHeaders.length + 2" class="px-3 py-16 text-center text-surface-400 dark:text-surface-500">
                    <div class="flex flex-col items-center justify-center gap-2">
                      <Receipt class="h-10 w-10 text-surface-300 dark:text-surface-700" />
                      <span class="text-base font-semibold">目前無訂單</span>
                      <span class="text-xs text-surface-400">找不到符合篩選條件的交易資料</span>
                    </div>
                  </td>
                </tr>
              </template>
              <template v-for="row in table.getRowModel().rows" :key="row.id">
                <tr
                  data-testid="order-row"
                  class="transition-colors hover:bg-surface-50/80 dark:hover:bg-surface-800/40"
                  :class="{ 'bg-primary-50/30 dark:bg-primary-950/20': expandedOrderId === row.original.orderId }">
                  <td class="px-3 py-3 text-center">
                    <input
                      type="checkbox" :aria-label="`選取訂單 ${row.original.orderId}`"
                      :checked="selectedOrderIds.has(row.original.orderId)"
                      class="rounded text-primary-600 focus:ring-primary-500"
                      @change="toggleSelectOrder(row.original.orderId, ($event.target as HTMLInputElement).checked)">
                  </td>
                  <td class="px-3 py-3 text-center">
                    <button
                      type="button"
                      class="flex h-7 w-7 items-center justify-center rounded-lg text-surface-500 dark:text-surface-400 transition-all hover:bg-surface-200/60 dark:hover:bg-surface-700/60"
                      :class="{ 'rotate-90 bg-primary-100 dark:bg-primary-900/60 text-primary-600 dark:text-primary-300': expandedOrderId === row.original.orderId }"
                      :aria-label="expandedOrderId === row.original.orderId ? '收合明細' : '展開明細'"
                      @click="toggleExpand(row.original.orderId)">
                      <ChevronRight class="h-4 w-4" />
                    </button>
                  </td>
                  <td v-for="cell in row.getVisibleCells()" :key="cell.id" class="px-4 py-3.5 align-middle">
                    <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                  </td>
                </tr>
                
                <!-- Expanded Detail Drawer -->
                <tr v-if="expandedOrderId === row.original.orderId" class="bg-surface-50/60 dark:bg-surface-950/50">
                  <td :colspan="leafHeaders.length + 2" class="px-6 py-5">
                    <div class="rounded-2xl border border-surface-200/80 dark:border-surface-800 bg-white dark:bg-surface-900 p-5 shadow-sm">
                      
                      <!-- Order Key Information Badges -->
                      <div class="mb-4 flex flex-wrap items-center gap-2 border-b border-surface-100 dark:border-surface-800 pb-4">
                        <span class="inline-flex items-center gap-1 rounded-lg bg-surface-100 dark:bg-surface-800 px-3 py-1.5 text-xs font-bold text-surface-700 dark:text-surface-300">
                          包材份數：<span class="text-primary-600 dark:text-primary-400">{{ row.original.orderBagCount }}</span> 份
                        </span>
                        <span class="inline-flex items-center gap-1 rounded-lg bg-surface-100 dark:bg-surface-800 px-3 py-1.5 text-xs font-bold text-surface-700 dark:text-surface-300">
                          出餐份數：<span class="text-primary-600 dark:text-primary-400">{{ row.original.orderCupCount }}</span> 份
                        </span>
                        <span class="inline-flex items-center gap-1 rounded-lg bg-surface-100 dark:bg-surface-800 px-3 py-1.5 text-xs font-bold text-surface-700 dark:text-surface-300">
                          訂單原始金額：<span class="text-primary-600 dark:text-primary-400">${{ row.original.orderTotalPrice }}</span>
                        </span>
                        <span class="inline-flex items-center gap-1 rounded-lg bg-surface-100 dark:bg-surface-800 px-3 py-1.5 text-xs font-bold text-surface-700 dark:text-surface-300">
                          已使用的優惠券：<span class="text-primary-600 dark:text-primary-400">{{ row.original.discountName }}</span>
                        </span>
                        <span class="inline-flex items-center gap-1 rounded-lg bg-surface-100 dark:bg-surface-800 px-3 py-1.5 text-xs font-bold text-surface-700 dark:text-surface-300">
                          優惠券折抵：<span class="text-primary-600 dark:text-primary-400">${{ row.original.orderDiscount }}</span>
                        </span>
                        <span class="inline-flex items-center gap-1 rounded-lg bg-surface-100 dark:bg-surface-800 px-3 py-1.5 text-xs font-bold text-surface-700 dark:text-surface-300">
                          顧客應付金額：<span class="text-primary-600 dark:text-primary-400">${{ row.original.orderPaymentPrice }}</span>
                        </span>
                        <span class="inline-flex items-center gap-1 rounded-lg bg-surface-100 dark:bg-surface-800 px-3 py-1.5 text-xs font-bold text-surface-700 dark:text-surface-300">
                          發票號碼：<span class="text-primary-600 dark:text-primary-400">{{ row.original.invoiceNumber || '（無，此功能上線前建立）' }}</span>
                          <template v-if="row.original.invoiceCarrier && row.original.invoiceCarrier.type !== '無載具'">
                            ．{{ row.original.invoiceCarrier.type }} {{ row.original.invoiceCarrier.value }}
                          </template>
                        </span>
                        <span
                          v-if="row.original.tableNumber"
                          class="inline-flex items-center gap-1 rounded-lg bg-info-50 dark:bg-info-950/60 px-3 py-1.5 text-xs font-bold text-info-700 dark:text-info-300 border border-info-200/50">
                          內用桌號：<span class="text-info-600 dark:text-info-400">{{ row.original.tableNumber }}</span>
                        </span>
                        <span
                          v-if="(row.original.refundedAmount ?? 0) > 0"
                          class="inline-flex items-center gap-1 rounded-lg bg-warning-50 dark:bg-warning-950/60 px-3 py-1.5 text-xs font-bold text-warning-700 dark:text-warning-300 border border-warning-200/50">
                          已退款：${{ row.original.refundedAmount }}
                        </span>
                        <span
                          v-if="row.original.voidReason"
                          class="inline-flex items-center gap-1 rounded-lg bg-danger-50 dark:bg-danger-950/60 px-3 py-1.5 text-xs font-bold text-danger-700 dark:text-danger-300 border border-danger-200/50">
                          作廢原因：{{ row.original.voidReason }}（{{ row.original.voidedBy }}）
                        </span>
                      </div>

                      <!-- Sub-table for Order Items -->
                      <div class="overflow-hidden rounded-xl border border-surface-200 dark:border-surface-800">
                        <table class="w-full text-center text-xs">
                          <thead class="bg-surface-100 dark:bg-surface-800 font-bold text-surface-600 dark:text-surface-300">
                            <tr>
                              <th class="px-3 py-2.5">序號</th>
                              <th class="px-3 py-2.5 text-left">商品</th>
                              <th class="px-3 py-2.5">單價</th>
                              <th class="px-3 py-2.5">加購</th>
                              <th class="px-3 py-2.5">加購金額</th>
                              <th class="px-3 py-2.5">數量</th>
                              <th class="px-3 py-2.5">折扣金額</th>
                              <th class="px-3 py-2.5">使用的折扣</th>
                              <th class="px-3 py-2.5 text-right font-black">小計</th>
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
                            <tr
                              v-for="(line, index) in row.original.orderData"
                              :key="index"
                              class="hover:bg-surface-50 dark:hover:bg-surface-800/40">
                              <td class="px-3 py-2.5 text-surface-400 font-mono">{{ index + 1 }}</td>
                              <td class="px-3 py-2.5 text-left font-bold text-surface-900 dark:text-surface-100">{{ line.name }}</td>
                              <td class="px-3 py-2.5 text-surface-600 dark:text-surface-400">{{ line.price }} 元</td>
                              <td class="px-3 py-2.5 text-surface-600 dark:text-surface-400">{{ line.addList || '-' }}</td>
                              <td class="px-3 py-2.5 text-surface-600 dark:text-surface-400">{{ line.addListPrice }} 元</td>
                              <td class="px-3 py-2.5 font-bold text-surface-800 dark:text-surface-200">{{ line.count }} 份</td>
                              <td class="px-3 py-2.5 text-surface-600 dark:text-surface-400">{{ line.discount }} 元</td>
                              <td class="px-3 py-2.5">
                                <div v-if="!line.freeDiscount && !line.quickDiscountName" class="text-surface-400">
                                  目前無使用折扣
                                </div>
                                <div v-else class="flex flex-wrap justify-center gap-1">
                                  <span v-if="line.freeDiscount" class="rounded-md bg-info-100 px-2 py-0.5 text-[11px] font-bold text-info-700 dark:bg-info-950 dark:text-info-300 border border-info-200 dark:border-info-800">招待</span>
                                  <span v-if="line.quickDiscountName" class="rounded-md bg-warning-100 px-2 py-0.5 text-[11px] font-bold text-warning-700 dark:bg-warning-950 dark:text-warning-300 border border-warning-200 dark:border-warning-800">{{ line.quickDiscountName }}</span>
                                </div>
                              </td>
                              <td class="px-3 py-2.5 text-right font-black text-primary-600 dark:text-primary-400 font-mono">{{ line.totalPrice }} 元</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <div
          v-if="selectedOrderIds.size > 0"
          class="flex flex-wrap items-center justify-between gap-3 border-t border-primary-200 dark:border-primary-800 bg-primary-50/60 dark:bg-primary-950/30 px-6 py-3">
          <div class="text-sm font-bold text-primary-700 dark:text-primary-300">
            已選 {{ selectedOrderIds.size }} 筆
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="pos-btn pos-btn-secondary px-3 py-1.5 text-xs"
              @click="exportSelectedCsv">
              批次匯出 CSV
            </button>
            <button
              type="button"
              class="pos-btn pos-btn-ghost px-3 py-1.5 text-xs"
              @click="selectedOrderIds.clear()">
              取消選取
            </button>
          </div>
        </div>

        <!-- Pagination Bar -->
        <div class="flex flex-wrap items-center justify-between gap-3 border-t border-surface-200 dark:border-surface-800 px-6 py-4 bg-surface-50/50 dark:bg-surface-900">
          <div class="text-sm text-surface-500 dark:text-surface-400">
            總共有 <span class="font-bold text-primary-600 dark:text-primary-400">{{ filterOrder.length }}</span> 筆訂單，
            當前頁面有 <span class="font-bold text-primary-600 dark:text-primary-400">{{ table.getRowModel().rows.length }}</span> 筆訂單
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 px-3.5 py-1.5 text-sm font-bold text-surface-700 dark:text-surface-300 shadow-sm transition-all hover:bg-surface-50 dark:hover:bg-surface-700 disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
              :disabled="!table.getCanPreviousPage()"
              @click="table.previousPage()">
              上一頁
            </button>
            <span class="px-3 text-sm font-bold text-surface-700 dark:text-surface-300 font-mono">
              {{ table.getState().pagination.pageIndex + 1 }} / {{ Math.max(table.getPageCount(), 1) }}
            </span>
            <button
              type="button"
              class="rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 px-3.5 py-1.5 text-sm font-bold text-surface-700 dark:text-surface-300 shadow-sm transition-all hover:bg-surface-50 dark:hover:bg-surface-700 disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
              :disabled="!table.getCanNextPage()"
              @click="table.nextPage()">
              下一頁
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  FlexRender,
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  useVueTable,
} from '@tanstack/vue-table'
import {
  Receipt,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag,
  RotateCcw,
  Filter,
  Search,
  Clock,
  User,
  Tag,
  CreditCard,
  ChevronRight,
  X,
} from 'lucide-vue-next'
import { getDate } from '@/utils/time'
import { useOrderStore } from "@/stores/order"
const orderStore = useOrderStore()
import { useLoginStore } from "@/stores/login"
const loginStore = useLoginStore()
import { fromSelection, hasCapability } from '@/utils/selection'
import { deleteOrder as deleteOrderRequest, refundOrder as refundOrderRequest, updateOrderStatus } from '@/api/orders'
import { operatorLogin } from '@/api/auth'
import { ApiError } from '@/api/http'
import { confirm } from '@/composables/useConfirm'
import { prompt } from '@/composables/usePrompt'
import { requestManagerAuth } from '@/composables/useManagerAuth'
import { requestRefund } from '@/composables/useRefund'
import { showReceipt } from '@/composables/useReceiptPreview'
import { showToast } from '@/composables/useToast'
import { ulid } from '@pos/domain'
import type { OrderRecord } from '@/types'

// P6：訂單還在離線佇列裡等待第一次同步時，伺服端根本沒有這筆訂單，
// 編輯狀態／刪除都會收到 404——用同一句話提示，不用另外做「排入佇列
// 稍後重試」（見 api/orders.ts 的說明）。
function orderApiErrorMessage(err: unknown): string {
  if (err instanceof ApiError && err.status === 404) {
    return '這筆訂單可能還在等待同步到伺服端，請稍後再試一次'
  }
  if (err instanceof ApiError) {
    return `操作失敗：${err.message}`
  }
  return '連不上伺服端，請確認網路連線'
}

// 訂單統計數據
const orderStats = computed(() => {
  const all = orderStore.order
  const totalCount = all.length
  const completedOrders = all.filter(o => o.orderStatus === '已完成')
  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.orderPaymentPrice || 0) - (o.refundedAmount || 0), 0)
  const voidCount = all.filter(o => o.orderStatus === '已取消').length
  const refundCount = all.filter(o => (o.refundedAmount ?? 0) > 0).length
  const completeRate = totalCount > 0 ? Math.round((completedOrders.length / totalCount) * 100) : 100
  return {
    totalCount,
    totalRevenue,
    completedCount: completedOrders.length,
    voidCount,
    refundCount,
    completeRate,
  }
})

// 篩選條件與 URL query 雙向同步以利狀態保存與分享。
const route = useRoute()
const router = useRouter()
function queryString(key: string): string {
  const value = route.query[key]
  return typeof value === 'string' ? value : ''
}
const filterOrderId = ref(queryString('orderId'))
const filterOrderTime = ref(queryString('orderTime'))
const filterOrderStaff = ref(queryString('staff'))
const filterOrderStatus = ref(queryString('status'))
const filterOrderPayMethod = ref(queryString('payMethod'))

watch([filterOrderId, filterOrderTime, filterOrderStaff, filterOrderStatus, filterOrderPayMethod], () => {
  const query: Record<string, string> = {}
  if (filterOrderId.value) query.orderId = filterOrderId.value
  if (filterOrderTime.value) query.orderTime = filterOrderTime.value
  if (filterOrderStaff.value) query.staff = filterOrderStaff.value
  if (filterOrderStatus.value) query.status = filterOrderStatus.value
  if (filterOrderPayMethod.value) query.payMethod = filterOrderPayMethod.value
  void router.replace({ query })
})

const hasActiveFilter = computed(() => {
  return Boolean(
    filterOrderId.value ||
    filterOrderTime.value ||
    filterOrderStaff.value ||
    filterOrderStatus.value ||
    filterOrderPayMethod.value,
  )
})

// 使用 includes 進行子字串比對，避免輸入特殊字元時被視為正規表示式出錯。
const filterOrder = computed(() => {
  return orderStore.order.filter(item => {
    return item.orderId.includes(filterOrderId.value) &&
      item.orderTime.includes(filterOrderTime.value) &&
      item.staff.includes(filterOrderStaff.value) &&
      item.orderStatus.includes(filterOrderStatus.value) &&
      item.orderPayment.includes(filterOrderPayMethod.value)
  })
})

const resetFilter = () => {
  filterOrderId.value = ''
  filterOrderTime.value = ''
  filterOrderStaff.value = ''
  filterOrderStatus.value = ''
  filterOrderPayMethod.value = ''
}

const quickFilterStatus = (status: string) => {
  if (filterOrderStatus.value === status) {
    filterOrderStatus.value = ''
  } else {
    filterOrderStatus.value = status
  }
}

const quickFilterPayment = (payment: string) => {
  if (filterOrderPayMethod.value === payment) {
    filterOrderPayMethod.value = ''
  } else {
    filterOrderPayMethod.value = payment
  }
}

// 以 orderId 管理展開狀態，避免換頁或篩選時因 row index 變動錯位。
const expandedOrderId = ref<string | null>(null)
function toggleExpand(orderId: string) {
  expandedOrderId.value = expandedOrderId.value === orderId ? null : orderId
}

// 以 orderId 管理選取狀態，避免篩選或分頁錯位。
const selectedOrderIds = ref<Set<string>>(new Set())
function toggleSelectOrder(orderId: string, checked: boolean) {
  if (checked) selectedOrderIds.value.add(orderId)
  else selectedOrderIds.value.delete(orderId)
}
const visibleOrderIds = computed(() => table.getRowModel().rows.map((row) => row.original.orderId))
const someVisibleSelected = computed(() => visibleOrderIds.value.some((id) => selectedOrderIds.value.has(id)))
const allVisibleSelected = computed(() =>
  visibleOrderIds.value.length > 0 && visibleOrderIds.value.every((id) => selectedOrderIds.value.has(id)),
)
function toggleSelectAllVisible(checked: boolean) {
  for (const id of visibleOrderIds.value) {
    if (checked) selectedOrderIds.value.add(id)
    else selectedOrderIds.value.delete(id)
  }
}
// 篩選變動時同步移除已不可見的選取項目，避免選取狀態與畫面不一致。
watch(filterOrder, (orders) => {
  const stillVisible = new Set(orders.map((o) => o.orderId))
  for (const id of selectedOrderIds.value) {
    if (!stillVisible.has(id)) selectedOrderIds.value.delete(id)
  }
})
function exportSelectedCsv() {
  const selected = orderStore.order.filter((o) => selectedOrderIds.value.has(o.orderId))
  if (selected.length === 0) return
  let csv = 'data:text/csv;charset=utf-8,﻿'
  csv += '訂單編號,訂單時間,服務人員,內用/外帶,訂單狀態,訂單金額,付款方式\n'
  for (const o of selected) {
    csv += `${o.orderId},${o.orderTime},${o.staff},${o.orderChannel ?? '外帶'},${o.orderStatus},${o.orderPaymentPrice},${o.orderPayment}\n`
  }
  const link = document.createElement('a')
  link.setAttribute('href', encodeURI(csv))
  link.setAttribute('download', `訂單匯出_${getDate()}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  showToast(`已匯出 ${selected.length} 筆訂單`, 'success')
}

const statusBadgeClass = (status: OrderRecord['orderStatus']) =>
  status === '已完成'
    ? 'rounded-full bg-success-100 px-2.5 py-1 text-xs font-bold text-success-700 dark:bg-success-950 dark:text-success-300 border border-success-200/60 dark:border-success-800/40'
    : 'rounded-full bg-danger-100 px-2.5 py-1 text-xs font-bold text-danger-700 dark:bg-danger-950 dark:text-danger-300 border border-danger-200/60 dark:border-danger-800/40'

// 舊資料可能無 refundedAmount 欄位，預設為 0。
const refundedAmountOf = (order: OrderRecord) => order.refundedAmount ?? 0
const remainingRefundableOf = (order: OrderRecord) => Math.max(0, order.orderPaymentPrice - refundedAmountOf(order))

const columnHelper = createColumnHelper<OrderRecord>()
const columns = [
  columnHelper.accessor('orderId', {
    header: '訂單編號',
    cell: (info) => h('span', { class: 'font-mono font-bold text-surface-900 dark:text-surface-100' }, info.getValue()),
  }),
  columnHelper.accessor('orderTime', {
    header: '訂單時間',
    cell: (info) => h('span', { class: 'text-surface-600 dark:text-surface-400 font-mono text-xs' }, info.getValue()),
  }),
  columnHelper.accessor('staff', {
    header: '服務人員',
    cell: (info) => h('span', { class: 'font-medium text-surface-800 dark:text-surface-200' }, info.getValue()),
  }),
  // 舊資料可能無 orderChannel 欄位，預設為 '外帶'。
  columnHelper.accessor((row) => row.orderChannel ?? '外帶', {
    id: 'orderChannel',
    header: '內用／外帶',
    cell: (info) => {
      const channel = info.getValue()
      const isDineIn = channel === '內用'
      return h(
        'span',
        {
          class: isDineIn
            ? 'rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-bold text-teal-700 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
            : 'rounded-full bg-info-100 px-2.5 py-0.5 text-xs font-bold text-info-700 dark:bg-info-950 dark:text-info-300 border border-info-200 dark:border-info-800',
        },
        channel,
      )
    },
  }),
  columnHelper.accessor('orderStatus', {
    header: '訂單狀態',
    cell: (info) => {
      const order = info.row.original
      const badges = [h('span', { class: statusBadgeClass(info.getValue()) }, info.getValue())]
      if (refundedAmountOf(order) > 0) {
        badges.push(h(
          'span',
          { class: 'rounded-full bg-warning-100 px-2.5 py-0.5 text-xs font-bold text-warning-700 dark:bg-warning-950 dark:text-warning-300 border border-warning-200 dark:border-warning-800' },
          `已退款 $${refundedAmountOf(order)}`,
        ))
      }
      return h('div', { class: 'flex flex-wrap items-center gap-1.5' }, badges)
    },
  }),
  columnHelper.accessor('orderPaymentPrice', {
    header: () => h('span', { class: 'block text-right' }, '訂單金額'),
    cell: (info) => h(
      'span',
      { class: 'block text-right font-mono font-bold tabular-nums text-surface-900 dark:text-surface-100' },
      `${info.getValue().toLocaleString()} 元`,
    ),
  }),
  columnHelper.accessor('orderPayment', {
    header: '付款方式',
    cell: (info) => h('span', { class: 'rounded-md bg-surface-100 dark:bg-surface-800 px-2 py-0.5 text-xs font-semibold text-surface-700 dark:text-surface-300' }, info.getValue()),
  }),
  columnHelper.display({
    id: 'actions',
    header: '操作',
    cell: (info) => {
      const order = info.row.original
      const canEditStatus = hasCapability(loginStore.userInfo, 'canEditOrderStatus')
      const canDelete = hasCapability(loginStore.userInfo, 'canDeleteOrder')
      // 退款權限沿用「編輯訂單狀態」（canEditOrderStatus）。
      const canRefund = canEditStatus && order.orderStatus === '已完成' && remainingRefundableOf(order) > 0
      return h('div', { class: 'flex flex-wrap justify-end gap-1.5' }, [
        h('button', {
          type: 'button',
          class: 'rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 px-2.5 py-1 text-xs font-bold text-surface-700 dark:text-surface-300 shadow-sm transition-all hover:bg-surface-50 dark:hover:bg-surface-700 active:scale-95',
          onClick: () => showReceipt(order),
        }, '收據'),
        h('button', {
          type: 'button',
          class: [
            'rounded-lg border border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-950/40 px-2.5 py-1 text-xs font-bold text-primary-700 dark:text-primary-300 transition-all hover:bg-primary-100 dark:hover:bg-primary-900/60 active:scale-95',
            canEditStatus ? '' : 'pointer-events-none opacity-40',
          ],
          onClick: () => editOrderStatus(order.orderId),
        }, '編輯訂單狀態'),
        h('button', {
          type: 'button',
          class: [
            'rounded-lg border border-warning-200 px-2.5 py-1 text-xs font-bold text-warning-700 transition-all hover:bg-warning-50 dark:border-warning-800 dark:text-warning-400 dark:hover:bg-warning-950 active:scale-95',
            canRefund ? '' : 'pointer-events-none opacity-40',
          ],
          onClick: () => refundOrder(order),
        }, '退款'),
        h('button', {
          type: 'button',
          class: [
            'rounded-lg border border-danger-200 px-2.5 py-1 text-xs font-bold text-danger-600 transition-all hover:bg-danger-50 dark:border-danger-800 dark:text-danger-400 dark:hover:bg-danger-950 active:scale-95',
            canDelete ? '' : 'pointer-events-none opacity-40',
          ],
          onClick: () => deleteOrder(order.orderId),
        }, '刪除訂單'),
      ])
    },
  }),
]

const table = useVueTable({
  data: filterOrder,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  initialState: { pagination: { pageSize: 10 } },
})

// 表頭只有一層（沒有分組欄位），直接取第一個 header group 的 leaf headers。
const leafHeaders = computed(() => table.getHeaderGroups()[0]?.headers ?? [])

// 緩存失效 key：當訂單狀態或退款金額變動時，保證 tbody 刷新
const tableRenderKey = computed(() => {
  return orderStore.order.map(o => `${o.orderId}_${o.orderStatus}_${o.refundedAmount}`).join('|')
})

const currentOperator = () => `${fromSelection(loginStore.userInfo)?.jobTitle} - ${fromSelection(loginStore.userInfo)?.name}`

async function requestRefundOrVoidApproval(title: string, description: string): Promise<string | null> {
  const credentials = await requestManagerAuth({ title, description })
  if (credentials === null) return null
  try {
    const staff = await operatorLogin(credentials.account, credentials.pin)
    if (!staff.capabilities.includes('canEditOrderStatus')) {
      showToast('這個帳號沒有退款／作廢的權限，操作已取消', 'error')
      return null
    }
    return `${staff.jobTitle} - ${staff.name}`
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      showToast('帳號或 PIN 錯誤，操作已取消', 'error')
    } else {
      showToast('連不上伺服端，操作已取消', 'error')
    }
    return null
  }
}

const editOrderStatus = async (id: string) => {
  const result = await confirm({
    title: '修改訂單狀態',
    description: '請選擇當前的訂單狀態',
    confirmText: '已完成',
    cancelText: '已取消',
  })
  if (result === 'dismiss') return
  const nextStatus = result === 'confirm' ? '已完成' : '已取消'

  let reason: string | undefined
  let voidApprover: string | null = null
  if (nextStatus === '已取消') {
    voidApprover = await requestRefundOrVoidApproval('作廢需要主管授權', '這筆訂單即將被標記為作廢，請輸入有權限核可的帳號與 PIN')
    if (voidApprover === null) return

    const voidReason = await prompt({
      title: '作廢原因',
      description: '這筆訂單將被標記為作廢，班別結算不會再計入這筆訂單的現金收入',
      label: '原因',
      placeholder: '例如：客人臨時取消、重複建單',
      confirmText: '確認作廢',
    })
    if (voidReason === null) return
    reason = voidReason
  }

  try {
    const updated = await updateOrderStatus(id, nextStatus, voidApprover ?? currentOperator(), reason)
    const local = orderStore.order.find(item => item.orderId === id)
    if (local) {
      local.orderStatus = updated.orderStatus
      local.voidReason = updated.voidReason
      local.voidedBy = updated.voidedBy
      local.voidedAt = updated.voidedAt
      orderStore.order = [...orderStore.order]
    }
    showToast(`訂單狀態已設定為${nextStatus}`, 'success')
  } catch (err) {
    showToast(orderApiErrorMessage(err), 'error')
  }
}

const refundOrder = async (order: OrderRecord) => {
  const max = remainingRefundableOf(order)
  if (max <= 0) return
  const approver = await requestRefundOrVoidApproval('退款需要主管授權', '這筆訂單即將辦理退款，請輸入有權限核可的帳號與 PIN')
  if (approver === null) return

  const result = await requestRefund({ max })
  if (result === null) return
  try {
    const updated = await refundOrderRequest(order.orderId, {
      refundId: ulid(),
      amount: result.amount,
      reason: result.reason,
      operator: approver,
    })
    const local = orderStore.order.find(item => item.orderId === order.orderId)
    if (local) {
      local.refundedAmount = updated.refundedAmount
      orderStore.order = [...orderStore.order]
    }
    showToast(`退款成功，已退 $${result.amount}`, 'success')
  } catch (err) {
    showToast(orderApiErrorMessage(err), 'error')
  }
}

const deleteOrder = async (id: string) => {
  const result = await confirm({
    title: '警告',
    description: '是否要刪除該筆訂單？',
    confirmText: '確定',
    cancelText: '取消',
    variant: 'danger',
  })
  if (result !== 'confirm') return
  try {
    await deleteOrderRequest(id)
    orderStore.order = orderStore.order.filter(item => item.orderId != id)
    showToast('刪除成功', 'success')
  } catch (err) {
    showToast(orderApiErrorMessage(err), 'error')
  }
}
</script>

<style scoped></style>
