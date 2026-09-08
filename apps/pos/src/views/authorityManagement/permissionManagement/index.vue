<template>
  <div class="w-full flex flex-col xl:flex-row divide-y xl:divide-y-0 xl:divide-x divide-surface-200 dark:divide-surface-800 min-h-[640px]">
    <!-- 人員名單 -->
    <div class="xl:w-[68%] 2xl:w-[70%] p-5 flex flex-col justify-between overflow-hidden">
      <div>
        <div class="flex items-center justify-between pb-3.5 border-b border-surface-200 dark:border-surface-800">
          <div class="flex items-center gap-2.5">
            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-400 border border-primary-200/50 dark:border-primary-800/40">
              <UserCheck class="h-4 w-4" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-surface-900 dark:text-surface-100 tracking-tight">人員名單</h3>
              <p class="text-[11px] text-surface-400">門市各崗位人員與 18 項系統操作權限明細</p>
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            <!-- 新增功能 -->
            <button
              type="button"
              class="pos-btn pos-btn-secondary px-3 py-1.5 text-xs font-bold"
              :class="{ 'opacity-40 pointer-events-none': !hasCapability(loginStore.userInfo, 'canSetAuthority') }"
              @click="openAddStaffDialog">新增</button>
            <!-- 刪除功能 -->
            <button
              type="button"
              class="pos-btn bg-danger-50 text-danger-600 border border-danger-200/80 hover:bg-danger-100 dark:bg-danger-950/40 dark:text-danger-400 dark:border-danger-800 px-3 py-1.5 text-xs font-bold"
              :class="{ 'opacity-40 pointer-events-none': !hasCapability(loginStore.userInfo, 'canSetAuthority') }"
              @click="deleteStaff">刪除</button>
            <!-- 編輯功能 -->
            <button
              type="button"
              class="pos-btn pos-btn-primary px-3 py-1.5 text-xs font-bold"
              :class="{ 'opacity-40 pointer-events-none': !hasCapability(loginStore.userInfo, 'canSetAuthority') }"
              @click="openEditStaffDialog">編輯</button>
          </div>
        </div>

        <div class="mt-4 overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-800">
          <table class="w-full text-center text-xs whitespace-nowrap">
            <thead class="bg-surface-50 dark:bg-surface-800/80 font-bold text-surface-500 dark:text-surface-400 border-b border-surface-200 dark:border-surface-800">
              <tr>
                <th class="px-3 py-2.5 text-left">人員名稱</th>
                <th class="px-3 py-2.5">Id</th>
                <th class="px-3 py-2.5">職稱</th>
                <th class="px-3 py-2.5">帳號</th>
                <th v-for="field in authorityFields" :key="field.value" class="whitespace-nowrap px-2.5 py-2.5 font-medium">{{ field.label }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
              <tr v-if="sliceStaffList.length === 0">
                <td :colspan="4 + authorityFields.length" class="px-3 py-8 text-surface-400 dark:text-surface-500">人員名單是空的</td>
              </tr>
              <tr
                v-for="row in sliceStaffList" :key="row.id"
                class="cursor-pointer transition-colors hover:bg-surface-50 dark:hover:bg-surface-950"
                :class="{ 'bg-primary-50/90 dark:bg-primary-950/40 font-bold': currentStaff.id === row.id }"
                @click="currentStaff = row">
                <td class="px-3 py-2.5 text-left font-bold text-surface-900 dark:text-surface-100">{{ row.name }}</td>
                <td class="px-3 py-2.5 font-mono text-xs text-surface-400 truncate max-w-[80px]" :title="String(row.id)">{{ row.id }}</td>
                <td class="px-3 py-2.5">
                  <span
                    class="rounded-lg px-2 py-0.5 text-[11px] font-bold"
                    :class="row.jobTitle === '店長' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800' : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300'">
                    {{ row.jobTitle }}
                  </span>
                </td>
                <td class="px-3 py-2.5 font-mono text-surface-500">{{ row.account }}</td>
                <td v-for="field in authorityFields" :key="field.value" class="px-2 py-2">
                  <span
                    class="inline-flex h-6 w-6 items-center justify-center rounded-lg text-xs font-black"
                    :class="row.authorityCheckList.includes(field.value) ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40' : 'bg-surface-100 text-surface-400 dark:bg-surface-800 dark:text-surface-600'">
                    {{ row.authorityCheckList.includes(field.value) ? 'O' : 'X' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="mt-4 flex items-center justify-between rounded-xl bg-surface-50 dark:bg-surface-800/60 px-3 py-2 text-xs font-bold text-surface-600 dark:text-surface-300">
        <p>{{ `共 ${authorityManagementStore.staffList.length} 樣` }}</p>
        <div class="flex items-center gap-1.5">
          <button type="button" class="flex h-7 w-7 items-center justify-center rounded-lg border border-surface-300 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-30" :disabled="staffCurrentPage <= 1" @click="handleStaffCurrentChange(staffCurrentPage - 1)">
            <ChevronLeft class="h-3.5 w-3.5" />
          </button>
          <span class="px-1 font-mono text-[11px]">{{ authorityManagementStore.staffList.length > 0 ? staffCurrentPage : 0 }} / {{ staffPageCount }}</span>
          <button type="button" class="flex h-7 w-7 items-center justify-center rounded-lg border border-surface-300 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-30" :disabled="staffCurrentPage >= staffPageCount" @click="handleStaffCurrentChange(staffCurrentPage + 1)">
            <ChevronRight class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- 付款方式 -->
    <div class="xl:w-[32%] 2xl:w-[30%] p-5 flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between pb-3.5 border-b border-surface-200 dark:border-surface-800">
          <div class="flex items-center gap-2.5">
            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40">
              <CreditCard class="h-4 w-4" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-surface-900 dark:text-surface-100 tracking-tight">付款方式</h3>
              <p class="text-[11px] text-surface-400">收銀結帳通道管理</p>
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            <!-- 新增功能 -->
            <button
              type="button"
              class="pos-btn pos-btn-secondary px-3 py-1.5 text-xs font-bold"
              :class="{ 'opacity-40 pointer-events-none': !hasCapability(loginStore.userInfo, 'canSetPayMethod') }"
              @click="openAddPayMethodDialog">新增</button>
            <!-- 刪除功能 -->
            <button
              type="button"
              class="pos-btn bg-danger-50 text-danger-600 border border-danger-200/80 hover:bg-danger-100 dark:bg-danger-950/40 dark:text-danger-400 dark:border-danger-800 px-3 py-1.5 text-xs font-bold"
              :class="{ 'opacity-40 pointer-events-none': !hasCapability(loginStore.userInfo, 'canSetPayMethod') }"
              @click="deletePayMethod">刪除</button>
            <!-- 編輯功能 -->
            <button
              type="button"
              class="pos-btn pos-btn-primary px-3 py-1.5 text-xs font-bold"
              :class="{ 'opacity-40 pointer-events-none': !hasCapability(loginStore.userInfo, 'canSetPayMethod') }"
              @click="openEditPayMethodDialog">編輯</button>
          </div>
        </div>

        <div class="mt-4 overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-800">
          <table class="w-full text-center text-xs">
            <thead class="bg-surface-50 dark:bg-surface-800/80 font-bold text-surface-500 dark:text-surface-400 border-b border-surface-200 dark:border-surface-800">
              <tr>
                <th class="px-3 py-2.5">序號</th>
                <th class="px-3 py-2.5">Id</th>
                <th class="px-3 py-2.5 text-left">付款方式</th>
                <th class="px-3 py-2.5">支付方式</th>
                <th class="px-3 py-2.5">使用</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
              <tr v-if="slicePayMethodList.length === 0">
                <td colspan="5" class="px-3 py-8 text-surface-400 dark:text-surface-500">沒有付款方式</td>
              </tr>
              <tr
                v-for="(row, index) in slicePayMethodList" :key="row.id"
                class="cursor-pointer transition-colors hover:bg-surface-50 dark:hover:bg-surface-950"
                :class="{ 'bg-primary-50/90 dark:bg-primary-950/40 font-bold': currentPayMethod.id === row.id }"
                @click="currentPayMethod = row">
                <td class="px-3 py-2.5 font-mono text-surface-400">{{ index + 1 }}</td>
                <td class="px-3 py-2.5 font-mono text-xs text-surface-400 truncate max-w-[80px]" :title="String(row.id)">{{ row.id }}</td>
                <td class="px-3 py-2.5 text-left font-bold text-surface-900 dark:text-surface-100">{{ row.name }}</td>
                <td class="px-3 py-2.5">
                  <span class="rounded-md bg-surface-100 dark:bg-surface-800 px-2 py-0.5 text-[11px] font-mono font-medium text-surface-600 dark:text-surface-300">
                    {{ row.useMethod }}
                  </span>
                </td>
                <td class="px-3 py-2.5">
                  <span
                    class="rounded-full px-2 py-0.5 text-[10px] font-bold"
                    :class="row.disabled == false ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-surface-100 text-surface-400 dark:bg-surface-800 dark:text-surface-500'">
                    {{ row.disabled == false ? '是' : '否' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="mt-4 flex items-center justify-between rounded-xl bg-surface-50 dark:bg-surface-800/60 px-3 py-2 text-xs font-bold text-surface-600 dark:text-surface-300">
        <p>{{ `共 ${orderStore.paymentList.length} 樣` }}</p>
        <div class="flex items-center gap-1.5">
          <button type="button" class="flex h-7 w-7 items-center justify-center rounded-lg border border-surface-300 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-30" :disabled="payMethodCurrentPage <= 1" @click="handlePayMethodCurrentChange(payMethodCurrentPage - 1)">
            <ChevronLeft class="h-3.5 w-3.5" />
          </button>
          <span class="px-1 font-mono text-[11px]">{{ orderStore.paymentList.length > 0 ? payMethodCurrentPage : 0 }} / {{ payMethodPageCount }}</span>
          <button type="button" class="flex h-7 w-7 items-center justify-center rounded-lg border border-surface-300 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-30" :disabled="payMethodCurrentPage >= payMethodPageCount" @click="handlePayMethodCurrentChange(payMethodCurrentPage + 1)">
            <ChevronRight class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 新增人員 -->
  <ModalDialog v-model:open="addStaffDialog" title="新增人員">
    <div class="space-y-3.5 py-1">
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1">人員的名稱</label>
          <input
            v-model="currentInputStaffName"
            class="w-full rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-xs font-bold text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            placeholder="例如: Jensen、Jacky..." />
        </div>
        <div>
          <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1">人員的職稱</label>
          <input
            v-model="currentInputStaffJobTitle"
            class="w-full rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-xs font-bold text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            placeholder="例如: 襄理、工讀生..." />
        </div>
        <div>
          <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1">人員的帳號</label>
          <input
            v-model="currentInputStaffAccount"
            class="w-full rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-xs font-bold text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            placeholder="請輸入帳號" />
        </div>
        <div>
          <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1">登入用PIN</label>
          <input
            v-model="currentInputStaffPin" type="password" inputmode="numeric" maxlength="6"
            class="w-full rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-xs font-bold text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            placeholder="4~6碼數字" />
        </div>
      </div>

      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="text-xs font-bold text-surface-700 dark:text-surface-300">權限管理</label>
          <span class="text-[11px] text-surface-400">依門市職責勾選授權</span>
        </div>
        <div class="max-h-56 overflow-y-auto rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/40 p-2.5 grid grid-cols-2 gap-1.5">
          <label
            v-for="field in authorityFields" :key="field.value"
            class="flex items-center gap-2 rounded-lg p-1.5 text-xs font-medium cursor-pointer transition-colors hover:bg-white dark:hover:bg-surface-700"
            :class="{ 'opacity-40 cursor-not-allowed': !!field.dependsOn && !authorityCheckList.includes(field.dependsOn) }">
            <input
              type="checkbox" :checked="authorityCheckList.includes(field.value)"
              :disabled="!!field.dependsOn && !authorityCheckList.includes(field.dependsOn)"
              class="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500/20"
              @change="toggleAuthorityCheck(authorityCheckList, field.value, ($event.target as HTMLInputElement).checked, (v) => authorityCheckList = v)">
            <span class="text-surface-800 dark:text-surface-200">{{ field.label }}</span>
          </label>
        </div>
      </div>
    </div>
    <div class="mt-5 flex justify-end gap-2.5">
      <button type="button" class="pos-btn pos-btn-secondary px-4 py-2 text-xs font-bold" @click="closeAddStaffDialog">取消</button>
      <button type="button" class="pos-btn pos-btn-primary px-5 py-2 text-xs font-bold" @click="addStaff">新增</button>
    </div>
  </ModalDialog>

  <!-- 編輯人員 -->
  <ModalDialog v-model:open="editStaffDialog" title="編輯人員">
    <div class="space-y-3.5 py-1">
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1">人員的名稱</label>
          <input
            v-model="currentEditInputStaffName"
            class="w-full rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-xs font-bold text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            placeholder="例如: Jensen、Jacky..." />
        </div>
        <div>
          <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1">人員的職稱</label>
          <input
            v-model="currentEditInputStaffJobTitle"
            class="w-full rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-xs font-bold text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            placeholder="例如: 襄理、工讀生..." />
        </div>
        <div>
          <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1">人員的帳號</label>
          <input
            v-model="currentEditInputStaffAccount"
            class="w-full rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-xs font-bold text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            placeholder="請輸入帳號" />
        </div>
        <div>
          <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1">登入用PIN</label>
          <input
            v-model="currentEditInputStaffPin" type="password" inputmode="numeric" maxlength="6"
            class="w-full rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-xs font-bold text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            placeholder="留空則不變更" />
        </div>
      </div>

      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="text-xs font-bold text-surface-700 dark:text-surface-300">權限管理</label>
          <span class="text-[11px] text-surface-400">依門市職責勾選授權</span>
        </div>
        <div class="max-h-56 overflow-y-auto rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/40 p-2.5 grid grid-cols-2 gap-1.5">
          <label
            v-for="field in authorityFields" :key="field.value"
            class="flex items-center gap-2 rounded-lg p-1.5 text-xs font-medium cursor-pointer transition-colors hover:bg-white dark:hover:bg-surface-700"
            :class="{ 'opacity-40 cursor-not-allowed': !!field.dependsOn && !editAuthorityCheckList.includes(field.dependsOn) }">
            <input
              type="checkbox" :checked="editAuthorityCheckList.includes(field.value)"
              :disabled="!!field.dependsOn && !editAuthorityCheckList.includes(field.dependsOn)"
              class="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500/20"
              @change="toggleAuthorityCheck(editAuthorityCheckList, field.value, ($event.target as HTMLInputElement).checked, (v) => editAuthorityCheckList = v)">
            <span class="text-surface-800 dark:text-surface-200">{{ field.label }}</span>
          </label>
        </div>
      </div>
    </div>
    <div class="mt-5 flex justify-end gap-2.5">
      <button type="button" class="pos-btn pos-btn-secondary px-4 py-2 text-xs font-bold" @click="closeEditStaffDialog">取消</button>
      <button type="button" class="pos-btn pos-btn-primary px-5 py-2 text-xs font-bold" @click="editStaff">保存</button>
    </div>
  </ModalDialog>

  <!-- 新增付款方式 -->
  <ModalDialog v-model:open="addPayMethodDialog" title="新增付款方式">
    <div class="space-y-4 py-1">
      <div>
        <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1">付款方式的名稱</label>
        <input
          v-model="currentInputPayMethodName"
          class="w-full rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-xs font-bold text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          placeholder="例如: 現金、LinePay..." />
      </div>
      <div>
        <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1">支付方式</label>
        <SelectRoot v-model="currentSelectPayMethod">
          <SelectTrigger class="flex w-full items-center justify-between rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-xs font-bold text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500">
            <SelectValue placeholder="選擇支付方式" />
            <span aria-hidden="true" class="text-surface-400">▾</span>
          </SelectTrigger>
          <SelectPortal>
            <SelectContent class="z-50 min-w-[200px] rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-1 shadow-lg" position="popper">
              <SelectViewport class="p-1">
                <SelectItem
                  v-for="item in payMethodOptions" :key="item.value" :value="item.value"
                  class="cursor-pointer rounded-lg px-3 py-2 text-xs font-bold text-surface-700 dark:text-surface-300 outline-none hover:bg-surface-100 dark:hover:bg-surface-800 data-[state=checked]:bg-primary-50 data-[state=checked]:text-primary-600 dark:data-[state=checked]:bg-primary-950/40 dark:data-[state=checked]:text-primary-400">
                  <SelectItemText>{{ item.label }}</SelectItemText>
                </SelectItem>
              </SelectViewport>
            </SelectContent>
          </SelectPortal>
        </SelectRoot>
      </div>
      <div class="flex items-center justify-between rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/40 p-3">
        <div>
          <label class="block text-xs font-bold text-surface-900 dark:text-surface-100">是否啟用</label>
          <span class="text-[11px] text-surface-400">啟用後將於結帳收銀面板中顯示</span>
        </div>
        <SwitchRoot v-model="isUsePayMethod" class="relative h-6 w-11 rounded-full bg-surface-300 dark:bg-surface-700 data-[state=checked]:bg-primary-500">
          <SwitchThumb class="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
        </SwitchRoot>
      </div>
    </div>
    <div class="mt-5 flex justify-end gap-2.5">
      <button type="button" class="pos-btn pos-btn-secondary px-4 py-2 text-xs font-bold" @click="closeAddPayMethodDialog">取消</button>
      <button type="button" class="pos-btn pos-btn-primary px-5 py-2 text-xs font-bold" @click="addPayMethod">新增</button>
    </div>
  </ModalDialog>

  <!-- 編輯付款方式 -->
  <ModalDialog v-model:open="editPayMethodDialog" title="編輯付款方式">
    <div class="space-y-4 py-1">
      <div>
        <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1">付款方式的名稱</label>
        <input
          v-model="currentEditInputPayMethodName"
          class="w-full rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-xs font-bold text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          placeholder="例如: 現金、LinePay..." />
      </div>
      <div>
        <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1">支付方式</label>
        <SelectRoot v-model="currentSelectEditPayMethod">
          <SelectTrigger class="flex w-full items-center justify-between rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-xs font-bold text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500">
            <SelectValue placeholder="選擇支付方式" />
            <span aria-hidden="true" class="text-surface-400">▾</span>
          </SelectTrigger>
          <SelectPortal>
            <SelectContent class="z-50 min-w-[200px] rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-1 shadow-lg" position="popper">
              <SelectViewport class="p-1">
                <SelectItem
                  v-for="item in payMethodOptions" :key="item.value" :value="item.value"
                  class="cursor-pointer rounded-lg px-3 py-2 text-xs font-bold text-surface-700 dark:text-surface-300 outline-none hover:bg-surface-100 dark:hover:bg-surface-800 data-[state=checked]:bg-primary-50 data-[state=checked]:text-primary-600 dark:data-[state=checked]:bg-primary-950/40 dark:data-[state=checked]:text-primary-400">
                  <SelectItemText>{{ item.label }}</SelectItemText>
                </SelectItem>
              </SelectViewport>
            </SelectContent>
          </SelectPortal>
        </SelectRoot>
      </div>
      <div class="flex items-center justify-between rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/40 p-3">
        <div>
          <label class="block text-xs font-bold text-surface-900 dark:text-surface-100">是否啟用</label>
          <span class="text-[11px] text-surface-400">啟用後將於結帳收銀面板中顯示</span>
        </div>
        <SwitchRoot v-model="isUseEditPayMethod" class="relative h-6 w-11 rounded-full bg-surface-300 dark:bg-surface-700 data-[state=checked]:bg-primary-500">
          <SwitchThumb class="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
        </SwitchRoot>
      </div>
    </div>
    <div class="mt-5 flex justify-end gap-2.5">
      <button type="button" class="pos-btn pos-btn-secondary px-4 py-2 text-xs font-bold" @click="closeEditPayMethodDialog">取消</button>
      <button type="button" class="pos-btn pos-btn-primary px-5 py-2 text-xs font-bold" @click="editPayMethod">保存</button>
    </div>
  </ModalDialog>
</template>

<script setup lang="ts">
// P4：這個頁面顯示／編輯的「密碼」欄位是純本機狀態，跟登入（views/
// login/index.vue 改用伺服端 PIN 驗證）已經沒有關聯，見 stores/
// authorityManagement.ts 開頭的說明。
//
// P8：組件庫替換，跟 backgroundSetting/productManagement/index.vue
// 一樣的範圍決定——ElMessage／ElMessageBox 改用 showToast／confirm／
// alert，驗證邏輯維持原本的 if/else，不改成 VeeValidate + Zod。
//
// P18（規劃書 §10 P18「菜單與權限管理接上伺服端」）：人員名單、付款
// 方式的新增／編輯／刪除改成真的呼叫 apps/api 的寫入端點（見
// api/staff.ts、api/payment-methods.ts），不再只是本機陣列操作。Id
// 因此不再是這裡手動輸入的欄位，新增時由伺服端配發；原本「人員的
// 密碼」欄位本來就是純展示假資料（見 stores/authorityManagement.ts
// 的說明），現在換成真正會送進伺服端、用來登入的 PIN 欄位。原本用
// `id === 1` / `id === 1` 判斷「這是店長／這是現金支付，不可刪改」的
// 寫法，改成用業務含意本身（職稱是店長／名稱是現金）判斷——伺服端的
// id 是 UUID，不會再有「第一筆一定是 1」這件事。
import { ref, computed } from 'vue'
import { UserCheck, CreditCard, ChevronLeft, ChevronRight } from 'lucide-vue-next'
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
import { useAuthorityManagementStore } from '@/stores/authorityManagement'
const authorityManagementStore = useAuthorityManagementStore()
import { useOrderStore } from '@/stores/order'
const orderStore = useOrderStore()
import { useLoginStore } from '@/stores/login';
const loginStore = useLoginStore()
import type { AuthorityKey, MaybeSelected, PaymentMethod, PaymentUseMethod, StaffMember } from '@/types'
import { fromSelection, hasCapability } from '@/utils/selection'
import { ApiError } from '@/api/http'
import { toStaffMember } from '@/api/auth'
import {
  createStaff as createStaffApi,
  deleteStaff as deleteStaffApi,
  updateStaff as updateStaffApi,
} from '@/api/staff'
import {
  createPaymentMethod,
  deletePaymentMethod,
  updatePaymentMethod,
} from '@/api/payment-methods'

function apiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 409) return '操作失敗：帳號或名稱已被使用'
    return `操作失敗：${err.message}`
  }
  return '連不上伺服端，請確認網路連線'
}
const PIN_PATTERN = /^\d{4,6}$/

// 人員名單、付款方式清單都在 App.vue 啟動時同步一次（見
// stores/authorityManagement.ts 的 staffSource、stores/order.ts 的
// paymentSource 說明），這裡不再另外掛載時整包覆蓋——這個頁面本身的
// 新增／編輯／刪除已經會用伺服端回應直接更新對應的本機陣列，不需要
// 也不應該再有第二個地方決定這兩份清單長怎樣（曾經在這裡掛載時整包
// 重新 fetch 覆蓋，結果使用者剛送出新增表單，畫面上的新資料就被稍後
// 才 resolve 的舊 fetch 蓋掉，見 authorityManagement.ts 的完整說明）。

// 人員名單相關的功能
// 存放當前選擇的人員
const currentStaff = ref<MaybeSelected<StaffMember>>({})
// 控制新增人員Dialog
const addStaffDialog = ref(false)
// 開啟新增人員Dialog
const openAddStaffDialog = () => {
  currentInputStaffName.value = ''
  currentInputStaffJobTitle.value = ''
  currentInputStaffAccount.value = ''
  currentInputStaffPin.value = ''
  authorityCheckList.value = []
  addStaffDialog.value = true
}
// 關閉新增人員Dialog
const closeAddStaffDialog = () => {
  addStaffDialog.value = false
  showToast('操作取消', 'error')
}
// 定義當前新增人員的名稱
const currentInputStaffName = ref('')
// 定義當前新增人員的職稱
const currentInputStaffJobTitle = ref('')
// 定義當前新增人員的帳號
const currentInputStaffAccount = ref('')
// 定義當前新增人員的登入用 PIN
const currentInputStaffPin = ref('')
// 定義權限管理清單
const authorityCheckList = ref<AuthorityKey[]>([])
// 定義編輯人員的權限管理清單
const editAuthorityCheckList = ref<AuthorityKey[]>([])

// 權限欄位清單——資料驅動表格欄位跟兩個表單的 checkbox 群組，取代原本
// 新增／編輯各自重複 16 個幾乎一樣的 el-checkbox，以及 el-table 裡 16
// 個幾乎一樣的 el-table-column（見上方 template 的說明）。dependsOn
// 表示這個權限依附在另一個權限之下：母權限沒勾選時這個選項要停用。
interface AuthorityField {
  label: string
  value: AuthorityKey
  dependsOn?: AuthorityKey
}
const authorityFields: AuthorityField[] = [
  { label: '免費招待', value: 'canFreeDrink' },
  { label: '開收銀機', value: 'canOpenCashier' },
  { label: '查看訂單', value: 'canCheckOrder' },
  { label: '編輯訂單狀態', value: 'canEditOrderStatus', dependsOn: 'canCheckOrder' },
  { label: '刪除訂單', value: 'canDeleteOrder', dependsOn: 'canCheckOrder' },
  { label: '查看後台設定', value: 'canCheckBackgroundSetting' },
  { label: '設定飲品類型', value: 'canSetDrinkType', dependsOn: 'canCheckBackgroundSetting' },
  { label: '設定飲料品項', value: 'canSetDrink', dependsOn: 'canCheckBackgroundSetting' },
  { label: '設定配料', value: 'canSetIngredients', dependsOn: 'canCheckBackgroundSetting' },
  { label: '設定現金折扣券', value: 'canSetMoneyDiscount', dependsOn: 'canCheckBackgroundSetting' },
  { label: '設定折數折扣券', value: 'canSetPercentDiscount', dependsOn: 'canCheckBackgroundSetting' },
  { label: '設定常用優惠', value: 'canSetOftenUseDiscount', dependsOn: 'canCheckBackgroundSetting' },
  { label: '查看數據分析', value: 'canCheckDataAnalysis' },
  { label: '查看權限管理', value: 'canCheckAuthority' },
  { label: '設定人員名單', value: 'canSetAuthority', dependsOn: 'canCheckAuthority' },
  { label: '設定付款方式', value: 'canSetPayMethod', dependsOn: 'canCheckAuthority' },
  { label: '查看會員管理', value: 'canCheckMembers' },
  { label: '查看桌況管理', value: 'canManageTables' },
]
// 母權限被取消勾選時，連帶取消勾選依附在它底下的子權限。
function cascadeAuthorityCheckList(list: AuthorityKey[]): AuthorityKey[] {
  let next = list
  for (const parent of ['canCheckOrder', 'canCheckBackgroundSetting', 'canCheckAuthority'] as const) {
    if (!next.includes(parent)) {
      const dependents = authorityFields.filter((field) => field.dependsOn === parent).map((field) => field.value)
      next = next.filter((item) => !dependents.includes(item))
    }
  }
  return next
}
// 切換單一權限的勾選狀態，並套用上面的連帶取消規則。set 是對應表單那份
// authorityCheckList／editAuthorityCheckList 的賦值函式（見 template）。
function toggleAuthorityCheck(
  current: AuthorityKey[],
  key: AuthorityKey,
  checked: boolean,
  set: (value: AuthorityKey[]) => void,
) {
  const next = checked ? [...current, key] : current.filter((item) => item !== key)
  set(cascadeAuthorityCheckList(next))
}

// 新增人員
const addStaff = async () => {
  if (currentInputStaffName.value == '' || currentInputStaffJobTitle.value == '' || currentInputStaffAccount.value == '' || currentInputStaffPin.value == '') {
    showToast('請輸入完整資訊', 'error')
    return
  }
  if (!PIN_PATTERN.test(currentInputStaffPin.value)) {
    showToast('PIN 必須是 4 到 6 碼數字,請重新輸入', 'error')
    return
  }
  if (authorityManagementStore.staffList.find((item) => item.account == currentInputStaffAccount.value)) {
    showToast('此帳號已存在,請重新輸入', 'error')
    return
  }
  try {
    const created = await createStaffApi({
      name: currentInputStaffName.value,
      jobTitle: currentInputStaffJobTitle.value,
      account: currentInputStaffAccount.value,
      capabilities: authorityCheckList.value,
      pin: currentInputStaffPin.value,
    })
    // 用陣列重建取代 .push()，跟 addPayMethod 是同樣的原因（見那裡的
    // 說明）——這個陣列同時被 App.vue 的 useQuery watch 盯著，保險起見
    // 一律用重建而不是原地修改陣列的方法。
    authorityManagementStore.staffList = [...authorityManagementStore.staffList, toStaffMember(created)]
    // App.vue 啟動時同步一次的 fetch 可能還沒 resolve 就先做了這次
    // 新增——見 stores/authorityManagement.ts 的 staffSource 說明，這裡
    // 標記「本機已經有異動」，稍後那個較舊的 fetch 結果 resolve 時
    // 才不會蓋掉剛新增的這筆資料。
    authorityManagementStore.staffSource = 'server'
    showToast('新增人員成功', 'success')
    addStaffDialog.value = false
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
// 刪除人員
const deleteStaff = async () => {
  if (currentStaff.value.jobTitle === '店長') {
    showToast('不可刪除店長', 'error')
    return
  }
  if (currentStaff.value.account === fromSelection(loginStore.userInfo)?.account) {
    showToast('不可刪除自己', 'error')
    return
  }
  if (!currentStaff.value.name) {
    void alert({ title: '通知', description: '請先選擇要刪除的人員', confirmText: '繼續選擇' })
    return
  }
  const result = await confirm({ title: '警告', description: `是否刪除人員 ${currentStaff.value.name} ?` })
  if (result !== 'confirm') return
  try {
    await deleteStaffApi(String(currentStaff.value.id))
    authorityManagementStore.staffList = authorityManagementStore.staffList.filter((item) => item.id !== currentStaff.value.id)
    authorityManagementStore.staffSource = 'server'
    currentStaff.value = {}
    showToast('刪除成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
// 控制編輯人員Dialog
const editStaffDialog = ref(false)
// 定義當前編輯人員的名稱
const currentEditInputStaffName = ref('')
// 定義當前編輯人員的職稱
const currentEditInputStaffJobTitle = ref('')
// 定義當前編輯人員的帳號
const currentEditInputStaffAccount = ref('')
// 定義當前編輯人員的登入用 PIN（留空代表不變更，見 api/staff.ts 的
// updateStaff 說明）
const currentEditInputStaffPin = ref('')
// 開啟控制編輯人員Dialog人員Dialog
const openEditStaffDialog = () => {
  if (currentStaff.value.jobTitle === '店長') {
    showToast('不可編輯店長', 'error')
    return
  }
  if (currentStaff.value.account === fromSelection(loginStore.userInfo)?.account) {
    showToast('不可編輯自己', 'error')
    return
  }
  if (currentStaff.value.name) {
    currentEditInputStaffName.value = currentStaff.value.name
    currentEditInputStaffJobTitle.value = currentStaff.value.jobTitle!
    currentEditInputStaffAccount.value = currentStaff.value.account!
    currentEditInputStaffPin.value = ''
    editAuthorityCheckList.value = currentStaff.value.authorityCheckList!
    editStaffDialog.value = true
  } else {
    void alert({ title: '通知', description: '請先選擇要編輯的人員', confirmText: '繼續選擇' })
  }
}
// 關閉編輯人員Dialog
const closeEditStaffDialog = () => {
  editStaffDialog.value = false
  showToast('操作取消', 'error')
}
// 儲存編輯
const editStaff = async () => {
  if (currentEditInputStaffName.value == '' || currentEditInputStaffJobTitle.value == '' || currentEditInputStaffAccount.value == '') {
    showToast('請輸入完整資訊', 'error')
    return
  }
  if (currentEditInputStaffPin.value !== '' && !PIN_PATTERN.test(currentEditInputStaffPin.value)) {
    showToast('PIN 必須是 4 到 6 碼數字,請重新輸入', 'error')
    return
  }
  const authorityUnchanged = editAuthorityCheckList.value.length === currentStaff.value.authorityCheckList!.length
    && editAuthorityCheckList.value.every((key) => currentStaff.value.authorityCheckList!.includes(key))
  if (currentEditInputStaffName.value == currentStaff.value.name && currentEditInputStaffJobTitle.value == currentStaff.value.jobTitle && currentEditInputStaffAccount.value == currentStaff.value.account && currentEditInputStaffPin.value === '' && authorityUnchanged) {
    editStaffDialog.value = false
    showToast('保存成功', 'success')
    return
  }
  const anotherAccount = authorityManagementStore.staffList.filter(item => item.id != currentStaff.value.id)
  if (anotherAccount.some(item => item.account == currentEditInputStaffAccount.value)) {
    showToast('此帳號已存在,請重新輸入', 'error')
    return
  }
  try {
    const updated = await updateStaffApi(String(currentStaff.value.id), {
      name: currentEditInputStaffName.value,
      jobTitle: currentEditInputStaffJobTitle.value,
      account: currentEditInputStaffAccount.value,
      capabilities: editAuthorityCheckList.value,
      ...(currentEditInputStaffPin.value !== '' ? { pin: currentEditInputStaffPin.value } : {}),
    })
    const mapped = toStaffMember(updated)
    currentStaff.value.name = mapped.name
    currentStaff.value.jobTitle = mapped.jobTitle
    currentStaff.value.account = mapped.account
    currentStaff.value.authorityCheckList = mapped.authorityCheckList
    authorityManagementStore.staffSource = 'server'
    editStaffDialog.value = false
    showToast('保存成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
// 分頁器
// 定義當前的頁數
const staffCurrentPage = ref(1)
// 切換頁數
const handleStaffCurrentChange = (page: number) => {
  staffCurrentPage.value = page
}
// 計算當前頁數並切換顯示內容
const sliceStaffList = computed(() => {
  return authorityManagementStore.staffList.slice((staffCurrentPage.value - 1) * 10, staffCurrentPage.value * 10)
})
const staffPageCount = computed(() => Math.max(Math.ceil(authorityManagementStore.staffList.length / 10), 1))

// 付款方式相關的功能
// 存放當前選擇的付款方式
const currentPayMethod = ref<MaybeSelected<PaymentMethod>>({})
// 控制新增付款方式Dialog
const addPayMethodDialog = ref(false)
// 開啟新增付款方式Dialog
const openAddPayMethodDialog = () => {
  currentInputPayMethodName.value = ''
  currentSelectPayMethod.value = ''
  isUsePayMethod.value = true
  addPayMethodDialog.value = true
}
// 關閉新增付款方式Dialog
const closeAddPayMethodDialog = () => {
  addPayMethodDialog.value = false
  showToast('操作取消', 'error')
}
// 定義當前新增付款方式的名稱
const currentInputPayMethodName = ref('')
// 定義當前選擇付款方式
const currentSelectPayMethod = ref<PaymentUseMethod | ''>('')
// 定義付款方式
const payMethodOptions = ref([{
  value: '紙鈔',
  label: '紙鈔',
},
{
  value: '感應',
  label: '感應',
},
{
  value: '掃描',
  label: '掃描',
}])
// 定義當前是否啟用付款方式
const isUsePayMethod = ref(true)
// 新增付款方式
const addPayMethod = async () => {
  if (currentInputPayMethodName.value == '' || currentSelectPayMethod.value == '') {
    showToast('請輸入完整資訊', 'error')
    return
  }
  if (orderStore.paymentList.find((item) => item.name == currentInputPayMethodName.value)) {
    showToast('此付款方式已存在,請重新輸入', 'error')
    return
  }
  try {
    const created = await createPaymentMethod({
      name: currentInputPayMethodName.value,
      disabled: !isUsePayMethod.value,
      useMethod: currentSelectPayMethod.value as PaymentUseMethod,
    })
    // 這裡用陣列重建（spread）取代 .push()：orderStore.paymentList 同時被
    // App.vue 的 useQuery watch（付款方式同步）盯著，實際測試中發現對
    // 這個陣列呼叫 .push() 之後，陣列的 reactive 依賴沒有正確觸發、
    // 畫面沒有反映新增的項目（.push() 回傳的新長度是對的，但重新讀取
    // 陣列內容看不到新項目），改成整個陣列重建就正常了，跟下面
    // deletePayMethod 的 filter 重建是同一種寫法，行為更可預期。
    orderStore.paymentList = [...orderStore.paymentList, created]
    // App.vue 啟動時同步一次的 fetch 可能還沒 resolve 就先做了這次
    // 新增——見 stores/order.ts 的 paymentSource 說明，這裡標記「本機
    // 已經有異動」，稍後那個較舊的 fetch 結果 resolve 時才不會蓋掉
    // 剛新增的這筆資料。
    orderStore.paymentSource = 'server'
    showToast('新增付款方式成功', 'success')
    addPayMethodDialog.value = false
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
// 刪除付款方式
const deletePayMethod = async () => {
  if (currentPayMethod.value.name === '現金') {
    showToast('不可刪除現金支付', 'error')
    return
  }
  if (!currentPayMethod.value.name) {
    void alert({ title: '通知', description: '請先選擇要刪除的付款方式', confirmText: '繼續選擇' })
    return
  }
  const result = await confirm({ title: '警告', description: `是否刪除付款方式 ${currentPayMethod.value.name} ?` })
  if (result !== 'confirm') return
  try {
    await deletePaymentMethod(String(currentPayMethod.value.id))
    orderStore.paymentList = orderStore.paymentList.filter((item) => item.id !== currentPayMethod.value.id)
    orderStore.paymentSource = 'server'
    currentPayMethod.value = {}
    showToast('刪除成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
// 控制編輯付款方式Dialog
const editPayMethodDialog = ref(false)
// 定義當前編輯付款方式的名稱
const currentEditInputPayMethodName = ref('')
// 定義當前選擇付款方式
const currentSelectEditPayMethod = ref<PaymentUseMethod | ''>('')
// 定義當前是否啟用付款方式
const isUseEditPayMethod = ref(true)
// 開啟控制編輯付款方式Dialog
const openEditPayMethodDialog = () => {
  if (currentPayMethod.value.name === '現金') {
    showToast('不可編輯現金支付', 'error')
    return
  }
  // P6：這裡原本會順手把 orderStore.payment／currentSelectingUseMethod／
  // useMethod 重置成現金——那是點餐頁「目前選取的付款方式」單選狀態，
  // 跟這裡編輯付款方式清單的表單完全無關，看起來是防禦性地清掉點餐頁
  // 可能殘留的選取狀態。結帳流程改用 PaymentPanel（見
  // views/home/index.vue）之後，那組單選狀態已經整個移除，這裡的重置
  // 也就沒有對象可重置，直接拿掉。
  if (currentPayMethod.value.name) {
    currentEditInputPayMethodName.value = currentPayMethod.value.name
    currentSelectEditPayMethod.value = currentPayMethod.value.useMethod!
    isUseEditPayMethod.value = !currentPayMethod.value.disabled
    editPayMethodDialog.value = true
  } else {
    void alert({ title: '通知', description: '請先選擇要編輯的付款方式', confirmText: '繼續選擇' })
  }
}
// 關閉編輯付款方式Dialog
const closeEditPayMethodDialog = () => {
  editPayMethodDialog.value = false
  showToast('操作取消', 'error')
}
// 儲存編輯
const editPayMethod = async () => {
  if (currentEditInputPayMethodName.value == '' || currentSelectEditPayMethod.value == '') {
    showToast('請輸入完整資訊', 'error')
    return
  }
  if (currentEditInputPayMethodName.value == currentPayMethod.value.name && currentSelectEditPayMethod.value == currentPayMethod.value.useMethod && isUseEditPayMethod.value == !currentPayMethod.value.disabled) {
    editPayMethodDialog.value = false
    showToast('保存成功', 'success')
    return
  }
  const anotherName = orderStore.paymentList.filter(item => item.id != currentPayMethod.value.id)
  if (anotherName.some(item => item.name == currentEditInputPayMethodName.value)) {
    showToast('此支付方式已存在,請重新輸入', 'error')
    return
  }
  try {
    const updated = await updatePaymentMethod(String(currentPayMethod.value.id), {
      name: currentEditInputPayMethodName.value,
      disabled: !isUseEditPayMethod.value,
      useMethod: currentSelectEditPayMethod.value as PaymentUseMethod,
    })
    currentPayMethod.value.name = updated.name
    currentPayMethod.value.useMethod = updated.useMethod
    currentPayMethod.value.disabled = updated.disabled
    orderStore.paymentSource = 'server'
    editPayMethodDialog.value = false
    showToast('保存成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
// 分頁器
// 定義當前的頁數
const payMethodCurrentPage = ref(1)
// 切換頁數
const handlePayMethodCurrentChange = (page: number) => {
  payMethodCurrentPage.value = page
}
// 計算當前頁數並切換顯示內容
const slicePayMethodList = computed(() => {
  return orderStore.paymentList.slice((payMethodCurrentPage.value - 1) * 10, payMethodCurrentPage.value * 10)
})
const payMethodPageCount = computed(() => Math.max(Math.ceil(orderStore.paymentList.length / 10), 1))
</script>

<style lang="scss" scoped></style>
