<template>
  <!-- 飲品類型 -->
  <div class="xl:flex-[1] md:w-[30%] w-[33%]">
    <div class="flex justify-between mt-2">
      <div class="ml-2 lg:text-lg md:text-sm text-xs text-surface-900 dark:text-surface-100 font-bold border-b-2 border-solid border-surface-300 dark:border-surface-700">飲品類型</div>
      <div class="flex mr-2">
        <!-- 新增功能 -->
        <button
class="lg:px-2 px-0.5 border border-surface-300 dark:border-surface-700 rounded-lg mx-1 lg:text-md md:text-sm text-xs text-surface-700 dark:text-surface-200 font-bold bg-white dark:bg-surface-800 select-none hover:bg-surface-100 dark:hover:bg-surface-700 active:bg-primary-50 dark:active:bg-surface-600"
          :class="{ 'opacity-50': !hasCapability(loginStore.userInfo, 'canSetDrinkType'), 'pointer-events-none': !hasCapability(loginStore.userInfo, 'canSetDrinkType') }"
          @click="openAddTypeDialog">新增</button>
        <!-- 新增飲品類型 -->
        <!-- P8：組件庫替換——el-dialog 改用 ModalDialog（Reka UI
             Dialog）。這個頁面的資料本來就完全是本機陣列操作（見
             stores/drink.ts 的說明，從沒接過 API），驗證邏輯維持原本
             的一連串 if/else，只是把 ElMessage／ElMessageBox 換成
             showToast／confirm／alert，不改成 VeeValidate + Zod——這裡
             欄位之間有大量互相牽動的邏輯（例如客製化選「無」會連動關掉
             瓶裝開關、清空瓶裝價格），改成 schema 驅動反而容易在沒有
             e2e 覆蓋的情況下悄悄改變行為。 -->
        <ModalDialog v-model:open="addTypeDialog" title="新增飲品類型">
          <div class="w-4/5 flex justify-between items-center text-surface-900 dark:text-surface-100 text-lg font-bold my-2">
            飲品類型:<input
v-model="currentInputName"
              class="border border-surface-300 dark:border-surface-700 rounded-lg ml-2 text-center px-2 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100"
              placeholder="例如: 原味茶,芝芝系列..." />
          </div>
          <div class="w-4/5 flex justify-between items-center text-surface-900 dark:text-surface-100 text-lg font-bold my-2">
            飲品類型的代號:<input
v-model="currentInputType"
              class="border border-surface-300 dark:border-surface-700 rounded-lg ml-2 text-center px-2 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100"
              placeholder="例如: drinkMilk..." />
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button type="button" class="rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-sm font-bold text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800" @click="closeAddTypeDialog">取消</button>
            <button type="button" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700" @click="addDrinkType">新增</button>
          </div>
        </ModalDialog>
        <!-- 刪除功能 -->
        <button
:class="{ 'opacity-50': !hasCapability(loginStore.userInfo, 'canSetDrinkType'), 'pointer-events-none': !hasCapability(loginStore.userInfo, 'canSetDrinkType') }"
          class="lg:px-2 px-0.5 border border-surface-300 dark:border-surface-700 rounded-lg mx-1 lg:text-md md:text-sm text-xs text-surface-700 dark:text-surface-200 font-bold bg-white dark:bg-surface-800 select-none hover:bg-surface-100 dark:hover:bg-surface-700 active:bg-primary-50 dark:active:bg-surface-600"
          @click="deleteDrinkType">刪除</button>
        <!-- 編輯功能 -->
        <button
:class="{ 'opacity-50': !hasCapability(loginStore.userInfo, 'canSetDrinkType'), 'pointer-events-none': !hasCapability(loginStore.userInfo, 'canSetDrinkType') }"
          class="lg:px-2 px-0.5 border border-surface-300 dark:border-surface-700 rounded-lg mx-1 lg:text-md md:text-sm text-xs text-surface-700 dark:text-surface-200 font-bold bg-white dark:bg-surface-800 select-none hover:bg-surface-100 dark:hover:bg-surface-700 active:bg-primary-50 dark:active:bg-surface-600"
          @click="openEditTypeDialog">編輯</button>
        <!-- 編輯飲品類型 -->
        <ModalDialog v-model:open="editTypeDialog" title="編輯飲品類型">
          <div class="w-4/5 flex justify-between items-center text-surface-900 dark:text-surface-100 text-lg font-bold my-2">
            飲品類型:<input
v-model="currentEditInputName"
              class="border border-surface-300 dark:border-surface-700 rounded-lg ml-2 text-center px-2 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100"
              placeholder="例如: 原味茶,芝芝系列..." />
          </div>
          <div class="w-4/5 flex justify-between items-center text-surface-900 dark:text-surface-100 text-lg font-bold my-2">
            飲品類型的代號:<input
