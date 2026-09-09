<template>
  <div class="w-full flex flex-col xl:flex-row divide-y xl:divide-y-0 xl:divide-x divide-surface-200 dark:divide-surface-800">
    <div class="w-full xl:w-[28%] p-4 flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between pb-3 mb-3 border-b border-surface-100 dark:border-surface-800">
          <div class="flex items-center gap-2">
            <span class="text-sm font-black text-surface-900 dark:text-surface-100">飲品類型</span>
            <span class="rounded-full bg-surface-100 dark:bg-surface-800 px-2 py-0.5 text-[10px] font-bold text-surface-600 dark:text-surface-300">共 {{ drinkStore.drinkType.length }} 樣</span>
          </div>
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              class="pos-btn pos-btn-secondary px-2.5 py-1 text-xs"
              :class="{ 'opacity-50 pointer-events-none': !hasCapability(loginStore.userInfo, 'canSetDrinkType') }"
              @click="openAddTypeDialog">新增</button>
            <button
              type="button"
              class="pos-btn pos-btn-primary px-2.5 py-1 text-xs"
              :class="{ 'opacity-50 pointer-events-none': !hasCapability(loginStore.userInfo, 'canSetDrinkType') }"
              @click="openEditTypeDialog">編輯</button>
            <button
              type="button"
              class="pos-btn pos-btn-danger px-2.5 py-1 text-xs"
              :class="{ 'opacity-50 pointer-events-none': !hasCapability(loginStore.userInfo, 'canSetDrinkType') }"
              @click="deleteDrinkType">刪除</button>
          </div>
        </div>

        <ModalDialog v-model:open="addTypeDialog" title="新增飲品類型">
          <div class="flex flex-col gap-3 py-2">
            <label class="flex flex-col gap-1 text-xs font-bold text-surface-600 dark:text-surface-300">
              飲品類型
              <input
                v-model="currentInputName"
                class="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 outline-none focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 transition-all"
                placeholder="例如: 原味茶,芝芝系列..." />
            </label>
            <label class="flex flex-col gap-1 text-xs font-bold text-surface-600 dark:text-surface-300">
              飲品類型的代號
              <input
                v-model="currentInputType"
                class="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 outline-none focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 transition-all font-mono"
                placeholder="例如: drinkMilk..." />
            </label>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button type="button" class="rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-sm font-bold text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800" @click="closeAddTypeDialog">取消</button>
            <button type="button" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700" @click="addDrinkType">新增</button>
          </div>
        </ModalDialog>

        <ModalDialog v-model:open="editTypeDialog" title="編輯飲品類型">
          <div class="flex flex-col gap-3 py-2">
            <label class="flex flex-col gap-1 text-xs font-bold text-surface-600 dark:text-surface-300">
              飲品類型
              <input
                v-model="currentEditInputName"
                class="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 outline-none focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 transition-all"
                placeholder="例如: 原味茶,芝芝系列..." />
            </label>
            <label class="flex flex-col gap-1 text-xs font-bold text-surface-600 dark:text-surface-300">
              飲品類型的代號
              <input
                v-model="currentEditInputType"
                class="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 outline-none focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 transition-all font-mono"
                placeholder="例如: drinkMilk..." />
            </label>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button type="button" class="rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-sm font-bold text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800" @click="closeEditTypeDialog">取消</button>
            <button type="button" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700" @click="editDrinkType">保存</button>
          </div>
        </ModalDialog>

        <div class="max-h-[420px] overflow-y-auto rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm">
          <table class="w-full text-center text-xs sm:text-sm">
            <thead class="sticky top-0 z-10 bg-surface-100 dark:bg-surface-800 text-xs font-bold uppercase tracking-wide text-surface-500 dark:text-surface-400">
              <tr>
                <th class="px-2 py-2.5">序號</th>
                <th class="px-2 py-2.5">Id</th>
                <th class="px-2 py-2.5">類型</th>
                <th class="px-2 py-2.5">類型代號</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
              <tr v-if="sliceDrinkType.length === 0">
                <td colspan="4" class="px-2 py-8 text-surface-400 dark:text-surface-500">無飲品類型</td>
              </tr>
              <tr
                v-for="(row, index) in sliceDrinkType" :key="row.id"
                class="cursor-pointer transition-colors hover:bg-surface-50 dark:hover:bg-surface-950"
                :class="{ 'bg-primary-50/90 dark:bg-primary-950/40 text-primary-900 dark:text-primary-100 font-bold': currentType.id === row.id }"
                @click="currentType = row">
                <td class="px-2 py-2.5 font-mono text-surface-500">{{ index + 1 }}</td>
                <td class="px-2 py-2.5 font-mono text-xs text-surface-400 truncate max-w-[80px]" :title="String(row.id)">{{ row.id }}</td>
                <td class="px-2 py-2.5 font-bold">{{ row.name }}</td>
                <td class="px-2 py-2.5 font-mono text-xs text-surface-500">{{ row.type }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="mt-4 flex items-center justify-between rounded-xl bg-surface-50 dark:bg-surface-800/60 px-3 py-2 text-xs font-bold text-surface-600 dark:text-surface-300">
        <p>{{ `共 ${drinkStore.drinkType.length} 樣` }}</p>
        <div class="flex items-center gap-1.5">
          <AppPagination :page="drinkTypeCurrentPage" :page-count="drinkTypePageCount" :total="drinkStore.drinkType.length" @update:page="handleDrinkTypeCurrentChange" />
        </div>
      </div>
    </div>

    <div class="w-full xl:w-[44%] p-4 flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between pb-3 mb-3 border-b border-surface-100 dark:border-surface-800">
          <div class="flex items-center gap-2">
            <span class="text-sm font-black text-surface-900 dark:text-surface-100">飲料品項</span>
            <span class="rounded-full bg-surface-100 dark:bg-surface-800 px-2 py-0.5 text-[10px] font-bold text-surface-600 dark:text-surface-300">
              共 {{ currentType.drinkList ? currentType.drinkList.length : 0 }} 樣
            </span>
          </div>
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              class="pos-btn pos-btn-secondary px-2.5 py-1 text-xs"
              :class="{ 'opacity-50 pointer-events-none': !hasCapability(loginStore.userInfo, 'canSetDrink') }"
              @click="openAddDrinkDialog">新增</button>
            <button
              type="button"
              class="pos-btn pos-btn-primary px-2.5 py-1 text-xs"
              :class="{ 'opacity-50 pointer-events-none': !hasCapability(loginStore.userInfo, 'canSetDrink') }"
              @click="openEditDrinkDialog">編輯</button>
            <button
              type="button"
              class="pos-btn pos-btn-danger px-2.5 py-1 text-xs"
              :class="{ 'opacity-50 pointer-events-none': !hasCapability(loginStore.userInfo, 'canSetDrink') }"
              @click="deleteDrink">刪除</button>
          </div>
        </div>

        <ModalDialog v-model:open="addDrinkDialog" title="新增飲料品項">
          <div class="flex flex-col gap-3.5 py-2">
            <label class="flex flex-col gap-1 text-xs font-bold text-surface-600 dark:text-surface-300">
              飲料名稱
              <input
                v-model="currentDrinkInputName"
                class="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 outline-none focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 transition-all"
                placeholder="例如: 芝芝金萱,金萱雙Q..." />
            </label>

            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-1 text-xs font-bold text-surface-600 dark:text-surface-300">
                <span>大杯價格</span>
                <div class="flex items-center gap-2">
                  <SwitchRoot
                    v-model="setPriceL" class="relative h-6 w-11 rounded-full bg-surface-300 dark:bg-surface-700 data-[state=checked]:bg-primary-500 shrink-0"
                    @update:model-value="checkPriceLSwitch">
                    <SwitchThumb class="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
                  </SwitchRoot>
                  <input
                    v-if="setPriceL" v-model="currentDrinkInputPriceL" type="number" min="1" step="1"
                    class="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-1.5 text-sm text-surface-900 dark:text-surface-100" placeholder="無此容器，請關左側開關" />
                  <div v-else class="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 px-3 py-1.5 text-sm text-surface-400 text-center font-mono">
                    none
                  </div>
                </div>
              </div>

              <div class="flex flex-col gap-1 text-xs font-bold text-surface-600 dark:text-surface-300">
                <span>瓶裝價格</span>
                <div class="flex items-center gap-2">
                  <SwitchRoot
                    v-model="setPriceBottle" class="relative h-6 w-11 rounded-full bg-surface-300 dark:bg-surface-700 data-[state=checked]:bg-primary-500 shrink-0"
                    @update:model-value="checkPriceBottleSwitch">
                    <SwitchThumb class="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
                  </SwitchRoot>
                  <input
                    v-if="setPriceBottle" v-model="currentDrinkInputPriceBottle" type="number" min="1" step="1"
                    class="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-1.5 text-sm text-surface-900 dark:text-surface-100" placeholder="無此容器，請關左側開關" />
                  <div v-else class="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 px-3 py-1.5 text-sm text-surface-400 text-center font-mono">
                    none
                  </div>
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-1 text-xs font-bold text-surface-600 dark:text-surface-300">
              <span>客製化</span>
              <SelectRoot v-model="currentDrinkSelectCustomized" @update:model-value="checkAddDrinkSelectCustomized">
                <SelectTrigger class="flex w-full items-center justify-between rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-left text-sm text-surface-900 dark:text-surface-100">
                  <SelectValue placeholder="請選擇飲料的客製化設定" />
                  <span aria-hidden="true">▾</span>
                </SelectTrigger>
                <SelectPortal>
                  <SelectContent class="z-50 w-[280px] rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-800 shadow-xl" position="popper">
                    <SelectViewport class="p-1">
                      <SelectItem
                        v-for="item in customized" :key="item.value" :value="item.value"
                        class="flex cursor-pointer justify-between rounded-lg px-3 py-2 text-sm outline-none hover:bg-surface-100 dark:hover:bg-surface-700 data-[state=checked]:bg-primary-50 dark:data-[state=checked]:bg-primary-950/40">
                        <SelectItemText>{{ item.label }}</SelectItemText>
                        <span class="text-xs text-surface-400 dark:text-surface-500">{{ item.value }}</span>
                      </SelectItem>
                    </SelectViewport>
                  </SelectContent>
                </SelectPortal>
              </SelectRoot>
            </div>

            <label class="flex flex-col gap-1 text-xs font-bold text-surface-600 dark:text-surface-300">
              庫存
              <input
                v-model="currentDrinkInputStock" type="number" min="0" step="1"
                class="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 outline-none focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 transition-all font-mono"
                placeholder="留空代表不追蹤庫存" />
            </label>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button type="button" class="rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-sm font-bold text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800" @click="closeAddDrinkDialog">取消</button>
            <button type="button" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700" @click="addDrink">新增</button>
          </div>
        </ModalDialog>

        <ModalDialog v-model:open="editDrinkDialog" title="編輯飲料品項">
          <div class="flex flex-col gap-3.5 py-2">
            <label class="flex flex-col gap-1 text-xs font-bold text-surface-600 dark:text-surface-300">
              飲料名稱
              <input
                v-model="currentEditDrinkInputName"
                class="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 outline-none focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 transition-all"
                placeholder="例如: 芝芝金萱,金萱雙Q..." />
            </label>

            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-1 text-xs font-bold text-surface-600 dark:text-surface-300">
                <span>大杯價格</span>
                <div class="flex items-center gap-2">
                  <SwitchRoot
                    v-model="setEditPriceL" class="relative h-6 w-11 rounded-full bg-surface-300 dark:bg-surface-700 data-[state=checked]:bg-primary-500 shrink-0"
                    @update:model-value="checkEditPriceLSwitch">
                    <SwitchThumb class="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
                  </SwitchRoot>
                  <input
                    v-if="setEditPriceL" v-model="currentEditDrinkInputPriceL" type="number" min="1" step="1"
                    class="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-1.5 text-sm text-surface-900 dark:text-surface-100" placeholder="無此容器，請關左側開關" />
                  <div v-else class="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 px-3 py-1.5 text-sm text-surface-400 text-center font-mono">
                    none
                  </div>
                </div>
              </div>

              <div class="flex flex-col gap-1 text-xs font-bold text-surface-600 dark:text-surface-300">
                <span>瓶裝價格</span>
                <div class="flex items-center gap-2">
                  <SwitchRoot
                    v-model="setEditPriceBottle" class="relative h-6 w-11 rounded-full bg-surface-300 dark:bg-surface-700 data-[state=checked]:bg-primary-500 shrink-0"
                    @update:model-value="checkEditPriceBottleSwitch">
                    <SwitchThumb class="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
                  </SwitchRoot>
                  <input
                    v-if="setEditPriceBottle" v-model="currentEditDrinkInputPriceBottle" type="number" min="1" step="1"
                    class="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-1.5 text-sm text-surface-900 dark:text-surface-100" placeholder="純數字,例如:1,2,3..." />
                  <div v-else class="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 px-3 py-1.5 text-sm text-surface-400 text-center font-mono">
                    none
                  </div>
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-1 text-xs font-bold text-surface-600 dark:text-surface-300">
              <span>客製化</span>
              <SelectRoot v-model="currentEditDrinkSelectCustomized" @update:model-value="checkEditDrinkSelectCustomized">
                <SelectTrigger class="flex w-full items-center justify-between rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-left text-sm text-surface-900 dark:text-surface-100">
                  <SelectValue placeholder="請選擇飲料的客製化設定" />
                  <span aria-hidden="true">▾</span>
                </SelectTrigger>
                <SelectPortal>
                  <SelectContent class="z-50 w-[280px] rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-800 shadow-xl" position="popper">
                    <SelectViewport class="p-1">
                      <SelectItem
                        v-for="item in customized" :key="item.value" :value="item.value"
                        class="flex cursor-pointer justify-between rounded-lg px-3 py-2 text-sm outline-none hover:bg-surface-100 dark:hover:bg-surface-700 data-[state=checked]:bg-primary-50 dark:data-[state=checked]:bg-primary-950/40">
                        <SelectItemText>{{ item.label }}</SelectItemText>
                        <span class="text-xs text-surface-400 dark:text-surface-500">{{ item.value }}</span>
                      </SelectItem>
                    </SelectViewport>
                  </SelectContent>
                </SelectPortal>
              </SelectRoot>
            </div>

            <label class="flex flex-col gap-1 text-xs font-bold text-surface-600 dark:text-surface-300">
              庫存
              <input
                v-model="currentEditDrinkInputStock" type="number" min="0" step="1"
                class="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 outline-none focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 transition-all font-mono"
                placeholder="留空代表不追蹤庫存" />
            </label>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button type="button" class="rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-sm font-bold text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800" @click="closeEditDrinkDialog">取消</button>
            <button type="button" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700" @click="editDrink">保存</button>
          </div>
        </ModalDialog>

        <div class="max-h-[420px] overflow-y-auto rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm">
          <table class="w-full text-center text-xs sm:text-sm">
            <thead class="sticky top-0 z-10 bg-surface-100 dark:bg-surface-800 text-xs font-bold uppercase tracking-wide text-surface-500 dark:text-surface-400">
              <tr>
                <th class="px-2 py-2.5">序號</th>
                <th class="px-2 py-2.5">Id</th>
                <th class="px-2 py-2.5">飲料名稱</th>
                <th class="px-2 py-2.5">大杯價格</th>
                <th class="px-2 py-2.5">瓶裝價格</th>
                <th class="px-2 py-2.5">客製化</th>
                <th class="px-2 py-2.5">庫存</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
              <tr v-if="sliceDrink.length === 0">
                <td colspan="7" class="px-2 py-8 text-surface-400 dark:text-surface-500">請先選擇飲品類型</td>
              </tr>
              <tr
                v-for="(row, index) in sliceDrink" :key="row.id"
                class="cursor-pointer transition-colors hover:bg-surface-50 dark:hover:bg-surface-950"
                :class="{ 'bg-primary-50/90 dark:bg-primary-950/40 text-primary-900 dark:text-primary-100 font-bold': currentDrink.id === row.id }"
                @click="currentDrink = row">
                <td class="px-2 py-2.5 font-mono text-surface-500">{{ index + 1 }}</td>
                <td class="px-2 py-2.5 font-mono text-xs text-surface-400 truncate max-w-[80px]" :title="String(row.id)">{{ row.id }}</td>
                <td class="px-2 py-2.5 font-bold text-surface-900 dark:text-surface-100">{{ row.name }}</td>
                <td class="px-2 py-2.5 font-mono">${{ row.priceL }}</td>
                <td class="px-2 py-2.5 font-mono">{{ row.priceBottle === 'none' ? '-' : `$${row.priceBottle}` }}</td>
                <td class="px-2 py-2.5">
                  <span class="rounded-md px-1.5 py-0.5 text-[10px] font-bold" :class="row.customized === 'none' ? 'bg-surface-100 text-surface-500 dark:bg-surface-800' : 'bg-success-50 text-success-600 dark:bg-success-950/40 dark:text-success-400'">
                    {{ row.customized }}
                  </span>
                </td>
                <td class="px-2 py-2.5" :class="stockClass(row.stock)">{{ stockLabel(row.stock) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="mt-4 flex items-center justify-between rounded-xl bg-surface-50 dark:bg-surface-800/60 px-3 py-2 text-xs font-bold text-surface-600 dark:text-surface-300">
        <p>{{ `共 ${currentType.drinkList ? currentType.drinkList.length : 0} 樣` }}</p>
        <div class="flex items-center gap-1.5">
          <AppPagination :page="drinkCurrentPage" :page-count="drinkPageCount" :total="currentType.drinkList?.length ?? 0" @update:page="handleDrinkCurrentChange" />
        </div>
      </div>
    </div>

    <div class="w-full xl:w-[28%] p-4 flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between pb-3 mb-3 border-b border-surface-100 dark:border-surface-800">
          <div class="flex items-center gap-2">
            <span class="text-sm font-black text-surface-900 dark:text-surface-100">配料</span>
            <span class="rounded-full bg-surface-100 dark:bg-surface-800 px-2 py-0.5 text-[10px] font-bold text-surface-600 dark:text-surface-300">共 {{ drinkStore.drinkAdd.length }} 樣</span>
          </div>
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              class="pos-btn pos-btn-secondary px-2.5 py-1 text-xs"
              :class="{ 'opacity-50 pointer-events-none': !hasCapability(loginStore.userInfo, 'canSetIngredients') }"
              @click="openAddIngredientsDialog">新增</button>
            <button
              type="button"
              class="pos-btn pos-btn-primary px-2.5 py-1 text-xs"
              :class="{ 'opacity-50 pointer-events-none': !hasCapability(loginStore.userInfo, 'canSetIngredients') }"
              @click="openEditIngredientsDialog">編輯</button>
            <button
              type="button"
              class="pos-btn pos-btn-danger px-2.5 py-1 text-xs"
              :class="{ 'opacity-50 pointer-events-none': !hasCapability(loginStore.userInfo, 'canSetIngredients') }"
              @click="deleteDrinkIngredients">刪除</button>
          </div>
        </div>

        <ModalDialog v-model:open="addIngredientsDialog" title="新增配料">
          <div class="flex flex-col gap-3.5 py-2">
            <label class="flex flex-col gap-1 text-xs font-bold text-surface-600 dark:text-surface-300">
              配料名稱
              <input
                v-model="currentIngredientsInputName"
                class="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 outline-none focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 transition-all"
                placeholder="例如: 波霸,雙Q果..." />
            </label>
            <label class="flex flex-col gap-1 text-xs font-bold text-surface-600 dark:text-surface-300">
              配料的價錢
              <input
                v-model="currentIngredientsInputPrice" type="number" min="1" step="1"
                class="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 outline-none focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 transition-all font-mono"
                placeholder="純數字,例如:1,2,3..." />
            </label>
            <label class="flex flex-col gap-1 text-xs font-bold text-surface-600 dark:text-surface-300">
              庫存
              <input
                v-model="currentIngredientsInputStock" type="number" min="0" step="1"
                class="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 outline-none focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 transition-all font-mono"
                placeholder="留空代表不追蹤庫存" />
            </label>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button type="button" class="rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-sm font-bold text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800" @click="closeAddIngredientsDialog">取消</button>
            <button type="button" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700" @click="addDrinkIngredients">新增</button>
          </div>
        </ModalDialog>

        <ModalDialog v-model:open="editIngredientsDialog" title="編輯配料">
          <div class="flex flex-col gap-3.5 py-2">
            <label class="flex flex-col gap-1 text-xs font-bold text-surface-600 dark:text-surface-300">
              配料名稱
              <input
                v-model="currentEditIngredientsInputName"
                class="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 outline-none focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 transition-all"
                placeholder="例如: 波霸,雙Q果..." />
            </label>
            <label class="flex flex-col gap-1 text-xs font-bold text-surface-600 dark:text-surface-300">
              配料的價錢
              <input
                v-model="currentEditIngredientsInputPrice" type="number" min="1" step="1"
                class="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 outline-none focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 transition-all font-mono"
                placeholder="純數字,例如:1,2,3..." />
            </label>
            <label class="flex flex-col gap-1 text-xs font-bold text-surface-600 dark:text-surface-300">
              庫存
              <input
                v-model="currentEditIngredientsInputStock" type="number" min="0" step="1"
                class="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 outline-none focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 transition-all font-mono"
                placeholder="留空代表不追蹤庫存" />
            </label>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button type="button" class="rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-sm font-bold text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800" @click="closeEditIngredientsDialog">取消</button>
            <button type="button" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700" @click="editDrinkIngredients">保存</button>
          </div>
        </ModalDialog>

        <div class="mt-4 max-h-[420px] overflow-y-auto rounded-xl border border-surface-200 dark:border-surface-800">
          <table class="w-full text-center text-xs">
            <thead class="sticky top-0 z-10 bg-surface-50 dark:bg-surface-800/80 font-bold text-surface-500 dark:text-surface-400 border-b border-surface-200 dark:border-surface-800">
              <tr>
                <th class="px-2 py-2.5">序號</th>
                <th class="px-2 py-2.5">Id</th>
                <th class="px-2 py-2.5 text-left">配料名稱</th>
                <th class="px-2 py-2.5 text-right">價錢</th>
                <th class="px-2 py-2.5">庫存</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
              <tr v-if="sliceIngredients.length === 0">
                <td colspan="5" class="px-2 py-8 text-surface-400 dark:text-surface-500">無配料</td>
              </tr>
              <tr
                v-for="(row, index) in sliceIngredients" :key="row.id"
                class="cursor-pointer transition-colors hover:bg-surface-50 dark:hover:bg-surface-950"
                :class="{ 'bg-primary-50/90 dark:bg-primary-950/40 text-primary-900 dark:text-primary-100 font-bold': currentIngredientsDrink.id === row.id }"
                @click="currentIngredientsDrink = row">
                <td class="px-2 py-2.5 font-mono text-surface-500">{{ index + 1 }}</td>
                <td class="px-2 py-2.5 font-mono text-xs text-surface-400 truncate max-w-[80px]" :title="String(row.id)">{{ row.id }}</td>
                <td class="px-2 py-2.5 text-left font-bold text-surface-900 dark:text-surface-100">{{ row.name }}</td>
                <td class="px-2 py-2.5 text-right font-mono font-bold text-primary-600 dark:text-primary-400">${{ row.price }}</td>
                <td class="px-2 py-2.5 font-mono" :class="stockClass(row.stock)">
                  <span class="rounded-md px-1.5 py-0.5 text-[10px] font-bold">
                    {{ stockLabel(row.stock) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="mt-4 flex items-center justify-between rounded-xl bg-surface-50 dark:bg-surface-800/60 px-3 py-2 text-xs font-bold text-surface-600 dark:text-surface-300">
        <p>{{ `共 ${drinkStore.drinkAdd.length} 樣` }}</p>
        <div class="flex items-center gap-1.5">
          <AppPagination :page="drinkIngredientsCurrentPage" :page-count="drinkIngredientsPageCount" :total="drinkStore.drinkAdd.length" @update:page="handleIngredientsCurrentChange" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
  SwitchRoot,
  SwitchThumb,
} from 'reka-ui'
import ModalDialog from '@/components/ui/ModalDialog.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import { alert, confirm } from '@/composables/useConfirm'
import { showToast } from '@/composables/useToast'
import { useDrinkStore } from '@/stores/drink'
const drinkStore = useDrinkStore()
import { useLoginStore } from "@/stores/login"
const loginStore = useLoginStore()
import type { DrinkAddOnOption, DrinkCustomized, DrinkListItem, DrinkTypeGroup, FormNumeric, MaybeSelected } from '@/types'
import { hasCapability } from '@/utils/selection'
import { ApiError } from '@/api/http'
import {
  createAddOnOption,
  createCatalogGroup,
  createCatalogItem,
  deleteAddOnOption,
  deleteCatalogGroup,
  deleteCatalogItem,
  updateAddOnOption,
  updateCatalogGroup,
  updateCatalogItem,
} from '@/api/catalog'

function apiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 409) return '這個類型底下還有品項，請先清空品項再刪除'
    return `操作失敗：${err.message}`
  }
  return '連不上伺服端，請確認網路連線'
}
// 表單沿用 'none' 代表不支援，轉換函式用於銜接 API 邊界的 number | null。
function toApiPrice(value: FormNumeric | 'none'): number | null {
  return value === 'none' ? null : Number(value)
}
function fromApiPrice(value: number | null): FormNumeric | 'none' {
  return value === null ? 'none' : value
}
// 庫存為選填（空字串代表不追蹤）。v-model 遇 number input 可能為 string 或 number，統一轉字串避免例外。
const LOW_STOCK_THRESHOLD = 5
function toApiStock(value: string | number): number | null {
  const text = String(value).trim()
  return text === '' ? null : Number(text)
}
function stockLabel(stock: number | null | undefined): string {
  if (stock === null || stock === undefined) return '不追蹤'
  return stock === 0 ? '缺貨' : String(stock)
}
function stockClass(stock: number | null | undefined): string {
  if (stock === null || stock === undefined) return 'text-surface-400 dark:text-surface-500'
  if (stock === 0) return 'font-bold text-danger-600 dark:text-danger-400'
  if (stock <= LOW_STOCK_THRESHOLD) return 'font-bold text-warning-600 dark:text-warning-400'
  return ''
}

const currentType = ref<MaybeSelected<DrinkTypeGroup>>({})
const currentInputName = ref('')
const currentInputType = ref('')
const addTypeDialog = ref(false)
const openAddTypeDialog = () => {
  currentInputName.value = ''
  currentInputType.value = ''
  addTypeDialog.value = true
}
const closeAddTypeDialog = () => {
  addTypeDialog.value = false
  showToast('取消操作', 'error')
}
const addDrinkType = async () => {
  if (currentInputName.value === '' || currentInputType.value === '') {
    showToast('請輸入完整資訊', 'error')
    return
  }
  if (drinkStore.drinkType.find((item) => item.name == currentInputName.value)) {
    showToast('此類型已存在,請重新輸入', 'error')
    return
  }
  if (drinkStore.drinkType.find((item) => item.type == currentInputType.value)) {
    showToast('此類型代碼已存在,請重新輸入', 'error')
    return
  }
  try {
    const created = await createCatalogGroup({ name: currentInputName.value, type: currentInputType.value })
    drinkStore.drinkType.push({ id: created.id, name: created.name, type: created.type, drinkList: [] })
    addTypeDialog.value = false
    showToast('新增成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
const drinkTypeCurrentPage = ref(1)
const handleDrinkTypeCurrentChange = (page: number) => {
  drinkTypeCurrentPage.value = page
}
const sliceDrinkType = computed(() => {
  return drinkStore.drinkType.slice((drinkTypeCurrentPage.value - 1) * 10, drinkTypeCurrentPage.value * 10)
})
const drinkTypePageCount = computed(() => Math.max(Math.ceil(drinkStore.drinkType.length / 10), 1))
const deleteDrinkType = async () => {
  if (drinkStore.drinkType.length == 1) {
    showToast('至少要留有一個飲料類型，需修改請善用編輯功能', 'error')
    return
  }
  if (!currentType.value.name) {
    void alert({ title: '通知', description: '請先選擇要刪除的類型', confirmText: '繼續選擇' })
    return
  }
  const result = await confirm({ title: '警告', description: `是否刪除 ${currentType.value.name} 類型?` })
  if (result !== 'confirm') return
  try {
    await deleteCatalogGroup(String(currentType.value.id))
    drinkStore.drinkTypeMenu = ''
    drinkStore.drinkType = drinkStore.drinkType.filter((item) => item.id !== currentType.value.id)
    currentType.value = {}
    currentDrink.value = {}
    showToast('刪除成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
const editTypeDialog = ref(false)
const currentEditInputName = ref('')
const currentEditInputType = ref('')
const openEditTypeDialog = () => {
  if (currentType.value.name) {
    currentEditInputName.value = currentType.value.name
    currentEditInputType.value = currentType.value.type!
    editTypeDialog.value = true
  } else {
    void alert({ title: '通知', description: '請先選擇要編輯的類型', confirmText: '繼續選擇' })
  }
}
const closeEditTypeDialog = () => {
  editTypeDialog.value = false
  showToast('取消操作', 'error')
}
const editDrinkType = async () => {
  if (currentEditInputName.value === '' || currentEditInputType.value === '') {
    showToast('請輸入完整資訊', 'error')
    return
  }
  if (currentEditInputName.value == currentType.value.name && currentEditInputType.value == currentType.value.type) {
    editTypeDialog.value = false
    showToast('保存成功', 'success')
    return
  }
  const anotherName = drinkStore.drinkType.filter(item => item.id != currentType.value.id)
  if (anotherName.some(item => item.name == currentEditInputName.value)) {
    showToast('此類型已存在,請重新輸入', 'error')
    return
  }
  const anotherType = drinkStore.drinkType.filter(item => item.id != currentType.value.id)
  if (anotherType.some(item => item.type == currentEditInputType.value)) {
    showToast('此類型代號已存在,請重新輸入', 'error')
    return
  }
  try {
    const updated = await updateCatalogGroup(String(currentType.value.id), { name: currentEditInputName.value, type: currentEditInputType.value })
    currentType.value.name = updated.name
    currentType.value.type = updated.type
    editTypeDialog.value = false
    showToast('保存成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}

const currentDrink = ref<MaybeSelected<DrinkListItem>>({})
const addDrinkDialog = ref(false)
const openAddDrinkDialog = () => {
  if (currentType.value.name) {
    setPriceL.value = true
    setPriceBottle.value = true
    currentDrinkInputName.value = ''
    currentDrinkInputPriceL.value = ''
    currentDrinkInputPriceBottle.value = ''
    currentDrinkSelectCustomized.value = ''
    currentDrinkInputStock.value = ''
    addDrinkDialog.value = true
  } else {
    void alert({ title: '通知', description: '請先選擇要新增飲料品項的的飲品類型', confirmText: '繼續選擇' })
    return
  }
}
const currentDrinkInputName = ref('')
const currentDrinkInputPriceL = ref<FormNumeric | 'none'>('')
const currentDrinkInputPriceBottle = ref<FormNumeric | 'none'>('')
const currentDrinkSelectCustomized = ref<DrinkCustomized | ''>('')
const currentDrinkInputStock = ref('')
const customized = [
  {
    value: 'none',
    label: '無客製化，容器限大杯',
  },
  {
    value: 'cold',
    label: '僅可做冷飲',
  },
  {
    value: 'both',
    label: '冷熱飲皆可',
  },
]
const checkAddDrinkSelectCustomized = () => {
  if (currentDrinkSelectCustomized.value === 'none') {
    setPriceL.value = true
    setPriceBottle.value = false
    currentDrinkInputPriceBottle.value = 'none'
    showToast('容器僅限大杯,已關閉瓶裝價格輸入', 'error')
    return
  }
}
const closeAddDrinkDialog = () => {
  addDrinkDialog.value = false
  showToast('取消操作', 'error')
}
const setPriceL = ref(true)
const checkPriceLSwitch = () => {
  if (setPriceL.value == false) {
    currentDrinkInputPriceL.value = 'none'
  }
}
const setPriceBottle = ref(true)
const checkPriceBottleSwitch = () => {
  if (setPriceBottle.value == false) {
    currentDrinkInputPriceBottle.value = 'none'
  }
  if (currentDrinkSelectCustomized.value === 'none') {
    setPriceL.value = true
    setPriceBottle.value = false
    currentDrinkInputPriceBottle.value = 'none'
    showToast('因為無客製化，容器僅限大杯,請調整客製化設定', 'error')
    return
  }
}
const addDrink = async () => {
  if (currentDrinkInputName.value === '' || currentDrinkInputPriceL.value === '' || currentDrinkInputPriceBottle.value === '' || currentDrinkSelectCustomized.value === '') {
    showToast('請輸入完整資訊', 'error')
    return
  }
  if (currentType.value.drinkList!.find((item) => item.name == currentDrinkInputName.value)) {
    showToast('此飲料名稱已存在,請重新輸入', 'error')
    return
  }
  if (currentDrinkInputPriceL.value === 'none' && currentDrinkInputPriceBottle.value === 'none') {
    showToast('請至少選擇一種飲料容器，請重新輸入', 'error')
    return
  }
  if (setPriceL.value == true && currentDrinkInputPriceL.value === 'none') {
    showToast('大杯價格不可為空，請重新輸入', 'error')
    return
  }
  if (setPriceBottle.value == true && currentDrinkInputPriceBottle.value === 'none') {
    showToast('瓶裝價格不可為空，請重新輸入', 'error')
    return
  }
  if (currentDrinkSelectCustomized.value === 'none') {
    if (currentDrinkInputPriceBottle.value !== 'none' && setPriceBottle.value !== false) {
      setPriceL.value = true
      setPriceBottle.value = false
      currentDrinkInputPriceBottle.value = 'none'
      showToast('因為無客製化，容器僅限大杯,已關閉瓶裝價格輸入', 'error')
      return
    }
  }
  if (setPriceL.value == true && Number(currentDrinkInputPriceL.value) < 0) {
    showToast('大杯價格不可為負數,請重新輸入', 'error')
    return
  }
  if (setPriceBottle.value == true && Number(currentDrinkInputPriceBottle.value) < 0) {
    showToast('瓶裝價格不可為負數,請重新輸入', 'error')
    return
  }
  try {
    const created = await createCatalogItem({
      groupId: String(currentType.value.id),
      name: currentDrinkInputName.value,
      priceL: toApiPrice(currentDrinkInputPriceL.value),
      priceBottle: toApiPrice(currentDrinkInputPriceBottle.value),
      customized: currentDrinkSelectCustomized.value as DrinkCustomized,
      stock: toApiStock(currentDrinkInputStock.value),
    })
    currentType.value.drinkList!.push({
      id: created.id,
      name: created.name,
      priceL: fromApiPrice(created.priceL),
      priceBottle: fromApiPrice(created.priceBottle),
      customized: created.customized,
      stock: created.stock,
    })
    addDrinkDialog.value = false
    showToast('新增成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
const deleteDrink = async () => {
  if (currentDrink.value == null || !currentDrink.value.name) {
    void alert({ title: '通知', description: '請先選擇要刪除的飲料品項', confirmText: '繼續選擇' })
    return
  }
  const result = await confirm({ title: '警告', description: `是否刪除飲料品項 ${currentDrink.value.name} ?` })
  if (result !== 'confirm') return
  try {
    await deleteCatalogItem(String(currentDrink.value.id))
    currentType.value.drinkList = currentType.value.drinkList!.filter((item) => item.id !== currentDrink.value.id)
    currentDrink.value = {}
    showToast('刪除成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
const currentEditDrinkInputName = ref('')
const currentEditDrinkInputPriceL = ref<FormNumeric | 'none'>('')
const currentEditDrinkInputPriceBottle = ref<FormNumeric | 'none'>('')
const currentEditDrinkSelectCustomized = ref<DrinkCustomized | ''>('')
const currentEditDrinkInputStock = ref('')
const setEditPriceL = ref(true)
const checkEditPriceLSwitch = () => {
  if (setEditPriceL.value == false) {
    currentEditDrinkInputPriceL.value = 'none'
  }
}
const setEditPriceBottle = ref(true)
const checkEditPriceBottleSwitch = () => {
  if (setEditPriceBottle.value == false) {
    currentEditDrinkInputPriceBottle.value = 'none'
  }
  if (currentEditDrinkSelectCustomized.value === 'none') {
    setEditPriceL.value = true
    setEditPriceBottle.value = false
    currentEditDrinkInputPriceBottle.value = 'none'
    showToast('因為無客製化，容器僅限大杯,請調整客製化設定', 'error')
    return
  }
}
const checkEditDrinkSelectCustomized = () => {
  if (currentEditDrinkSelectCustomized.value === 'none') {
    setEditPriceL.value = true
    setEditPriceBottle.value = false
    currentEditDrinkInputPriceBottle.value = 'none'
    showToast('容器僅限大杯,已關閉瓶裝價格輸入', 'error')
    return
  }
}
const editDrinkDialog = ref(false)
const closeEditDrinkDialog = () => {
  editDrinkDialog.value = false
  showToast('取消操作', 'error')
}
const openEditDrinkDialog = () => {
  if (currentDrink.value != null && currentDrink.value.name) {
    currentEditDrinkInputName.value = currentDrink.value.name
    setEditPriceL.value = currentDrink.value.priceL == 'none' ? false : true
    setEditPriceBottle.value = currentDrink.value.priceBottle == 'none' ? false : true
    currentEditDrinkInputPriceL.value = currentDrink.value.priceL == 'none' ? 'none' : currentDrink.value.priceL!
    currentEditDrinkInputPriceBottle.value = currentDrink.value.priceBottle == 'none' ? 'none' : currentDrink.value.priceBottle!
    currentEditDrinkSelectCustomized.value = currentDrink.value.customized!
    currentEditDrinkInputStock.value = currentDrink.value.stock == null ? '' : String(currentDrink.value.stock)
    editDrinkDialog.value = true
  } else {
    void alert({ title: '通知', description: '請先選擇要編輯的飲料品項', confirmText: '繼續選擇' })
  }
}

const editDrink = async () => {
  if (currentEditDrinkInputName.value === '' || currentEditDrinkInputPriceL.value === '' || currentEditDrinkInputPriceBottle.value === '' || currentEditDrinkSelectCustomized.value === '') {
    showToast('請輸入完整資訊', 'error')
    return
  }
  if (setEditPriceL.value == true && currentEditDrinkInputPriceL.value === 'none') {
    showToast('大杯價格不可為空，請重新輸入', 'error')
    return
  }
  if (setEditPriceBottle.value == true && currentEditDrinkInputPriceBottle.value === 'none') {
    showToast('瓶裝價格不可為空，請重新輸入', 'error')
    return
  }
  if (currentEditDrinkInputName.value == currentDrink.value.name && currentEditDrinkInputPriceL.value == currentDrink.value.priceL && currentEditDrinkInputPriceBottle.value == currentDrink.value.priceBottle && currentEditDrinkSelectCustomized.value == currentDrink.value.customized && toApiStock(currentEditDrinkInputStock.value) === (currentDrink.value.stock ?? null)) {
    editDrinkDialog.value = false
    showToast('保存成功', 'success')
    return
  }
  const anotherName = currentType.value.drinkList!.filter(item => item.id != currentDrink.value.id)
  if (anotherName.some(item => item.name == currentEditDrinkInputName.value)) {
    showToast('此飲料名稱已存在,請重新輸入', 'error')
    return
  }
  if (currentEditDrinkInputPriceL.value == 'none' && currentEditDrinkInputPriceBottle.value == 'none') {
    showToast('請至少選擇一種飲料容器,請重新輸入', 'error')
    return
  }
  if (currentEditDrinkSelectCustomized.value === 'none') {
    if (currentEditDrinkInputPriceBottle.value !== 'none' && setPriceBottle.value !== false) {
      setEditPriceL.value = true
      setEditPriceBottle.value = false
      currentEditDrinkInputPriceBottle.value = 'none'
      showToast('因為無客製化，容器僅限大杯,已關閉瓶裝價格輸入', 'error')
      return
    }
  }
  if (setEditPriceL.value == true && Number(currentEditDrinkInputPriceL.value) < 0) {
    showToast('大杯價格不可為負數,請重新輸入', 'error')
    return
  }
  if (setEditPriceBottle.value == true && Number(currentEditDrinkInputPriceBottle.value) < 0) {
    showToast('瓶裝價格不可為負數,請重新輸入', 'error')
    return
  }
  try {
    const updated = await updateCatalogItem(String(currentDrink.value.id), {
      groupId: String(currentType.value.id),
      name: currentEditDrinkInputName.value,
      priceL: toApiPrice(currentEditDrinkInputPriceL.value),
      priceBottle: toApiPrice(currentEditDrinkInputPriceBottle.value),
      customized: currentEditDrinkSelectCustomized.value as DrinkCustomized,
      stock: toApiStock(currentEditDrinkInputStock.value),
    })
    currentDrink.value.name = updated.name
    currentDrink.value.priceL = fromApiPrice(updated.priceL)
    currentDrink.value.priceBottle = fromApiPrice(updated.priceBottle)
    currentDrink.value.customized = updated.customized
    currentDrink.value.stock = updated.stock
    editDrinkDialog.value = false
    showToast('保存成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
const drinkCurrentPage = ref(1)
const handleDrinkCurrentChange = (page: number) => {
  drinkCurrentPage.value = page
}
const sliceDrink = computed(() => {
  if (currentType.value.drinkList) {
    return currentType.value.drinkList.slice((drinkCurrentPage.value - 1) * 10, drinkCurrentPage.value * 10)
  } else {
    return []
  }
})
const drinkPageCount = computed(() => Math.max(Math.ceil((currentType.value.drinkList?.length ?? 0) / 10), 1))

const currentIngredientsDrink = ref<MaybeSelected<DrinkAddOnOption>>({})
const addIngredientsDialog = ref(false)
const openAddIngredientsDialog = () => {
  currentIngredientsInputName.value = ''
  currentIngredientsInputPrice.value = ''
  currentIngredientsInputStock.value = ''
  addIngredientsDialog.value = true
}
const closeAddIngredientsDialog = () => {
  addIngredientsDialog.value = false
  showToast('取消操作', 'error')
}
const currentIngredientsInputName = ref('')
const currentIngredientsInputPrice = ref<FormNumeric>('')
const currentIngredientsInputStock = ref('')
const addDrinkIngredients = async () => {
  if (currentIngredientsInputName.value === '' || currentIngredientsInputPrice.value === '') {
    showToast('請輸入完整資訊', 'error')
    return
  }
  if (drinkStore.drinkAdd.find((item) => item.name == currentIngredientsInputName.value)) {
    showToast('此配料名稱已存在,請重新輸入', 'error')
    return
  }
  if (Number(currentIngredientsInputPrice.value) < 0) {
    showToast('配料價格不可為負數,請重新輸入', 'error')
    return
  }
  try {
    const created = await createAddOnOption({
      name: currentIngredientsInputName.value,
      price: Number(currentIngredientsInputPrice.value),
      stock: toApiStock(currentIngredientsInputStock.value),
    })
    drinkStore.drinkAdd.push({ id: created.id, name: created.name, price: created.price, stock: created.stock })
    addIngredientsDialog.value = false
    showToast('新增成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
const deleteDrinkIngredients = async () => {
  if (!currentIngredientsDrink.value.name) {
    void alert({ title: '通知', description: '請先選擇要刪除的配料', confirmText: '繼續選擇' })
    return
  }
  const result = await confirm({ title: '警告', description: `是否刪除配料 ${currentIngredientsDrink.value.name} ?` })
  if (result !== 'confirm') return
  try {
    await deleteAddOnOption(String(currentIngredientsDrink.value.id))
    drinkStore.drinkAdd = drinkStore.drinkAdd.filter((item) => item.id !== currentIngredientsDrink.value.id)
    currentIngredientsDrink.value = {}
    showToast('刪除成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
const editIngredientsDialog = ref(false)
const closeEditIngredientsDialog = () => {
  editIngredientsDialog.value = false
  showToast('取消操作', 'error')
}
const currentEditIngredientsInputName = ref('')
const currentEditIngredientsInputPrice = ref<FormNumeric>('')
const currentEditIngredientsInputStock = ref('')
const openEditIngredientsDialog = () => {
  if (currentIngredientsDrink.value.name) {
    currentEditIngredientsInputName.value = currentIngredientsDrink.value.name
    currentEditIngredientsInputPrice.value = currentIngredientsDrink.value.price!
    currentEditIngredientsInputStock.value = currentIngredientsDrink.value.stock == null ? '' : String(currentIngredientsDrink.value.stock)
    editIngredientsDialog.value = true
  } else {
    void alert({ title: '通知', description: '請先選擇要編輯的配料', confirmText: '繼續選擇' })
  }
}
const editDrinkIngredients = async () => {
  if (currentEditIngredientsInputName.value === '' || currentEditIngredientsInputPrice.value === '') {
    showToast('請輸入完整資訊', 'error')
    return
  }
  if (currentEditIngredientsInputName.value == currentIngredientsDrink.value.name && currentEditIngredientsInputPrice.value == currentIngredientsDrink.value.price && toApiStock(currentEditIngredientsInputStock.value) === (currentIngredientsDrink.value.stock ?? null)) {
    editIngredientsDialog.value = false
    showToast('保存成功', 'success')
    return
  }
  const anotherName = drinkStore.drinkAdd.filter(item => item.id != currentIngredientsDrink.value.id)
  if (anotherName.some(item => item.name == currentEditIngredientsInputName.value)) {
    showToast('此配料名稱已存在,請重新輸入', 'error')
    return
  }
  if (Number(currentEditIngredientsInputPrice.value) < 0) {
    showToast('配料價格不可為負數,請重新輸入', 'error')
    return
  }
  try {
    const updated = await updateAddOnOption(String(currentIngredientsDrink.value.id), {
      name: currentEditIngredientsInputName.value,
      price: Number(currentEditIngredientsInputPrice.value),
      stock: toApiStock(currentEditIngredientsInputStock.value),
    })
    currentIngredientsDrink.value.name = updated.name
    currentIngredientsDrink.value.price = updated.price
    currentIngredientsDrink.value.stock = updated.stock
    editIngredientsDialog.value = false
    showToast('保存成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
const drinkIngredientsCurrentPage = ref(1)
const handleIngredientsCurrentChange = (page: number) => {
  drinkIngredientsCurrentPage.value = page
}
const sliceIngredients = computed(() => {
  if (drinkStore.drinkAdd) {
    return drinkStore.drinkAdd.slice((drinkIngredientsCurrentPage.value - 1) * 10, drinkIngredientsCurrentPage.value * 10)
  } else {
    return []
  }
})
const drinkIngredientsPageCount = computed(() => Math.max(Math.ceil(drinkStore.drinkAdd.length / 10), 1))
</script>

<style lang="scss" scoped></style>