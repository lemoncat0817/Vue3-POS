<template>
  <!-- 人員名單 -->
  <div class="2xl:flex-[2] xl:w-[70%] w-[60%] border-r-2 border-solid border-black rounded-lg">
    <div class="flex justify-between mt-2">
      <div class="ml-2 md:text-lg sm:text-sm text-xs text-blue-800 font-bold border-b-2 border-solid border-black">人員名單</div>
      <div class="flex mr-2">
        <!-- 新增功能 -->
        <button
:class="{ 'opacity-50': fromSelection(loginStore.userInfo)?.canSetAuthority === 'X', 'pointer-events-none': fromSelection(loginStore.userInfo)?.canSetAuthority === 'X' }"
          class="px-2 border-2 border-solid border-black rounded-lg mx-1 md:text-md text-xs text-blue-800 font-bold bg-red-500 select-none active:bg-yellow-300"
          @click="openAddStaffDialog">新增</button>
        <!-- 新增人員 -->
        <!-- P8：組件庫替換——el-dialog 改用 ModalDialog（Reka UI
             Dialog）；el-checkbox-group 改用一份資料驅動的欄位清單
             （authorityFields，見 script 的說明）配上原生 checkbox，
             取代新增／編輯各自重複 16 個幾乎一樣的 el-checkbox。 -->
        <ModalDialog v-model:open="addStaffDialog" title="新增人員">
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            人員的Id:<input
v-model="currentInputStaffId" type="number" min="1" step="1"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
              placeholder="純數字,例如:1,2,3..." />
          </div>
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            人員的名稱:<input
v-model="currentInputStaffName"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
              placeholder="例如: Jensen、Jacky..." />
          </div>
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            人員的職稱:<input
v-model="currentInputStaffJobTitle"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2" placeholder="例如: 襄理、工讀生..." />
          </div>
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            人員的帳號:<input
v-model="currentInputStaffAccount"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2" placeholder="請輸入帳號" />
          </div>
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            人員的密碼:<input
v-model="currentInputStaffPassword"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2" placeholder="請輸入密碼" />
          </div>
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            權限管理:
            <div class="ml-2 grid w-[265px] grid-cols-2 gap-0.5 rounded-lg border-2 border-solid border-black px-2 py-1">
              <label v-for="field in authorityFields" :key="field.value" class="flex items-center gap-1 text-sm">
                <input
                  type="checkbox" :checked="authorityCheckList.includes(field.value)"
                  :disabled="!!field.dependsOn && !authorityCheckList.includes(field.dependsOn)"
                  @change="toggleAuthorityCheck(authorityCheckList, field.value, ($event.target as HTMLInputElement).checked, (v) => authorityCheckList = v)">
                {{ field.label }}
              </label>
            </div>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button type="button" class="rounded-lg border border-surface-300 px-4 py-2 text-sm font-bold text-surface-700 hover:bg-surface-100" @click="closeAddStaffDialog">取消</button>
            <button type="button" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700" @click="addStaff">新增</button>
          </div>
        </ModalDialog>
        <!-- 刪除功能 -->
        <button
:class="{ 'opacity-50': fromSelection(loginStore.userInfo)?.canSetAuthority === 'X', 'pointer-events-none': fromSelection(loginStore.userInfo)?.canSetAuthority === 'X' }"
          class="px-2 border-2 border-solid border-black rounded-lg mx-1 md:text-md text-xs text-blue-800 font-bold bg-red-500 select-none active:bg-yellow-300"
          @click="deleteStaff">刪除</button>
        <!-- 編輯功能 -->
        <button