v-model="currentEditInputType"
              class="border border-surface-300 dark:border-surface-700 rounded-lg ml-2 text-center px-2 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100"
              placeholder="例如: drinkMilk..." />
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button type="button" class="rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-sm font-bold text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800" @click="closeEditTypeDialog">取消</button>
            <button type="button" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700" @click="editDrinkType">保存</button>
          </div>
        </ModalDialog>
      </div>
    </div>
    <div>
      <!-- P8：組件庫替換——el-table 改用純 HTML table，跟其餘 P8 已
           遷移頁面一致；highlight-current-row 改成點列時比對 id 加
           class，el-pagination（只用 prev/next）改用原生按鈕。 -->
      <table class="mt-2 w-full text-center text-sm">
        <thead class="bg-surface-100 dark:bg-surface-800 text-xs font-bold text-surface-500 dark:text-surface-400">
          <tr>
            <th class="px-2 py-2">序號</th>
            <th class="px-2 py-2">Id</th>
            <th class="px-2 py-2">類型</th>
            <th class="px-2 py-2">類型代號</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
          <tr v-if="sliceDrinkType.length === 0">
            <td colspan="4" class="px-2 py-8 text-surface-400 dark:text-surface-500">無飲品類型</td>
          </tr>
          <tr
            v-for="(row, index) in sliceDrinkType" :key="row.id" class="cursor-pointer transition-colors hover:bg-surface-50 dark:hover:bg-surface-950"
            :class="{ 'bg-primary-50 dark:bg-primary-950/40': currentType.id === row.id }" @click="currentType = row">
            <td class="px-2 py-2">{{ index + 1 }}</td>
            <td class="px-2 py-2">{{ row.id }}</td>
            <td class="px-2 py-2">{{ row.name }}</td>
            <td class="px-2 py-2">{{ row.type }}</td>
          </tr>
        </tbody>
      </table>
      <div class="mt-4 flex items-center justify-around rounded-lg bg-surface-100 dark:bg-surface-800 px-2 py-2 text-sm text-surface-600 dark:text-surface-400">
        <p>{{ `共 ${drinkStore.drinkType.length} 樣` }}</p>
        <div class="flex items-center gap-2">
          <button type="button" class="rounded border border-surface-300 dark:border-surface-700 px-2 disabled:opacity-40" :disabled="drinkTypeCurrentPage <= 1" @click="handleDrinkTypeCurrentChange(drinkTypeCurrentPage - 1)">‹</button>
          <button type="button" class="rounded border border-surface-300 dark:border-surface-700 px-2 disabled:opacity-40" :disabled="drinkTypeCurrentPage >= drinkTypePageCount" @click="handleDrinkTypeCurrentChange(drinkTypeCurrentPage + 1)">›</button>
        </div>
        <p>{{ `${drinkStore.drinkType.length > 0 ? drinkTypeCurrentPage : 0}/${drinkTypePageCount}頁` }}</p>
      </div>
    </div>
  </div>
  <!-- 飲料品項 -->
  <div class="xl:flex-[1] md:w-[40%] w-[34%] border-x-2 border-solid border-surface-200 dark:border-surface-800 rounded-lg">
    <div class="flex justify-between mt-2">
      <div class="ml-2 lg:text-lg md:text-sm text-xs text-surface-900 dark:text-surface-100 font-bold border-b-2 border-solid border-surface-300 dark:border-surface-700">飲料品項</div>
      <div class="flex mr-2">
        <!-- 新增功能 -->
        <button
:class="{ 'opacity-50': !hasCapability(loginStore.userInfo, 'canSetDrink'), 'pointer-events-none': !hasCapability(loginStore.userInfo, 'canSetDrink') }"
          class="lg:px-2 px-0.5 border border-surface-300 dark:border-surface-700 rounded-lg mx-1 lg:text-md md:text-sm text-xs text-surface-700 dark:text-surface-200 font-bold bg-white dark:bg-surface-800 select-none hover:bg-surface-100 dark:hover:bg-surface-700 active:bg-primary-50 dark:active:bg-surface-600"
          @click="openAddDrinkDialog">新增</button>
        <!-- 新增飲料品項 -->
        <!-- P8：組件庫替換——el-switch 改用 Reka UI 的 Switch 原語，
             el-select／el-option 改用 Reka UI 的 Select 原語。 -->
        <ModalDialog v-model:open="addDrinkDialog" title="新增飲料品項">
          <div class="w-4/5 flex justify-between items-center text-surface-900 dark:text-surface-100 text-lg font-bold my-2">
            飲料名稱:<input
v-model="currentDrinkInputName"
              class="border border-surface-300 dark:border-surface-700 rounded-lg ml-2 text-center px-2 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100"
              placeholder="例如: 芝芝金萱,金萱雙Q..." />
          </div>
          <div class="w-4/5 flex justify-between items-center text-surface-900 dark:text-surface-100 text-lg font-bold my-2">
            大杯價格:
            <div class="flex items-center">
              <SwitchRoot
                v-model="setPriceL" class="relative h-6 w-11 rounded-full bg-surface-300 dark:bg-surface-700 data-[state=checked]:bg-primary-500"
                @update:model-value="checkPriceLSwitch">
                <SwitchThumb class="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
              </SwitchRoot>
              <input
v-if="setPriceL" v-model="currentDrinkInputPriceL" type="number" min="1" step="1"
                class="border border-surface-300 dark:border-surface-700 rounded-lg ml-2 text-center px-2 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100" placeholder="無此容器，請關左側開關" />
              <div v-else class="w-[235px] border border-surface-300 dark:border-surface-700 rounded-lg ml-2 text-center px-2 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100">
                none
              </div>
            </div>
          </div>
          <div class="w-4/5 flex justify-between items-center text-surface-900 dark:text-surface-100 text-lg font-bold my-2">
            瓶裝價格:
            <div class="flex items-center">
              <SwitchRoot
                v-model="setPriceBottle" class="relative h-6 w-11 rounded-full bg-surface-300 dark:bg-surface-700 data-[state=checked]:bg-primary-500"
                @update:model-value="checkPriceBottleSwitch">
                <SwitchThumb class="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
              </SwitchRoot>
              <input
v-if="setPriceBottle" v-model="currentDrinkInputPriceBottle" type="number" min="1" step="1"
                class="border border-surface-300 dark:border-surface-700 rounded-lg ml-2 text-center px-2 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100" placeholder="無此容器，請關左側開關" />
              <div v-else class="w-[235px] border border-surface-300 dark:border-surface-700 rounded-lg ml-2 text-center px-2 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100">
                none
              </div>
            </div>
          </div>
          <div class="w-4/5 flex justify-between items-center text-surface-900 dark:text-surface-100 text-lg font-bold my-2">
            客製化:
            <SelectRoot v-model="currentDrinkSelectCustomized" @update:model-value="checkAddDrinkSelectCustomized">
              <SelectTrigger class="flex w-[235px] items-center justify-between rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 px-2 py-1 text-left text-surface-900 dark:text-surface-100">
                <SelectValue placeholder="請選擇飲料的客製化設定" />
                <span aria-hidden="true">▾</span>
              </SelectTrigger>
              <SelectPortal>
                <SelectContent class="z-50 w-[235px] rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-800 shadow-lg" position="popper">
                  <SelectViewport class="p-1">
                    <SelectItem
                      v-for="item in customized" :key="item.value" :value="item.value"
                      class="flex cursor-pointer justify-between rounded px-2 py-1 outline-none hover:bg-surface-100 dark:hover:bg-surface-800 data-[state=checked]:bg-primary-50 dark:data-[state=checked]:bg-primary-950/40">
                      <SelectItemText>{{ item.label }}</SelectItemText>
                      <span class="text-xs text-surface-400 dark:text-surface-500">{{ item.value }}</span>
                    </SelectItem>
                  </SelectViewport>
                </SelectContent>
              </SelectPortal>
            </SelectRoot>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button type="button" class="rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-sm font-bold text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800" @click="closeAddDrinkDialog">取消</button>
            <button type="button" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700" @click="addDrink">新增</button>
          </div>
        </ModalDialog>
        <!-- 刪除功能 -->
        <button
:class="{ 'opacity-50': !hasCapability(loginStore.userInfo, 'canSetDrink'), 'pointer-events-none': !hasCapability(loginStore.userInfo, 'canSetDrink') }"
          class="lg:px-2 px-0.5 border border-surface-300 dark:border-surface-700 rounded-lg mx-1 lg:text-md md:text-sm text-xs text-surface-700 dark:text-surface-200 font-bold bg-white dark:bg-surface-800 select-none hover:bg-surface-100 dark:hover:bg-surface-700 active:bg-primary-50 dark:active:bg-surface-600"
          @click="deleteDrink">刪除</button>
        <!-- 編輯功能 -->
        <button
:class="{ 'opacity-50': !hasCapability(loginStore.userInfo, 'canSetDrink'), 'pointer-events-none': !hasCapability(loginStore.userInfo, 'canSetDrink') }"
          class="lg:px-2 px-0.5 border border-surface-300 dark:border-surface-700 rounded-lg mx-1 lg:text-md md:text-sm text-xs text-surface-700 dark:text-surface-200 font-bold bg-white dark:bg-surface-800 select-none hover:bg-surface-100 dark:hover:bg-surface-700 active:bg-primary-50 dark:active:bg-surface-600"
          @click="openEditDrinkDialog">編輯</button>
        <!-- 編輯飲料品項 -->
        <ModalDialog v-model:open="editDrinkDialog" title="編輯飲料品項">
          <div class="w-4/5 flex justify-between items-center text-surface-900 dark:text-surface-100 text-lg font-bold my-2">
            飲料名稱:<input
v-model="currentEditDrinkInputName"
              class="border border-surface-300 dark:border-surface-700 rounded-lg ml-2 text-center px-2 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100"
              placeholder="例如: 芝芝金萱,金萱雙Q..." />
          </div>
          <div class="w-4/5 flex justify-between items-center text-surface-900 dark:text-surface-100 text-lg font-bold my-2">
            大杯價格:
            <div class="flex items-center">
              <SwitchRoot
                v-model="setEditPriceL" class="relative h-6 w-11 rounded-full bg-surface-300 dark:bg-surface-700 data-[state=checked]:bg-primary-500"
                @update:model-value="checkEditPriceLSwitch">
                <SwitchThumb class="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
              </SwitchRoot>
              <input