:class="{ 'opacity-50': fromSelection(loginStore.userInfo)?.canSetAuthority === 'X', 'pointer-events-none': fromSelection(loginStore.userInfo)?.canSetAuthority === 'X' }"
          class="px-2 border-2 border-solid border-black rounded-lg mx-1 md:text-md text-xs text-blue-800 font-bold bg-red-500 select-none active:bg-yellow-300"
          @click="openEditStaffDialog">編輯</button>
        <!-- 編輯人員 -->
        <ModalDialog v-model:open="editStaffDialog" title="編輯人員">
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            人員的Id:<input
v-model="currentEditInputStaffId" type="number" min="1" step="1"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
              placeholder="純數字,例如:1,2,3..." />
          </div>
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            人員的名稱:<input
v-model="currentEditInputStaffName"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
              placeholder="例如: Jensen、Jacky..." />
          </div>
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            人員的職稱:<input
v-model="currentEditInputStaffJobTitle"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2" placeholder="例如: 襄理、工讀生..." />
          </div>
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            人員的帳號:<input
v-model="currentEditInputStaffAccount"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2" placeholder="請輸入帳號" />
          </div>
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            人員的密碼:<input
v-model="currentEditInputStaffPassword"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2" placeholder="請輸入密碼" />
          </div>
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            權限管理:
            <div class="ml-2 grid w-[265px] grid-cols-2 gap-0.5 rounded-lg border-2 border-solid border-black px-2 py-1">
              <label v-for="field in authorityFields" :key="field.value" class="flex items-center gap-1 text-sm">
                <input
                  type="checkbox" :checked="editAuthorityCheckList.includes(field.value)"
                  :disabled="!!field.dependsOn && !editAuthorityCheckList.includes(field.dependsOn)"
                  @change="toggleAuthorityCheck(editAuthorityCheckList, field.value, ($event.target as HTMLInputElement).checked, (v) => editAuthorityCheckList = v)">
                {{ field.label }}
              </label>
            </div>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button type="button" class="rounded-lg border border-surface-300 px-4 py-2 text-sm font-bold text-surface-700 hover:bg-surface-100" @click="closeEditStaffDialog">取消</button>
            <button type="button" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700" @click="editStaff">保存</button>
          </div>
        </ModalDialog>
      </div>
    </div>
    <div class="overflow-x-auto w-full">
      <!-- P8：組件庫替換——el-table 改用純 HTML table。原本 17 個
           el-table-column 裡有 16 個是幾乎一樣的「O 是綠字、X 是紅字」
           權限欄位，改成用同一份 authorityFields 資料驅動渲染，不再
           一個欄位一段重複的模板。 -->
      <table class="mt-2 w-full text-center text-sm">
        <thead class="bg-surface-100 text-xs font-bold text-surface-500">
          <tr>
            <th class="px-2 py-2">人員名稱</th>
            <th class="px-2 py-2">Id</th>
            <th class="px-2 py-2">職稱</th>
            <th class="px-2 py-2">帳號</th>
            <th class="px-2 py-2">密碼</th>
            <th v-for="field in authorityFields" :key="field.value" class="whitespace-nowrap px-2 py-2">{{ field.label }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-surface-100">
          <tr v-if="sliceStaffList.length === 0">
            <td :colspan="5 + authorityFields.length" class="px-2 py-8 text-surface-400">人員名單是空的</td>
          </tr>
          <tr
            v-for="row in sliceStaffList" :key="row.id" class="cursor-pointer transition-colors hover:bg-surface-50"
            :class="{ 'bg-primary-50': currentStaff.id === row.id }" @click="currentStaff = row">
            <td class="px-2 py-2">{{ row.name }}</td>
            <td class="px-2 py-2">{{ row.id }}</td>
            <td class="px-2 py-2">{{ row.jobTitle }}</td>
            <td class="px-2 py-2">{{ row.account }}</td>
            <td class="px-2 py-2">{{ row.password }}</td>
            <td v-for="field in authorityFields" :key="field.value" class="px-2 py-2">
              <span :class="row[field.value] === 'O' ? 'text-emerald-600' : 'text-red-600'">{{ row[field.value] }}</span>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="mt-4 flex items-center justify-around rounded-lg bg-surface-100 px-2 py-2 text-sm text-surface-600">
        <p>{{ `共 ${authorityManagementStore.staffList.length} 樣` }}</p>
        <div class="flex items-center gap-2">
          <button type="button" class="rounded border border-surface-300 px-2 disabled:opacity-40" :disabled="staffCurrentPage <= 1" @click="handleStaffCurrentChange(staffCurrentPage - 1)">‹</button>
          <button type="button" class="rounded border border-surface-300 px-2 disabled:opacity-40" :disabled="staffCurrentPage >= staffPageCount" @click="handleStaffCurrentChange(staffCurrentPage + 1)">›</button>
        </div>
        <p>{{ `${authorityManagementStore.staffList.length > 0 ? staffCurrentPage : 0}/${staffPageCount}頁` }}</p>
      </div>
    </div>
  </div>
  <!-- 付款方式 -->
  <div class="2xl:flex-[1] xl:w-[30%] w-[40%]">
    <div class="flex justify-between mt-2">
      <div class="ml-2 md:text-lg sm:text-sm text-xs text-blue-800 font-bold border-b-2 border-solid border-black">付款方式</div>
      <div class="flex mr-2">
        <!-- 新增功能 -->
        <button
:class="{ 'opacity-50': fromSelection(loginStore.userInfo)?.canSetPayMethod === 'X', 'pointer-events-none': fromSelection(loginStore.userInfo)?.canSetPayMethod === 'X' }"
          class="px-2 border-2 border-solid border-black rounded-lg mx-1 md:text-md text-xs text-blue-800 font-bold bg-red-500 select-none active:bg-yellow-300"
          @click="openAddPayMethodDialog">新增</button>
        <!-- 新增付款方式 -->
        <!-- P8：組件庫替換——el-select／el-option 改用 Reka UI 的
             Select 原語，el-switch 改用 Reka UI 的 Switch 原語，跟
             backgroundSetting/productManagement/index.vue 的做法一致。 -->
        <ModalDialog v-model:open="addPayMethodDialog" title="新增付款方式">
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            付款方式的Id:<input
v-model="currentInputPayMethodId" type="number" min="1" step="1"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
              placeholder="純數字,例如:1,2,3..." />
          </div>
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            付款方式的名稱:<input
v-model="currentInputPayMethodName"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
              placeholder="例如: 現金、LinePay..." />
          </div>
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            支付方式:
            <SelectRoot v-model="currentSelectPayMethod">
              <SelectTrigger class="flex w-[235px] items-center justify-between rounded-lg border-2 border-solid border-black bg-white px-2 py-1 text-left">
                <SelectValue placeholder="選擇支付方式" />
                <span aria-hidden="true">▾</span>
              </SelectTrigger>
              <SelectPortal>
                <SelectContent class="z-50 w-[235px] rounded-lg border border-surface-200 bg-white shadow-lg" position="popper">
                  <SelectViewport class="p-1">
                    <SelectItem
                      v-for="item in payMethodOptions" :key="item.value" :value="item.value"
                      class="cursor-pointer rounded px-2 py-1 text-center outline-none hover:bg-surface-100 data-[state=checked]:bg-primary-50">
                      <SelectItemText>{{ item.label }}</SelectItemText>
                    </SelectItem>
                  </SelectViewport>
                </SelectContent>
              </SelectPortal>
            </SelectRoot>
          </div>
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            是否啟用:
            <SwitchRoot v-model="isUsePayMethod" class="relative h-6 w-11 rounded-full bg-surface-300 data-[state=checked]:bg-primary-500">
              <SwitchThumb class="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
            </SwitchRoot>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button type="button" class="rounded-lg border border-surface-300 px-4 py-2 text-sm font-bold text-surface-700 hover:bg-surface-100" @click="closeAddPayMethodDialog">取消</button>
            <button type="button" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700" @click="addPayMethod">新增</button>
          </div>
        </ModalDialog>
        <!-- 刪除功能 -->
        <button
:class="{ 'opacity-50': fromSelection(loginStore.userInfo)?.canSetPayMethod === 'X', 'pointer-events-none': fromSelection(loginStore.userInfo)?.canSetPayMethod === 'X' }"
          class="px-2 border-2 border-solid border-black rounded-lg mx-1 md:text-md text-xs text-blue-800 font-bold bg-red-500 select-none active:bg-yellow-300"
          @click="deletePayMethod">刪除</button>
        <!-- 編輯功能 -->
        <button
:class="{ 'opacity-50': fromSelection(loginStore.userInfo)?.canSetPayMethod === 'X', 'pointer-events-none': fromSelection(loginStore.userInfo)?.canSetPayMethod === 'X' }"
          class="px-2 border-2 border-solid border-black rounded-lg mx-1 md:text-md text-xs text-blue-800 font-bold bg-red-500 select-none active:bg-yellow-300"
          @click="openEditPayMethodDialog">編輯</button>
        <!-- 編輯付款方式 -->
        <ModalDialog v-model:open="editPayMethodDialog" title="編輯付款方式">
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            付款方式的Id:<input
v-model="currentEditInputPayMethodId" type="number" min="1" step="1"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
              placeholder="純數字,例如:1,2,3..." />
          </div>
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            付款方式的名稱:<input
v-model="currentEditInputPayMethodName"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
              placeholder="例如: 現金、LinePay..." />
          </div>
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            支付方式:
            <SelectRoot v-model="currentSelectEditPayMethod">
              <SelectTrigger class="flex w-[235px] items-center justify-between rounded-lg border-2 border-solid border-black bg-white px-2 py-1 text-left">
                <SelectValue placeholder="選擇支付方式" />
                <span aria-hidden="true">▾</span>
              </SelectTrigger>
              <SelectPortal>
                <SelectContent class="z-50 w-[235px] rounded-lg border border-surface-200 bg-white shadow-lg" position="popper">
                  <SelectViewport class="p-1">
                    <SelectItem
                      v-for="item in payMethodOptions" :key="item.value" :value="item.value"
                      class="cursor-pointer rounded px-2 py-1 text-center outline-none hover:bg-surface-100 data-[state=checked]:bg-primary-50">
                      <SelectItemText>{{ item.label }}</SelectItemText>
                    </SelectItem>
                  </SelectViewport>
                </SelectContent>
              </SelectPortal>
            </SelectRoot>
          </div>
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            是否啟用:
            <SwitchRoot v-model="isUseEditPayMethod" class="relative h-6 w-11 rounded-full bg-surface-300 data-[state=checked]:bg-primary-500">
              <SwitchThumb class="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
            </SwitchRoot>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button type="button" class="rounded-lg border border-surface-300 px-4 py-2 text-sm font-bold text-surface-700 hover:bg-surface-100" @click="closeEditPayMethodDialog">取消</button>
            <button type="button" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700" @click="editPayMethod">保存</button>
          </div>
        </ModalDialog>
      </div>
    </div>
    <div>
      <table class="mt-2 w-full text-center text-sm">
        <thead class="bg-surface-100 text-xs font-bold text-surface-500">
          <tr>
            <th class="px-2 py-2">序號</th>
            <th class="px-2 py-2">Id</th>
            <th class="px-2 py-2">付款方式</th>
            <th class="px-2 py-2">支付方式</th>
            <th class="px-2 py-2">使用</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-surface-100">
          <tr v-if="slicePayMethodList.length === 0">
            <td colspan="5" class="px-2 py-8 text-surface-400">沒有付款方式</td>
          </tr>
          <tr
            v-for="(row, index) in slicePayMethodList" :key="row.id" class="cursor-pointer transition-colors hover:bg-surface-50"
            :class="{ 'bg-primary-50': currentPayMethod.id === row.id }" @click="currentPayMethod = row">
            <td class="px-2 py-2">{{ index + 1 }}</td>
            <td class="px-2 py-2">{{ row.id }}</td>
            <td class="px-2 py-2">{{ row.name }}</td>
            <td class="px-2 py-2">{{ row.useMethod }}</td>
            <td class="px-2 py-2">{{ row.disabled == false ? '是' : '否' }}</td>
          </tr>
        </tbody>
      </table>
      <div class="mt-4 flex items-center justify-around rounded-lg bg-surface-100 px-2 py-2 text-sm text-surface-600">
        <p>{{ `共 ${orderStore.paymentList.length} 樣` }}</p>
        <div class="flex items-center gap-2">
          <button type="button" class="rounded border border-surface-300 px-2 disabled:opacity-40" :disabled="payMethodCurrentPage <= 1" @click="handlePayMethodCurrentChange(payMethodCurrentPage - 1)">‹</button>
          <button type="button" class="rounded border border-surface-300 px-2 disabled:opacity-40" :disabled="payMethodCurrentPage >= payMethodPageCount" @click="handlePayMethodCurrentChange(payMethodCurrentPage + 1)">›</button>
        </div>
        <p>{{ `${orderStore.paymentList.length > 0 ? payMethodCurrentPage : 0}/${payMethodPageCount}頁` }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// P4：這個頁面顯示／編輯的「密碼」欄位是純本機狀態，跟登入（views/
// login/index.vue 改用伺服端 PIN 驗證）已經沒有關聯，見 stores/
// authorityManagement.ts 開頭的說明。
//
// P8：組件庫替換，跟 backgroundSetting/productManagement/index.vue
// 一樣的範圍決定——這個頁面的資料完全是本機陣列操作，從沒接過 API，
// ElMessage／ElMessageBox 改用 showToast／confirm／alert，驗證邏輯
// 維持原本的 if/else，不改成 VeeValidate + Zod。
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
import { useAuthorityManagementStore } from '@/stores/authorityManagement'
const authorityManagementStore = useAuthorityManagementStore()
import { useOrderStore } from '@/stores/order'
const orderStore = useOrderStore()
import { useLoginStore } from '@/stores/login';
const loginStore = useLoginStore()
import type { AuthorityKey, FormNumeric, MaybeSelected, PaymentMethod, PaymentUseMethod, StaffMember } from '@/types'
import { fromSelection } from '@/utils/selection'

// 人員名單相關的功能
// 存放當前選擇的人員
const currentStaff = ref<MaybeSelected<StaffMember>>({})
// 控制新增人員Dialog
const addStaffDialog = ref(false)
// 開啟新增人員Dialog
const openAddStaffDialog = () => {
  currentInputStaffId.value = ''
  currentInputStaffName.value = ''
  currentInputStaffJobTitle.value = ''
  currentInputStaffAccount.value = ''
  currentInputStaffPassword.value = ''
  authorityCheckList.value = []
  addStaffDialog.value = true
}
// 關閉新增人員Dialog
const closeAddStaffDialog = () => {
  addStaffDialog.value = false
  showToast('操作取消', 'error')
}
// 定義當前新增人員的Id
const currentInputStaffId = ref<FormNumeric>('')
// 定義當前新增人員的名稱
const currentInputStaffName = ref('')
// 定義當前新增人員的職稱
const currentInputStaffJobTitle = ref('')
// 定義當前新增人員的帳號
const currentInputStaffAccount = ref('')
// 定義當前新增人員的密碼
const currentInputStaffPassword = ref('')
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
const addStaff = () => {
  if (currentInputStaffId.value == '' || currentInputStaffName.value == '' || currentInputStaffJobTitle.value == '' || currentInputStaffAccount.value == '' || currentInputStaffPassword.value == '') {
    showToast('請輸入完整資訊', 'error')
    return
  }
  if (authorityManagementStore.staffList.find((item) => item.id == currentInputStaffId.value)) {
    showToast('此Id已存在,請重新輸入', 'error')
    return
  }
  if (authorityManagementStore.staffList.find((item) => item.account == currentInputStaffAccount.value)) {
    showToast('此帳號已存在,請重新輸入', 'error')
    return
  }
  if (Number(currentInputStaffId.value) <= 0) {
    showToast('Id不可為負數且需大於0,請重新輸入', 'error')
    return
  }
  // 送出新增人員的表單格式
  const addStaffForm: StaffMember = {
    id: currentInputStaffId.value,
    name: currentInputStaffName.value,
    jobTitle: currentInputStaffJobTitle.value,
    account: currentInputStaffAccount.value,
    password: currentInputStaffPassword.value,
    authorityCheckList: authorityCheckList.value,
    canFreeDrink: authorityCheckList.value.some(item => item.includes('canFreeDrink')) ? 'O' : 'X',
    canOpenCashier: authorityCheckList.value.some(item => item.includes('canOpenCashier')) ? 'O' : 'X',
    canCheckOrder: authorityCheckList.value.some(item => item.includes('canCheckOrder')) ? 'O' : 'X',
    canEditOrderStatus: authorityCheckList.value.some(item => item.includes('canEditOrderStatus')) ? 'O' : 'X',
    canDeleteOrder: authorityCheckList.value.some(item => item.includes('canDeleteOrder')) ? 'O' : 'X',
    canCheckBackgroundSetting: authorityCheckList.value.some(item => item.includes('canCheckBackgroundSetting')) ? 'O' : 'X',
    canSetDrinkType: authorityCheckList.value.some(item => item.includes('canSetDrinkType')) ? 'O' : 'X',
    canSetDrink: authorityCheckList.value.some(item => item.includes('canSetDrink')) ? 'O' : 'X',
    canSetIngredients: authorityCheckList.value.some(item => item.includes('canSetIngredients')) ? 'O' : 'X',
    canSetMoneyDiscount: authorityCheckList.value.some(item => item.includes('canSetMoneyDiscount')) ? 'O' : 'X',
    canSetPercentDiscount: authorityCheckList.value.some(item => item.includes('canSetPercentDiscount')) ? 'O' : 'X',
    canSetOftenUseDiscount: authorityCheckList.value.some(item => item.includes('canSetOftenUseDiscount')) ? 'O' : 'X',
    canCheckDataAnalysis: authorityCheckList.value.some(item => item.includes('canCheckDataAnalysis')) ? 'O' : 'X',
    canCheckAuthority: authorityCheckList.value.some(item => item.includes('canCheckAuthority')) ? 'O' : 'X',
    canSetAuthority: authorityCheckList.value.some(item => item.includes('canSetAuthority')) ? 'O' : 'X',
    canSetPayMethod: authorityCheckList.value.some(item => item.includes('canSetPayMethod')) ? 'O' : 'X',
  }
  authorityManagementStore.staffList.push(addStaffForm)
  showToast('新增人員成功', 'success')
  addStaffDialog.value = false
}
// 刪除人員
const deleteStaff = async () => {
  if (currentStaff.value.id == 1) {
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
  authorityManagementStore.staffList = authorityManagementStore.staffList.filter((item) => item.id !== currentStaff.value.id)
  showToast('刪除成功', 'success')
}
// 控制編輯人員Dialog
const editStaffDialog = ref(false)
// 定義當前編輯人員的Id
const currentEditInputStaffId = ref<FormNumeric>('')
// 定義當前編輯人員的名稱
const currentEditInputStaffName = ref('')
// 定義當前編輯人員的職稱
const currentEditInputStaffJobTitle = ref('')
// 定義當前編輯人員的帳號
const currentEditInputStaffAccount = ref('')
// 定義當前編輯人員的密碼
const currentEditInputStaffPassword = ref('')
// 開啟控制編輯人員Dialog人員Dialog
const openEditStaffDialog = () => {
  if (currentStaff.value.id === 1) {
    showToast('不可編輯店長', 'error')
    return
  }
  if (currentStaff.value.account === fromSelection(loginStore.userInfo)?.account) {
    showToast('不可編輯自己', 'error')
    return
  }
  if (currentStaff.value.name) {
    currentEditInputStaffId.value = currentStaff.value.id!
    currentEditInputStaffName.value = currentStaff.value.name
    currentEditInputStaffJobTitle.value = currentStaff.value.jobTitle!
    currentEditInputStaffAccount.value = currentStaff.value.account!
    currentEditInputStaffPassword.value = currentStaff.value.password!
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
const editStaff = () => {
  if (currentEditInputStaffId.value == '' || currentEditInputStaffName.value == '' || currentEditInputStaffJobTitle.value == '' || currentEditInputStaffAccount.value == '' || currentEditInputStaffPassword.value == '') {
    showToast('請輸入完整資訊', 'error')
    return
  }
  if (currentEditInputStaffId.value == currentStaff.value.id && currentEditInputStaffName.value == currentStaff.value.name && currentEditInputStaffJobTitle.value == currentStaff.value.jobTitle && currentEditInputStaffAccount.value == currentStaff.value.account && currentEditInputStaffPassword.value == currentStaff.value.password && editAuthorityCheckList.value == currentStaff.value.authorityCheckList) {
    editStaffDialog.value = false
    showToast('保存成功', 'success')
    return
  } else {
    const anotherId = authorityManagementStore.staffList.filter(item => item.id != currentStaff.value.id)
    if (anotherId.some(item => item.id == currentEditInputStaffId.value)) {
      showToast('此Id已存在,請重新輸入', 'error')
      return
    }
    const anotherAccount = authorityManagementStore.staffList.filter(item => item.account != currentStaff.value.account)
    if (anotherAccount.some(item => item.account == currentEditInputStaffAccount.value)) {
      showToast('此帳號已存在,請重新輸入', 'error')
      return
    }
    if (Number(currentEditInputStaffId.value) <= 0) {
      showToast('Id不可為負數且需大於0,請重新輸入', 'error')
      return
    }
  }
  currentStaff.value.id = currentEditInputStaffId.value
  currentStaff.value.name = currentEditInputStaffName.value
  currentStaff.value.jobTitle = currentEditInputStaffJobTitle.value
  currentStaff.value.account = currentEditInputStaffAccount.value
  currentStaff.value.password = currentEditInputStaffPassword.value
  currentStaff.value.authorityCheckList = editAuthorityCheckList.value
  currentStaff.value.canFreeDrink = editAuthorityCheckList.value.some(item => item.includes('canFreeDrink')) ? 'O' : 'X'
  currentStaff.value.canOpenCashier = editAuthorityCheckList.value.some(item => item.includes('canOpenCashier')) ? 'O' : 'X'
  currentStaff.value.canCheckOrder = editAuthorityCheckList.value.some(item => item.includes('canCheckOrder')) ? 'O' : 'X'
  currentStaff.value.canEditOrderStatus = editAuthorityCheckList.value.some(item => item.includes('canEditOrderStatus')) ? 'O' : 'X'
  currentStaff.value.canDeleteOrder = editAuthorityCheckList.value.some(item => item.includes('canDeleteOrder')) ? 'O' : 'X'
  currentStaff.value.canCheckBackgroundSetting = editAuthorityCheckList.value.some(item => item.includes('canCheckBackgroundSetting')) ? 'O' : 'X'
  currentStaff.value.canSetDrinkType = editAuthorityCheckList.value.some(item => item.includes('canSetDrinkType')) ? 'O' : 'X'
  currentStaff.value.canSetDrink = editAuthorityCheckList.value.some(item => item.includes('canSetDrink')) ? 'O' : 'X'
  currentStaff.value.canSetIngredients = editAuthorityCheckList.value.some(item => item.includes('canSetIngredients')) ? 'O' : 'X'
  currentStaff.value.canSetMoneyDiscount = editAuthorityCheckList.value.some(item => item.includes('canSetMoneyDiscount')) ? 'O' : 'X'
  currentStaff.value.canSetPercentDiscount = editAuthorityCheckList.value.some(item => item.includes('canSetPercentDiscount')) ? 'O' : 'X'
  currentStaff.value.canSetOftenUseDiscount = editAuthorityCheckList.value.some(item => item.includes('canSetOftenUseDiscount')) ? 'O' : 'X'
  currentStaff.value.canCheckDataAnalysis = editAuthorityCheckList.value.some(item => item.includes('canCheckDataAnalysis')) ? 'O' : 'X'
  currentStaff.value.canCheckAuthority = editAuthorityCheckList.value.some(item => item.includes('canCheckAuthority')) ? 'O' : 'X'
  currentStaff.value.canSetAuthority = editAuthorityCheckList.value.some(item => item.includes('canSetAuthority')) ? 'O' : 'X'
  currentStaff.value.canSetPayMethod = editAuthorityCheckList.value.some(item => item.includes('canSetPayMethod')) ? 'O' : 'X'
  editStaffDialog.value = false
  showToast('保存成功', 'success')
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
  currentInputPayMethodId.value = ''
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
// 定義當前新增付款方式的Id
const currentInputPayMethodId = ref<FormNumeric>('')
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
const addPayMethod = () => {
  if (currentInputPayMethodId.value == '' || currentInputPayMethodName.value == '' || currentSelectPayMethod.value == '') {
    showToast('請輸入完整資訊', 'error')
    return
  }
  if (orderStore.paymentList.find((item) => item.id == currentInputPayMethodId.value)) {
    showToast('此Id已存在,請重新輸入', 'error')
    return
  }
  if (orderStore.paymentList.find((item) => item.name == currentInputPayMethodName.value)) {
    showToast('此付款方式已存在,請重新輸入', 'error')
    return
  }
  if (Number(currentInputPayMethodId.value) <= 0) {
    showToast('Id不可為負數且需大於0,請重新輸入', 'error')
    return
  }
  // 送出新增付款方式的表單格式
  const addPayMethodForm: PaymentMethod = {
    id: currentInputPayMethodId.value,
    name: currentInputPayMethodName.value,
    disabled: !isUsePayMethod.value,
    useMethod: currentSelectPayMethod.value as PaymentUseMethod,
  }
  orderStore.paymentList.push(addPayMethodForm)
  showToast('新增付款方式成功', 'success')
  addPayMethodDialog.value = false
}
// 刪除付款方式
const deletePayMethod = async () => {
  if (currentPayMethod.value.id == 1) {
    showToast('不可刪除現金支付', 'error')
    return
  }
  if (!currentPayMethod.value.name) {
    void alert({ title: '通知', description: '請先選擇要刪除的付款方式', confirmText: '繼續選擇' })
    return
  }
  const result = await confirm({ title: '警告', description: `是否刪除付款方式 ${currentPayMethod.value.name} ?` })
  if (result !== 'confirm') return
  orderStore.paymentList = orderStore.paymentList.filter((item) => item.id !== currentPayMethod.value.id)
  showToast('刪除成功', 'success')
}
// 控制編輯付款方式Dialog
const editPayMethodDialog = ref(false)
// 定義當前編輯付款方式的Id
const currentEditInputPayMethodId = ref<FormNumeric>('')
// 定義當前編輯付款方式的名稱
const currentEditInputPayMethodName = ref('')
// 定義當前選擇付款方式
const currentSelectEditPayMethod = ref<PaymentUseMethod | ''>('')
// 定義當前是否啟用付款方式
const isUseEditPayMethod = ref(true)
// 開啟控制編輯付款方式Dialog
const openEditPayMethodDialog = () => {
  if (currentPayMethod.value.id === 1) {
    showToast('不可編輯現金支付', 'error')
    return
  }
  if (currentPayMethod.value.name) {
    orderStore.payment = '現金'
    orderStore.currentSelectingUseMethod = '紙鈔'
    orderStore.useMethod = '紙鈔'
    currentEditInputPayMethodId.value = currentPayMethod.value.id!
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
const editPayMethod = () => {
  if (currentEditInputPayMethodId.value == '' || currentEditInputPayMethodName.value == '' || currentSelectEditPayMethod.value == '') {
    showToast('請輸入完整資訊', 'error')
    return
  }
  if (currentEditInputPayMethodId.value == currentPayMethod.value.id && currentEditInputPayMethodName.value == currentPayMethod.value.name && currentSelectEditPayMethod.value == currentPayMethod.value.useMethod && isUseEditPayMethod.value == !currentPayMethod.value.disabled) {
    editPayMethodDialog.value = false
    showToast('保存成功', 'success')
    return
  } else {
    const anotherId = orderStore.paymentList.filter(item => item.id != currentPayMethod.value.id)
    if (anotherId.some(item => item.id == currentEditInputPayMethodId.value)) {
      showToast('此Id已存在,請重新輸入', 'error')
      return
    }
    const anotherName = orderStore.paymentList.filter(item => item.name != currentPayMethod.value.name)
    if (anotherName.some(item => item.name == currentEditInputPayMethodName.value)) {
      showToast('此支付方式已存在,請重新輸入', 'error')
      return
    }
    if (Number(currentEditInputPayMethodId.value) <= 0) {
      showToast('Id不可為負數且需大於0,請重新輸入', 'error')
      return
    }
  }
  currentPayMethod.value.id = currentEditInputPayMethodId.value
  currentPayMethod.value.name = currentEditInputPayMethodName.value
  currentPayMethod.value.useMethod = currentSelectEditPayMethod.value as PaymentUseMethod
  currentPayMethod.value.disabled = !isUseEditPayMethod.value
  editPayMethodDialog.value = false
  showToast('保存成功', 'success')
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