v-if="setEditPriceL" v-model="currentEditDrinkInputPriceL" type="number" min="1" step="1"
                class="border border-surface-300 dark:border-surface-700 rounded-lg ml-2 text-center px-2 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100" placeholder="無此容器，請關左側開關" />
              <div v-else class="w-[235px] border border-surface-300 dark:border-surface-700 rounded-lg ml-2 text-center px-2 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100">
                none
              </div>
            </div>
          </div>
          <div class="w-4/5 flex justify-between items-center text-surface-900 dark:text-surface-100 text-lg font-bold my-2">
            瓶裝價格:
            <div class="flex items-center">
              <SwitchRoot
                v-model="setEditPriceBottle" class="relative h-6 w-11 rounded-full bg-surface-300 dark:bg-surface-700 data-[state=checked]:bg-primary-500"
                @update:model-value="checkEditPriceBottleSwitch">
                <SwitchThumb class="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
              </SwitchRoot>
              <input
v-if="setEditPriceBottle" v-model="currentEditDrinkInputPriceBottle" type="number" min="1" step="1"
                class="border border-surface-300 dark:border-surface-700 rounded-lg ml-2 text-center px-2 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100"
                placeholder="純數字,例如:1,2,3..." />
              <div v-else class="w-[235px] border border-surface-300 dark:border-surface-700 rounded-lg ml-2 text-center px-2 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100">
                none
              </div>
            </div>
          </div>
          <div class="w-4/5 flex justify-between items-center text-surface-900 dark:text-surface-100 text-lg font-bold my-2">
            客製化:
            <SelectRoot v-model="currentEditDrinkSelectCustomized" @update:model-value="checkEditDrinkSelectCustomized">
              <SelectTrigger class="flex w-[235px] items-center justify-between rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 px-2 py-1 text-left text-surface-900 dark:text-surface-100">
                <SelectValue placeholder="請選擇飲料的客製化設定" />
                <span aria-hidden="true">▾</span>
              </SelectTrigger>
              <SelectPortal>
                <SelectContent class="z-50 w-[235px] rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-800 shadow-lg" position="popper">
                  <SelectViewport class="p-1">
                    <SelectItem
                      v-for="item in customized" :key="item.value" :value="item.value"
                      class="flex cursor-pointer justify-between rounded px-2 py-1 outline-none hover:bg-surface-100 dark:hover:bg-surface-800 data-[state=checked]:bg-primary-50 dark:data-[state=checked]:bg-primary-950/40">
                      <SelectItemText>{{ item.label }}</SelectItemText>
                      <span class="text-xs text-surface-400 dark:text-surface-500">{{ item.value }}</span>
                    </SelectItem>
                  </SelectViewport>
                </SelectContent>
              </SelectPortal>
            </SelectRoot>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button type="button" class="rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-sm font-bold text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800" @click="closeEditDrinkDialog">取消</button>
            <button type="button" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700" @click="editDrink">保存</button>
          </div>
        </ModalDialog>
      </div>
    </div>
    <div>
      <table class="mt-2 w-full text-center text-sm">
        <thead class="bg-surface-100 dark:bg-surface-800 text-xs font-bold text-surface-500 dark:text-surface-400">
          <tr>
            <th class="px-2 py-2">序號</th>
            <th class="px-2 py-2">Id</th>
            <th class="px-2 py-2">飲料名稱</th>
            <th class="px-2 py-2">大杯價格</th>
            <th class="px-2 py-2">瓶裝價格</th>
            <th class="px-2 py-2">客製化</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
          <tr v-if="sliceDrink.length === 0">
            <td colspan="6" class="px-2 py-8 text-surface-400 dark:text-surface-500">請先選擇飲品類型</td>
          </tr>
          <tr
            v-for="(row, index) in sliceDrink" :key="row.id" class="cursor-pointer transition-colors hover:bg-surface-50 dark:hover:bg-surface-950"
            :class="{ 'bg-primary-50 dark:bg-primary-950/40': currentDrink.id === row.id }" @click="currentDrink = row">
            <td class="px-2 py-2">{{ index + 1 }}</td>
            <td class="px-2 py-2">{{ row.id }}</td>
            <td class="px-2 py-2">{{ row.name }}</td>
            <td class="px-2 py-2">{{ row.priceL }}</td>
            <td class="px-2 py-2">{{ row.priceBottle }}</td>
            <td class="px-2 py-2">{{ row.customized }}</td>
          </tr>
        </tbody>
      </table>
      <div class="mt-4 flex items-center justify-around rounded-lg bg-surface-100 dark:bg-surface-800 px-2 py-2 text-sm text-surface-600 dark:text-surface-400">
        <p>{{ `共 ${currentType.drinkList ? currentType.drinkList.length : 0} 樣` }}</p>
        <div class="flex items-center gap-2">
          <button type="button" class="rounded border border-surface-300 dark:border-surface-700 px-2 disabled:opacity-40" :disabled="drinkCurrentPage <= 1" @click="handleDrinkCurrentChange(drinkCurrentPage - 1)">‹</button>
          <button type="button" class="rounded border border-surface-300 dark:border-surface-700 px-2 disabled:opacity-40" :disabled="drinkCurrentPage >= drinkPageCount" @click="handleDrinkCurrentChange(drinkCurrentPage + 1)">›</button>
        </div>
        <p v-if="currentType.drinkList">{{ `${drinkCurrentPage}/${drinkPageCount}頁` }}</p>
        <p v-else>0/0頁</p>
      </div>
    </div>
  </div>
  <!-- 配料 -->
  <div class="xl:flex-[1] md:w-[30%] w-[33%]">
    <div class="flex justify-between mt-2">
      <div class="ml-2 lg:text-lg md:text-sm text-xs text-surface-900 dark:text-surface-100 font-bold border-b-2 border-solid border-surface-300 dark:border-surface-700">配料</div>
      <div class="flex mr-2">
        <!-- 新增功能 -->
        <button
:class="{ 'opacity-50': !hasCapability(loginStore.userInfo, 'canSetIngredients'), 'pointer-events-none': !hasCapability(loginStore.userInfo, 'canSetIngredients') }"
          class="lg:px-2 px-0.5 border border-surface-300 dark:border-surface-700 rounded-lg mx-1 lg:text-md md:text-sm text-xs text-surface-700 dark:text-surface-200 font-bold bg-white dark:bg-surface-800 select-none hover:bg-surface-100 dark:hover:bg-surface-700 active:bg-primary-50 dark:active:bg-surface-600"
          @click="openAddIngredientsDialog">新增</button>
        <!-- 新增配料 -->
        <ModalDialog v-model:open="addIngredientsDialog" title="新增配料">
          <div class="w-4/5 flex justify-between items-center text-surface-900 dark:text-surface-100 text-lg font-bold my-2">
            配料名稱:<input
v-model="currentIngredientsInputName"
              class="border border-surface-300 dark:border-surface-700 rounded-lg ml-2 text-center px-2 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100" placeholder="例如: 波霸,雙Q果..." />
          </div>
          <div class="w-4/5 flex justify-between items-center text-surface-900 dark:text-surface-100 text-lg font-bold my-2">
            配料的價錢:<input
v-model="currentIngredientsInputPrice" type="number" min="1" step="1"
              class="border border-surface-300 dark:border-surface-700 rounded-lg ml-2 text-center px-2 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100"
              placeholder="純數字,例如:1,2,3..." />
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button type="button" class="rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-sm font-bold text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800" @click="closeAddIngredientsDialog">取消</button>
            <button type="button" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700" @click="addDrinkIngredients">新增</button>
          </div>
        </ModalDialog>
        <!-- 刪除功能 -->
        <button
:class="{ 'opacity-50': !hasCapability(loginStore.userInfo, 'canSetIngredients'), 'pointer-events-none': !hasCapability(loginStore.userInfo, 'canSetIngredients') }"
          class="lg:px-2 px-0.5 border border-surface-300 dark:border-surface-700 rounded-lg mx-1 lg:text-md md:text-sm text-xs text-surface-700 dark:text-surface-200 font-bold bg-white dark:bg-surface-800 select-none hover:bg-surface-100 dark:hover:bg-surface-700 active:bg-primary-50 dark:active:bg-surface-600"
          @click="deleteDrinkIngredients">刪除</button>
        <!-- 編輯功能 -->
        <button
:class="{ 'opacity-50': !hasCapability(loginStore.userInfo, 'canSetIngredients'), 'pointer-events-none': !hasCapability(loginStore.userInfo, 'canSetIngredients') }"
          class="lg:px-2 px-0.5 border border-surface-300 dark:border-surface-700 rounded-lg mx-1 lg:text-md md:text-sm text-xs text-surface-700 dark:text-surface-200 font-bold bg-white dark:bg-surface-800 select-none hover:bg-surface-100 dark:hover:bg-surface-700 active:bg-primary-50 dark:active:bg-surface-600"
          @click="openEditIngredientsDialog">編輯</button>
        <!-- 編輯配料 -->
        <ModalDialog v-model:open="editIngredientsDialog" title="編輯配料">
          <div class="w-4/5 flex justify-between items-center text-surface-900 dark:text-surface-100 text-lg font-bold my-2">
            配料名稱:<input
v-model="currentEditIngredientsInputName"
              class="border border-surface-300 dark:border-surface-700 rounded-lg ml-2 text-center px-2 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100" placeholder="例如: 波霸,雙Q果..." />
          </div>
          <div class="w-4/5 flex justify-between items-center text-surface-900 dark:text-surface-100 text-lg font-bold my-2">
            配料的價錢:<input
v-model="currentEditIngredientsInputPrice" type="number" min="1" step="1"
              class="border border-surface-300 dark:border-surface-700 rounded-lg ml-2 text-center px-2 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100"
              placeholder="純數字,例如:1,2,3..." />
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button type="button" class="rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-sm font-bold text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800" @click="closeEditIngredientsDialog">取消</button>
            <button type="button" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700" @click="editDrinkIngredients">保存</button>
          </div>
        </ModalDialog>
      </div>
    </div>
    <div>
      <table class="mt-2 w-full text-center text-sm">
        <thead class="bg-surface-100 dark:bg-surface-800 text-xs font-bold text-surface-500 dark:text-surface-400">
          <tr>
            <th class="px-2 py-2">序號</th>
            <th class="px-2 py-2">Id</th>
            <th class="px-2 py-2">配料名稱</th>
            <th class="px-2 py-2">價錢</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
          <tr v-if="sliceIngredients.length === 0">
            <td colspan="4" class="px-2 py-8 text-surface-400 dark:text-surface-500">無配料</td>
          </tr>
          <tr
            v-for="(row, index) in sliceIngredients" :key="row.id" class="cursor-pointer transition-colors hover:bg-surface-50 dark:hover:bg-surface-950"
            :class="{ 'bg-primary-50 dark:bg-primary-950/40': currentIngredientsDrink.id === row.id }" @click="currentIngredientsDrink = row">
            <td class="px-2 py-2">{{ index + 1 }}</td>
            <td class="px-2 py-2">{{ row.id }}</td>
            <td class="px-2 py-2">{{ row.name }}</td>
            <td class="px-2 py-2">{{ row.price }}</td>
          </tr>
        </tbody>
      </table>
      <div class="mt-4 flex items-center justify-around rounded-lg bg-surface-100 dark:bg-surface-800 px-2 py-2 text-sm text-surface-600 dark:text-surface-400">
        <p>{{ `共 ${drinkStore.drinkAdd.length} 樣` }}</p>
        <div class="flex items-center gap-2">
          <button type="button" class="rounded border border-surface-300 dark:border-surface-700 px-2 disabled:opacity-40" :disabled="drinkIngredientsCurrentPage <= 1" @click="handleIngredientsCurrentChange(drinkIngredientsCurrentPage - 1)">‹</button>
          <button type="button" class="rounded border border-surface-300 dark:border-surface-700 px-2 disabled:opacity-40" :disabled="drinkIngredientsCurrentPage >= drinkIngredientsPageCount" @click="handleIngredientsCurrentChange(drinkIngredientsCurrentPage + 1)">›</button>
        </div>
        <p>{{ `${drinkStore.drinkAdd.length > 0 ? drinkIngredientsCurrentPage : 0}/${drinkIngredientsPageCount}頁` }}</p>
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

// P18（規劃書 §10 P18「菜單與權限管理接上伺服端」）：這個頁面的新增／
// 刪除／編輯改成真的呼叫 apps/api 的菜單寫入端點（見 api/catalog.ts），
// 不再只是本機 drinkStore 陣列操作。Id 因此不再是這裡手動輸入的欄位
// ——新增時由伺服端配發（crypto.randomUUID()，見 apps/api/src/routes/
// catalog.ts），編輯只能改名稱／價格等欄位，不能改 Id。
//
// P8 當時的說明仍然成立：飲料品項的表單欄位之間有大量互相牽動的邏輯
// （客製化選「無」會連動關掉瓶裝開關、清空瓶裝價格），這裡繼續維持
// 原本 ref + if/else 的驗證方式，不改成 offerSetting.vue 那種
// VeeValidate + Zod 的 <Form> 寫法，只把送出時的動作從「改本機陣列」
// 換成「呼叫 API，成功後用伺服端回傳的資料更新本機陣列」。
function apiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 409) return '這個類型底下還有品項，請先清空品項再刪除'
    return `操作失敗：${err.message}`
  }
  return '連不上伺服端，請確認網路連線'
}
// 伺服端的價格是「支援就填數字、不支援就是 null」，這個頁面既有的
// 表單欄位沿用 D-19 那套「不支援用字面值 'none' 表示」的慣例，這兩個
// 轉換函式只在跟 API 邊界銜接時各用一次。
function toApiPrice(value: FormNumeric | 'none'): number | null {
  return value === 'none' ? null : Number(value)
}
function fromApiPrice(value: number | null): FormNumeric | 'none' {
  return value === null ? 'none' : value
}

// 飲品類型相關功能
// 存放當前已選類型
// P8：組件庫替換——el-table 的 @current-change 事件改成模板上直接
// @click="currentType = row"（見上方 template），不需要中介的
// handleCurrentChange 函式，其餘兩個表格（飲料品項／配料）比照辦理。
const currentType = ref<MaybeSelected<DrinkTypeGroup>>({})
// 存放當前輸入的類型名稱
const currentInputName = ref('')
// 存放當前輸入的類型代號
const currentInputType = ref('')
// 控制新增dialog視窗開關
const addTypeDialog = ref(false)
// 開啟新增dialog視窗
const openAddTypeDialog = () => {
  currentInputName.value = ''
  currentInputType.value = ''
  addTypeDialog.value = true
}
// 關閉新增dialog視窗
const closeAddTypeDialog = () => {
  addTypeDialog.value = false
  showToast('取消操作', 'error')
}
// 新增茶品類型
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
// 存放當前茶品類型當前的頁數
const drinkTypeCurrentPage = ref(1)
// 控制茶品類型當前頁數
const handleDrinkTypeCurrentChange = (page: number) => {
  drinkTypeCurrentPage.value = page
}
// 計算並切換當前頁面內容
const sliceDrinkType = computed(() => {
  return drinkStore.drinkType.slice((drinkTypeCurrentPage.value - 1) * 10, drinkTypeCurrentPage.value * 10)
})
const drinkTypePageCount = computed(() => Math.max(Math.ceil(drinkStore.drinkType.length / 10), 1))
// 刪除當前選擇的飲料類型
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
// 控制編輯dialog視窗開關
const editTypeDialog = ref(false)
// 存放當前編輯輸入的類型名稱
const currentEditInputName = ref('')
// 存放當前編輯輸入的類型代號
const currentEditInputType = ref('')
// 開啟編輯dialog視窗
const openEditTypeDialog = () => {
  if (currentType.value.name) {
    currentEditInputName.value = currentType.value.name
    currentEditInputType.value = currentType.value.type!
    editTypeDialog.value = true
  } else {
    void alert({ title: '通知', description: '請先選擇要編輯的類型', confirmText: '繼續選擇' })
  }
}
// 關閉編輯dialog視窗
const closeEditTypeDialog = () => {
  editTypeDialog.value = false
  showToast('取消操作', 'error')
}
// 編輯茶品類型
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

// 飲料品項相關功能
// 存放當前已選的飲料品項
const currentDrink = ref<MaybeSelected<DrinkListItem>>({})
// 控制新增飲料品項dialog視窗開關
const addDrinkDialog = ref(false)
// 打開新增飲料品項dialog視窗
const openAddDrinkDialog = () => {
  if (currentType.value.name) {
    setPriceL.value = true
    setPriceBottle.value = true
    currentDrinkInputName.value = ''
    currentDrinkInputPriceL.value = ''
    currentDrinkInputPriceBottle.value = ''
    currentDrinkSelectCustomized.value = ''
    addDrinkDialog.value = true
  } else {
    void alert({ title: '通知', description: '請先選擇要新增飲料品項的的飲品類型', confirmText: '繼續選擇' })
    return
  }
}
// 存放當前輸入的飲料品項名稱
const currentDrinkInputName = ref('')
// 存放當前輸入的飲料品項大杯價格
const currentDrinkInputPriceL = ref<FormNumeric | 'none'>('')
// 存放當前輸入的飲料品項瓶裝價格
const currentDrinkInputPriceBottle = ref<FormNumeric | 'none'>('')
// 存放當前客製化的選項
const currentDrinkSelectCustomized = ref<DrinkCustomized | ''>('')
// 客製化選項
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
// 判定當前客製化選項是否為none
const checkAddDrinkSelectCustomized = () => {
  if (currentDrinkSelectCustomized.value === 'none') {
    setPriceL.value = true
    setPriceBottle.value = false
    currentDrinkInputPriceBottle.value = 'none'
    showToast('容器僅限大杯,已關閉瓶裝價格輸入', 'error')
    return
  }
}
// 關閉新增飲料品項dialog視窗
const closeAddDrinkDialog = () => {
  addDrinkDialog.value = false
  showToast('取消操作', 'error')
}
// 是否可以使用大杯裝
const setPriceL = ref(true)
// 判定是否可以使用大杯裝
const checkPriceLSwitch = () => {
  if (setPriceL.value == false) {
    currentDrinkInputPriceL.value = 'none'
  }
}
// 是否可以使用瓶裝
const setPriceBottle = ref(true)
// 判定是否以使用瓶裝
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
// 新增飲料品項
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
    })
    currentType.value.drinkList!.push({
      id: created.id,
      name: created.name,
      priceL: fromApiPrice(created.priceL),
      priceBottle: fromApiPrice(created.priceBottle),
      customized: created.customized,
    })
    addDrinkDialog.value = false
    showToast('新增成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
// 刪除當前選擇的飲料品項
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
// 存放當前編輯輸入的飲料名稱
const currentEditDrinkInputName = ref('')
// 存放當前編輯輸入的大杯價格
const currentEditDrinkInputPriceL = ref<FormNumeric | 'none'>('')
// 存放當前編輯輸入的瓶裝價格
const currentEditDrinkInputPriceBottle = ref<FormNumeric | 'none'>('')
// 存放當前客製化的選項
const currentEditDrinkSelectCustomized = ref<DrinkCustomized | ''>('')
// 是否可以使用大杯裝
const setEditPriceL = ref(true)
// 判定是否可以使用大杯裝
const checkEditPriceLSwitch = () => {
  if (setEditPriceL.value == false) {
    currentEditDrinkInputPriceL.value = 'none'
  }
}
// 是否可以使用瓶裝
const setEditPriceBottle = ref(true)
// 判定是否以使用瓶裝
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
// 判定當前客製化選項是否為none
const checkEditDrinkSelectCustomized = () => {
  if (currentEditDrinkSelectCustomized.value === 'none') {
    setEditPriceL.value = true
    setEditPriceBottle.value = false
    currentEditDrinkInputPriceBottle.value = 'none'
    showToast('容器僅限大杯,已關閉瓶裝價格輸入', 'error')
    return
  }
}
// 控制編輯dialog視窗開關
const editDrinkDialog = ref(false)
// 關閉編輯dialog視窗
const closeEditDrinkDialog = () => {
  editDrinkDialog.value = false
  showToast('取消操作', 'error')
}
// 開啟編輯dialog視窗
const openEditDrinkDialog = () => {
  if (currentDrink.value != null && currentDrink.value.name) {
    currentEditDrinkInputName.value = currentDrink.value.name
    setEditPriceL.value = currentDrink.value.priceL == 'none' ? false : true
    setEditPriceBottle.value = currentDrink.value.priceBottle == 'none' ? false : true
    currentEditDrinkInputPriceL.value = currentDrink.value.priceL == 'none' ? 'none' : currentDrink.value.priceL!
    currentEditDrinkInputPriceBottle.value = currentDrink.value.priceBottle == 'none' ? 'none' : currentDrink.value.priceBottle!
    currentEditDrinkSelectCustomized.value = currentDrink.value.customized!
    editDrinkDialog.value = true
  } else {
    void alert({ title: '通知', description: '請先選擇要編輯的飲料品項', confirmText: '繼續選擇' })
  }
}

// 編輯飲料品項
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
  if (currentEditDrinkInputName.value == currentDrink.value.name && currentEditDrinkInputPriceL.value == currentDrink.value.priceL && currentEditDrinkInputPriceBottle.value == currentDrink.value.priceBottle && currentEditDrinkSelectCustomized.value == currentDrink.value.customized) {
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
    })
    currentDrink.value.name = updated.name
    currentDrink.value.priceL = fromApiPrice(updated.priceL)
    currentDrink.value.priceBottle = fromApiPrice(updated.priceBottle)
    currentDrink.value.customized = updated.customized
    editDrinkDialog.value = false
    showToast('保存成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
// 存放當前茶品類型當前的頁數
const drinkCurrentPage = ref(1)
// 控制茶品類型當前頁數
const handleDrinkCurrentChange = (page: number) => {
  drinkCurrentPage.value = page
}
// 計算並切換當前頁面內容
const sliceDrink = computed(() => {
  if (currentType.value.drinkList) {
    return currentType.value.drinkList.slice((drinkCurrentPage.value - 1) * 10, drinkCurrentPage.value * 10)
  } else {
    return []
  }
})
const drinkPageCount = computed(() => Math.max(Math.ceil((currentType.value.drinkList?.length ?? 0) / 10), 1))

// 配料的相關功能
// 存放當前所選的配料選項
const currentIngredientsDrink = ref<MaybeSelected<DrinkAddOnOption>>({})
// 控制新增配料dialog視窗開關
const addIngredientsDialog = ref(false)
// 打開新增配料dialog視窗
const openAddIngredientsDialog = () => {
  currentIngredientsInputName.value = ''
  currentIngredientsInputPrice.value = ''
  addIngredientsDialog.value = true
}
// 關閉新增配料dialog視窗
const closeAddIngredientsDialog = () => {
  addIngredientsDialog.value = false
  showToast('取消操作', 'error')
}
// 存放當前輸入的配料名稱
const currentIngredientsInputName = ref('')
// 存放當前輸入的配料價格
const currentIngredientsInputPrice = ref<FormNumeric>('')
// 新增配料
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
    const created = await createAddOnOption({ name: currentIngredientsInputName.value, price: Number(currentIngredientsInputPrice.value) })
    drinkStore.drinkAdd.push({ id: created.id, name: created.name, price: created.price })
    addIngredientsDialog.value = false
    showToast('新增成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
// 刪除配料
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
// 控制編輯dialog視窗開關
const editIngredientsDialog = ref(false)
// 關閉編輯dialog視窗
const closeEditIngredientsDialog = () => {
  editIngredientsDialog.value = false
  showToast('取消操作', 'error')
}
// 存放當前編輯輸入的配料名稱
const currentEditIngredientsInputName = ref('')
// 存放當前編輯輸入的配料價格
const currentEditIngredientsInputPrice = ref<FormNumeric>('')
// 開啟編輯dialog視窗
const openEditIngredientsDialog = () => {
  if (currentIngredientsDrink.value.name) {
    currentEditIngredientsInputName.value = currentIngredientsDrink.value.name
    currentEditIngredientsInputPrice.value = currentIngredientsDrink.value.price!
    editIngredientsDialog.value = true
  } else {
    void alert({ title: '通知', description: '請先選擇要編輯的配料', confirmText: '繼續選擇' })
  }
}
// 編輯配料
const editDrinkIngredients = async () => {
  if (currentEditIngredientsInputName.value === '' || currentEditIngredientsInputPrice.value === '') {
    showToast('請輸入完整資訊', 'error')
    return
  }
  if (currentEditIngredientsInputName.value == currentIngredientsDrink.value.name && currentEditIngredientsInputPrice.value == currentIngredientsDrink.value.price) {
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
    })
    currentIngredientsDrink.value.name = updated.name
    currentIngredientsDrink.value.price = updated.price
    editIngredientsDialog.value = false
    showToast('保存成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
// 存放當前茶品類型當前的頁數
const drinkIngredientsCurrentPage = ref(1)
// 控制茶品類型當前頁數
const handleIngredientsCurrentChange = (page: number) => {
  drinkIngredientsCurrentPage.value = page
}
// 計算並切換當前頁面內容
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