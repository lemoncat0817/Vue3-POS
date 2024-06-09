<template>
  <!-- 人員名單 -->
  <div class="flex-[2] border-r-2 border-solid border-black rounded-lg">
    <div class="flex justify-between mt-2">
      <div class="ml-2 text-lg text-blue-800 font-bold border-b-2 border-solid border-black">人員名單</div>
      <div class="flex mr-2">
        <!-- 新增功能 -->
        <button @click="openAddStaffDialog"
          class="px-2 border-2 border-solid border-black rounded-lg mx-1 text-md text-blue-800 font-bold bg-red-500 select-none active:bg-yellow-300">新增</button>
        <!-- 新增人員 -->
        <el-dialog v-model="addStaffDialog" title="新增人員" width="500">
          <!-- 人員的Id -->
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            人員的Id:<input v-model="currentInputStaffId" type="number" min="1" step="1"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
              placeholder="純數字,例如:1,2,3..." />
          </div>
          <!-- 人員的名稱 -->
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            人員的名稱:<input v-model="currentInputStaffName"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
              placeholder="例如: Jensen、Jacky..." />
          </div>
          <!-- 人員的職稱 -->
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            人員的職稱:<input v-model="currentInputStaffJobTitle"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2" placeholder="例如: 襄理、工讀生..." />
          </div>
          <!-- 人員的帳號 -->
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            人員的帳號:<input v-model="currentInputStaffAccount"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2" placeholder="請輸入帳號" />
          </div>
          <!-- 人員的密碼 -->
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            人員的密碼:<input v-model="currentInputStaffPassword"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2" placeholder="請輸入密碼" />
          </div>
          <!-- 權限管理 -->
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            權限管理: <el-checkbox-group @change="handleAuthorityCheckListChange"
              class="w-[265px] border-2 border-solid border-black rounded-lg ml-2 text-center px-2 grid grid-cols-2 gap-0.5"
              v-model="authorityCheckList">
              <el-checkbox label="點餐" value="canOrder" />
              <el-checkbox label="免費招待" value="canFreeDrink" :disabled="!authorityCheckList.includes('canOrder')" />
              <el-checkbox label="開收銀機" value="canOpenCashier" :disabled="!authorityCheckList.includes('canOrder')" />
              <el-checkbox label="查看訂單" value="canCheckOrder" />
              <el-checkbox label="編輯訂單狀態" value="canEditOrderStatus"
                :disabled="!authorityCheckList.includes('canCheckOrder')" />
              <el-checkbox label="刪除訂單" value="canDeleteOrder"
                :disabled="!authorityCheckList.includes('canCheckOrder')" />
              <el-checkbox label="查看後台設定" value="canCheckBackgroundSetting" />
              <el-checkbox label="設定飲品類型" value="canSetDrinkType"
                :disabled="!authorityCheckList.includes('canCheckBackgroundSetting')" />
              <el-checkbox label="設定飲料品項" value="canSetDrink"
                :disabled="!authorityCheckList.includes('canCheckBackgroundSetting')" />
              <el-checkbox label="設定配料" value="canSetIngredients"
                :disabled="!authorityCheckList.includes('canCheckBackgroundSetting')" />
              <el-checkbox label="設定現金折扣券" value="canSetMoneyDiscount"
                :disabled="!authorityCheckList.includes('canCheckBackgroundSetting')" />
              <el-checkbox label="設定折數折扣券" value="canSetPercentDiscount"
                :disabled="!authorityCheckList.includes('canCheckBackgroundSetting')" />
              <el-checkbox label="設定常用優惠" value="canSetOftenUseDiscount"
                :disabled="!authorityCheckList.includes('canCheckBackgroundSetting')" />
              <el-checkbox label="查看數據分析" value="canCheckDataAnalysis" />
              <el-checkbox label="查看權限管理" value="canCheckAuthority" />
              <el-checkbox label="設定人員名單" value="canSetAuthority"
                :disabled="!authorityCheckList.includes('canCheckAuthority')" />
              <el-checkbox label="設定付款方式" value="canSetPayMethod"
                :disabled="!authorityCheckList.includes('canCheckAuthority')" />
            </el-checkbox-group>
          </div>
          <template #footer>
            <div class="dialog-footer">
              <el-button @click="closeAddStaffDialog">取消</el-button>
              <el-button type="primary" @click="addStaff">
                新增
              </el-button>
            </div>
          </template>
        </el-dialog>
        <!-- 刪除功能 -->
        <button @click="deleteStaff"
          class="px-2 border-2 border-solid border-black rounded-lg mx-1 text-md text-blue-800 font-bold bg-red-500 select-none active:bg-yellow-300">刪除</button>
        <!-- 編輯功能 -->
        <button @click="openEditStaffDialog"
          class="px-2 border-2 border-solid border-black rounded-lg mx-1 text-md text-blue-800 font-bold bg-red-500 select-none active:bg-yellow-300">編輯</button>
        <!-- 編輯人員 -->
        <el-dialog v-model="editStaffDialog" title="編輯人員" width="500">
          <!-- 人員的Id -->
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            人員的Id:<input v-model="currentEditInputStaffId" type="number" min="1" step="1"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
              placeholder="純數字,例如:1,2,3..." />
          </div>
          <!-- 人員的名稱 -->
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            人員的名稱:<input v-model="currentEditInputStaffName"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
              placeholder="例如: Jensen、Jacky..." />
          </div>
          <!-- 人員的職稱 -->
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            人員的職稱:<input v-model="currentEditInputStaffJobTitle"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2" placeholder="例如: 襄理、工讀生..." />
          </div>
          <!-- 人員的帳號 -->
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            人員的帳號:<input v-model="currentEditInputStaffAccount"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2" placeholder="請輸入帳號" />
          </div>
          <!-- 人員的密碼 -->
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            人員的密碼:<input v-model="currentEditInputStaffPassword"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2" placeholder="請輸入密碼" />
          </div>
          <!-- 權限管理 -->
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            權限管理: <el-checkbox-group
              class="w-[265px] border-2 border-solid border-black rounded-lg ml-2 text-center px-2 grid grid-cols-2 gap-0.5"
              v-model="editAuthorityCheckList" @change="handleEditAuthorityCheckListChange">
              <el-checkbox label="點餐" value="canOrder" />
              <el-checkbox label="免費招待" value="canFreeDrink" :disabled="!editAuthorityCheckList.includes('canOrder')" />
              <el-checkbox label="開收銀機" value="canOpenCashier"
                :disabled="!editAuthorityCheckList.includes('canOrder')" />
              <el-checkbox label="查看訂單" value="canCheckOrder" />
              <el-checkbox label="編輯訂單狀態" value="canEditOrderStatus"
                :disabled="!editAuthorityCheckList.includes('canCheckOrder')" />
              <el-checkbox label="刪除訂單" value="canDeleteOrder"
                :disabled="!editAuthorityCheckList.includes('canCheckOrder')" />
              <el-checkbox label="查看後台設定" value="canCheckBackgroundSetting" />
              <el-checkbox label="設定飲品類型" value="canSetDrinkType"
                :disabled="!editAuthorityCheckList.includes('canCheckBackgroundSetting')" />
              <el-checkbox label="設定飲料品項" value="canSetDrink"
                :disabled="!editAuthorityCheckList.includes('canCheckBackgroundSetting')" />
              <el-checkbox label="設定配料" value="canSetIngredients"
                :disabled="!editAuthorityCheckList.includes('canCheckBackgroundSetting')" />
              <el-checkbox label="設定現金折扣券" value="canSetMoneyDiscount"
                :disabled="!editAuthorityCheckList.includes('canCheckBackgroundSetting')" />
              <el-checkbox label="設定折數折扣券" value="canSetPercentDiscount"
                :disabled="!editAuthorityCheckList.includes('canCheckBackgroundSetting')" />
              <el-checkbox label="設定常用優惠" value="canSetOftenUseDiscount"
                :disabled="!editAuthorityCheckList.includes('canCheckBackgroundSetting')" />
              <el-checkbox label="查看數據分析" value="canCheckDataAnalysis" />
              <el-checkbox label="查看權限管理" value="canCheckAuthority" />
              <el-checkbox label="設定人員名單" value="canSetAuthority"
                :disabled="!editAuthorityCheckList.includes('canCheckAuthority')" />
              <el-checkbox label="設定付款方式" value="canSetPayMethod"
                :disabled="!editAuthorityCheckList.includes('canCheckAuthority')" />
            </el-checkbox-group>
          </div>
          <template #footer>
            <div class="dialog-footer">
              <el-button @click="closeEditStaffDialog">取消</el-button>
              <el-button type="primary" @click="editStaff">
                保存
              </el-button>
            </div>
          </template>
        </el-dialog>
      </div>
    </div>
    <div class="overflow-x-auto w-[987px]">
      <el-table class="cursor-pointer mt-2" :data="sliceStaffList" highlight-current-row height="440"
        style="width: 100%; overflow-x:auto;" empty-text="人員名單是空的" @current-change="handleCurrentStaffChange">
        <el-table-column fixed align="center" label="人員名稱" prop="name" min-width="80" />
        <el-table-column align="center" label="Id" prop="id" min-width="55" />
        <el-table-column align="center" label="職稱" prop="jobTitle" min-width="80" />
        <el-table-column align="center" label="帳號" prop="account" min-width="80" />
        <el-table-column align="center" label="密碼" prop="password" min-width="95" />
        <el-table-column align="center" label="點餐" min-width="80">
          <template #default="{ row }">
            <p class="text-green-500" :class="{ 'text-red-700': row.canOrder != 'O' }">{{ row.canOrder }}</p>
          </template>
        </el-table-column>
        <el-table-column align="center" label="免費招待" min-width="80">
          <template #default="{ row }">
            <p class="text-green-500" :class="{ 'text-red-700': row.canFreeDrink != 'O' }">{{ row.canFreeDrink }}</p>
          </template>
        </el-table-column>
        <el-table-column align="center" label="開收銀機" min-width="80">
          <template #default="{ row }">
            <p class="text-green-500" :class="{ 'text-red-700': row.canOpenCashier != 'O' }">{{ row.canOpenCashier }}
            </p>
          </template>
        </el-table-column>
        <el-table-column align="center" label="查看訂單" min-width="80">
          <template #default="{ row }">
            <p class="text-green-500" :class="{ 'text-red-700': row.canCheckOrder != 'O' }">{{ row.canCheckOrder }}</p>
          </template>
        </el-table-column>
        <el-table-column align="center" label="編輯訂單狀態" min-width="110">
          <template #default="{ row }">
            <p class="text-green-500" :class="{ 'text-red-700': row.canEditOrderStatus != 'O' }">{{
              row.canEditOrderStatus
            }}
            </p>
          </template>
        </el-table-column>
        <el-table-column align="center" label="刪除訂單" min-width="80">
          <template #default="{ row }">
            <p class="text-green-500" :class="{ 'text-red-700': row.canDeleteOrder != 'O' }">{{ row.canDeleteOrder }}
            </p>
          </template>
        </el-table-column>
        <el-table-column align="center" label="查看後台設定" min-width="110">
          <template #default="{ row }">
            <p class="text-green-500" :class="{ 'text-red-700': row.canCheckBackgroundSetting != 'O' }">{{
              row.canCheckBackgroundSetting }}
            </p>
          </template>
        </el-table-column>
        <el-table-column align="center" label="設定飲品類型" min-width="110">
          <template #default="{ row }">
            <p class="text-green-500" :class="{ 'text-red-700': row.canSetDrinkType != 'O' }">
              {{ row.canSetDrinkType }}
            </p>
          </template>
        </el-table-column>
        <el-table-column align="center" label="設定飲料品項" min-width="110">
          <template #default="{ row }">
            <p class="text-green-500" :class="{ 'text-red-700': row.canSetDrink != 'O' }">
              {{ row.canSetDrink }}
            </p>
          </template>
        </el-table-column>
        <el-table-column align="center" label="設定配料" min-width="80">
          <template #default="{ row }">
            <p class="text-green-500" :class="{ 'text-red-700': row.canSetIngredients != 'O' }">
              {{ row.canSetIngredients }}
            </p>
          </template>
        </el-table-column>
        <el-table-column align="center" label="設定現金折扣券" min-width="125">
          <template #default="{ row }">
            <p class="text-green-500" :class="{ 'text-red-700': row.canSetMoneyDiscount != 'O' }">
              {{ row.canSetMoneyDiscount }}
            </p>
          </template>
        </el-table-column>
        <el-table-column align="center" label="設定折數折扣券" min-width="125">
          <template #default="{ row }">
            <p class="text-green-500" :class="{ 'text-red-700': row.canSetPercentDiscount != 'O' }">
              {{ row.canSetPercentDiscount }}
            </p>
          </template>
        </el-table-column>
        <el-table-column align="center" label="設定常用優惠" min-width="110">
          <template #default="{ row }">
            <p class="text-green-500" :class="{ 'text-red-700': row.canSetOftenUseDiscount != 'O' }">
              {{ row.canSetOftenUseDiscount }}
            </p>
          </template>
        </el-table-column>
        <el-table-column align="center" label="查看數據分析" min-width="110">
          <template #default="{ row }">
            <p class="text-green-500" :class="{ 'text-red-700': row.canCheckDataAnalysis != 'O' }">
              {{ row.canCheckDataAnalysis }}
            </p>
          </template>
        </el-table-column>
        <el-table-column align="center" label="查看權限管理" min-width="110">
          <template #default="{ row }">
            <p class="text-green-500" :class="{ 'text-red-700': row.canCheckAuthority != 'O' }">
              {{ row.canCheckAuthority }}
            </p>
          </template>
        </el-table-column>
        <el-table-column align="center" label="設定人員名單" min-width="110">
          <template #default="{ row }">
            <p class="text-green-500" :class="{ 'text-red-700': row.canSetAuthority != 'O' }">
              {{ row.canSetAuthority }}
            </p>
          </template>
        </el-table-column>
        <el-table-column align="center" label="設定付款方式" min-width="110">
          <template #default="{ row }">
            <p class="text-green-500" :class="{ 'text-red-700': row.canSetPayMethod != 'O' }">
              {{ row.canSetPayMethod }}
            </p>
          </template>
        </el-table-column>
      </el-table>
      <div class="w-full h-10 bg-gray-400 shadow-xl rounded-lg flex justify-around items-center mt-10">
        <p class="text-blue-800">{{ `共 ${authorityManagementStore.staffList.length} 樣` }}</p>
        <div class="h-full flex items-center">
          <el-pagination v-model:current-page="staffCurrentPage" small background layout="prev, next"
            :total="authorityManagementStore.staffList.length" @current-change="handleStaffCurrentChange" />
        </div>
        <p class="text-blue-800">{{ `${authorityManagementStore.staffList.length > 0 ? staffCurrentPage : 0
          }/${Math.ceil(authorityManagementStore.staffList.length / 10)}頁` }}</p>
      </div>
    </div>
  </div>
  <!-- 付款方式 -->
  <div class="flex-[1]">
    <div class="flex justify-between mt-2">
      <div class="ml-2 text-lg text-blue-800 font-bold border-b-2 border-solid border-black">付款方式</div>
      <div class="flex mr-2">
        <!-- 新增功能 -->
        <button @click="openAddPayMethodDialog"
          class="px-2 border-2 border-solid border-black rounded-lg mx-1 text-md text-blue-800 font-bold bg-red-500 select-none active:bg-yellow-300">新增</button>
        <!-- 新增付款方式 -->
        <el-dialog v-model="addPayMethodDialog" title="新增付款方式" width="500">
          <!-- 付款方式的Id -->
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            付款方式的Id:<input v-model="currentInputPayMethodId" type="number" min="1" step="1"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
              placeholder="純數字,例如:1,2,3..." />
          </div>
          <!-- 付款方式的名稱 -->
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            付款方式的名稱:<input v-model="currentInputPayMethodName"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
              placeholder="例如: 現金、LinePay..." />
          </div>
          <!-- 支付方式 -->
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            支付方式:<el-select v-model="currentSelectPayMethod" placeholder="選擇支付方式" size="default" style="width: 235px">
              <el-option class="text-center" v-for="item in payMethodOptions" :key="item.value" :label="item.label"
                :value="item.value" />
            </el-select>
          </div>
          <!-- 付款方式是否使用 -->
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            是否啟用: <el-switch class="w-[235px]" size="large" v-model="isUsePayMethod" inline-prompt active-text="是"
              inactive-text="否" />
          </div>
          <template #footer>
            <div class="dialog-footer">
              <el-button @click="closeAddPayMethodDialog">取消</el-button>
              <el-button type="primary" @click="addPayMethod">
                新增
              </el-button>
            </div>
          </template>
        </el-dialog>
        <!-- 刪除功能 -->
        <button @click="deletePayMethod"
          class="px-2 border-2 border-solid border-black rounded-lg mx-1 text-md text-blue-800 font-bold bg-red-500 select-none active:bg-yellow-300">刪除</button>
        <!-- 編輯功能 -->
        <button @click="openEditPayMethodDialog"
          class="px-2 border-2 border-solid border-black rounded-lg mx-1 text-md text-blue-800 font-bold bg-red-500 select-none active:bg-yellow-300">編輯</button>
        <!-- 編輯付款方式 -->
        <el-dialog v-model="editPayMethodDialog" title="編輯付款方式" width="500">
          <!-- 付款方式的Id -->
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            付款方式的Id:<input v-model="currentEditInputPayMethodId" type="number" min="1" step="1"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
              placeholder="純數字,例如:1,2,3..." />
          </div>
          <!-- 付款方式的名稱 -->
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            付款方式的名稱:<input v-model="currentEditInputPayMethodName"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
              placeholder="例如: 現金、LinePay..." />
          </div>
          <!-- 支付方式 -->
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            支付方式:<el-select v-model="currentSelectEditPayMethod" placeholder="選擇支付方式" size="default"
              style="width: 235px">
              <el-option class="text-center" v-for="item in payMethodOptions" :key="item.value" :label="item.label"
                :value="item.value" />
            </el-select>
          </div>
          <!-- 付款方式是否使用 -->
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            是否啟用: <el-switch class="w-[235px]" size="large" v-model="isUseEditPayMethod" inline-prompt active-text="是"
              inactive-text="否" />
          </div>
          <template #footer>
            <div class="dialog-footer">
              <el-button @click="closeEditPayMethodDialog">取消</el-button>
              <el-button type="primary" @click="editPayMethod">
                保存
              </el-button>
            </div>
          </template>
        </el-dialog>
      </div>
    </div>
    <div>
      <el-table class="cursor-pointer mt-2" :data="slicePayMethodList" highlight-current-row height="440"
        empty-text="沒有付款方式" @current-change="handleCurrentPayMethodChange">
        <el-table-column align="center" type="index" label="序號" min-width="55" />
        <el-table-column align="center" label="Id" prop="id" min-width="55" />
        <el-table-column align="center" label="付款方式" prop="name" min-width="80" />
        <el-table-column align="center" label="支付方式" prop="useMethod" min-width="80" />
        <el-table-column align="center" label="使用" min-width="55">
          <template #default="{ row }">
            <p>{{ row.disabled == false ? '是' : '否' }}</p>
          </template>
        </el-table-column>
      </el-table>
      <div class="w-full h-10 bg-gray-400 shadow-xl rounded-lg flex justify-around items-center mt-10">
        <p class="text-blue-800">{{ `共 ${orderStore.paymentList.length} 樣` }}</p>
        <div class="h-full flex items-center">
          <el-pagination v-model:current-page="payMethodCurrentPage" small background layout="prev, next"
            :total="orderStore.paymentList.length" @current-change="handlePayMethodCurrentChange" />
        </div>
        <p class="text-blue-800">{{ `${orderStore.paymentList.length > 0 ? payMethodCurrentPage : 0
          }/${Math.ceil(orderStore.paymentList.length / 10)}頁` }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useAuthorityManagementStore } from '@/stores/authorityManagement'
const authorityManagementStore = useAuthorityManagementStore()
import { useOrderStore } from '@/stores/order'
const orderStore = useOrderStore()

// 人員名單相關的功能
// 存放當前選擇的人員
const currentStaff = ref({})
// 將選擇的人員存入
const handleCurrentStaffChange = (row) => {
  currentStaff.value = row
}
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
  ElMessage.error('操作取消')
}
// 定義當前新增人員的Id
const currentInputStaffId = ref()
// 定義當前新增人員的名稱
const currentInputStaffName = ref('')
// 定義當前新增人員的職稱
const currentInputStaffJobTitle = ref('')
// 定義當前新增人員的帳號
const currentInputStaffAccount = ref('')
// 定義當前新增人員的密碼
const currentInputStaffPassword = ref('')
// 定義權限管理清單
const authorityCheckList = ref([])
// 勾選的項目改變把已勾選被禁用的選項取消勾選
const handleAuthorityCheckListChange = (value) => {
  if (!value.includes('canOrder')) {
    authorityCheckList.value = authorityCheckList.value.filter(item => item != 'canFreeDrink' && item != 'canOpenCashier')
  }
  if (!value.includes('canCheckOrder')) {
    authorityCheckList.value = authorityCheckList.value.filter(item => item != 'canEditOrderStatus' && item != 'canDeleteOrder')
  }
  if (!value.includes('canCheckBackgroundSetting')) {
    authorityCheckList.value = authorityCheckList.value.filter(item => item != 'canSetDrinkType' && item != 'canSetDrink' && item != 'canSetIngredients' && item != 'canSetMoneyDiscount' && item != 'canSetPercentDiscount' && item != 'canSetOftenUseDiscount')
  }
  if (!value.includes('canCheckAuthority')) {
    authorityCheckList.value = authorityCheckList.value.filter(item => item != 'canSetAuthority' && item != 'canSetPayMethod')
  }
}
// 新增人員
const addStaff = () => {
  if (currentInputStaffId.value == '' || currentInputStaffName.value == '' || currentInputStaffJobTitle.value == '' || currentInputStaffAccount.value == '' || currentInputStaffPassword.value == '') {
    ElMessage.error('請輸入完整資訊')
    return
  }
  if (authorityManagementStore.staffList.find((item) => item.id == currentInputStaffId.value)) {
    ElMessage.error('此Id已存在,請重新輸入')
    return
  }
  if (authorityManagementStore.staffList.find((item) => item.account == currentInputStaffAccount.value)) {
    ElMessage.error('此帳號已存在,請重新輸入')
    return
  }
  if (currentInputStaffId.value <= 0) {
    ElMessage.error('Id不可為負數且需大於0,請重新輸入')
    return
  }
  // 送出新增人員的表單格式
  const addStaffForm = {
    id: currentInputStaffId.value,
    name: currentInputStaffName.value,
    jobTitle: currentInputStaffJobTitle.value,
    account: currentInputStaffAccount.value,
    password: currentInputStaffPassword.value,
    authorityCheckList: authorityCheckList.value,
    canOrder: authorityCheckList.value.some(item => item.includes('canOrder')) ? 'O' : 'X',
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
  ElMessage.success('新增人員成功')
  addStaffDialog.value = false
}
// 刪除人員
const deleteStaff = () => {
  if (currentStaff.value.id == 1) {
    ElMessage.error('不可刪除店長')
    return
  }
  if (currentStaff.value.name) {
    ElMessageBox.confirm(
      `是否刪除人員 ${currentStaff.value.name} ?`,
      '警告',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
      .then(() => {
        authorityManagementStore.staffList = authorityManagementStore.staffList.filter((item) => item.id !== currentStaff.value.id);
        ElMessage.success('刪除成功')
      })
      .catch(() => {
        ElMessage.error('取消操作');
      })
  } else {
    ElMessageBox.alert('請先選擇要刪除的人員', '通知', {
      confirmButtonText: '繼續選擇',
      type: 'info',
    })
  }
}
// 控制編輯人員Dialog
const editStaffDialog = ref(false)
// 定義當前編輯人員的Id
const currentEditInputStaffId = ref()
// 定義當前編輯人員的名稱
const currentEditInputStaffName = ref('')
// 定義當前編輯人員的職稱
const currentEditInputStaffJobTitle = ref('')
// 定義當前編輯人員的帳號
const currentEditInputStaffAccount = ref('')
// 定義當前編輯人員的密碼
const currentEditInputStaffPassword = ref('')
// 定義權限管理清單
const editAuthorityCheckList = ref([])
// 勾選的項目改變把已勾選被禁用的選項取消勾選
const handleEditAuthorityCheckListChange = (value) => {
  if (!value.includes('canOrder')) {
    editAuthorityCheckList.value = editAuthorityCheckList.value.filter(item => item != 'canFreeDrink' && item != 'canOpenCashier')
  }
  if (!value.includes('canCheckOrder')) {
    editAuthorityCheckList.value = editAuthorityCheckList.value.filter(item => item != 'canEditOrderStatus' && item != 'canDeleteOrder')
  }
  if (!value.includes('canCheckBackgroundSetting')) {
    editAuthorityCheckList.value = editAuthorityCheckList.value.filter(item => item != 'canSetDrinkType' && item != 'canSetDrink' && item != 'canSetIngredients' && item != 'canSetMoneyDiscount' && item != 'canSetPercentDiscount' && item != 'canSetOftenUseDiscount')
  }
  if (!value.includes('canCheckAuthority')) {
    editAuthorityCheckList.value = editAuthorityCheckList.value.filter(item => item != 'canSetAuthority' && item != 'canSetPayMethod')
  }
}
// 開啟控制編輯人員Dialog人員Dialog
const openEditStaffDialog = () => {
  if (currentStaff.value.id === 1) {
    ElMessage.error('不可編輯店長')
    return
  }
  if (currentStaff.value.name) {
    currentEditInputStaffId.value = currentStaff.value.id
    currentEditInputStaffName.value = currentStaff.value.name
    currentEditInputStaffJobTitle.value = currentStaff.value.jobTitle
    currentEditInputStaffAccount.value = currentStaff.value.account
    currentEditInputStaffPassword.value = currentStaff.value.password
    editAuthorityCheckList.value = currentStaff.value.authorityCheckList
    editStaffDialog.value = true
  } else {
    ElMessageBox.alert('請先選擇要編輯的人員', '通知', {
      confirmButtonText: '繼續選擇',
      type: 'info',
    })
  }

}
// 關閉編輯人員Dialog
const closeEditStaffDialog = () => {
  editStaffDialog.value = false
  ElMessage.error('操作取消')
}
// 儲存編輯
const editStaff = () => {
  if (currentEditInputStaffId.value == '' || currentEditInputStaffName.value == '' || currentEditInputStaffJobTitle.value == '' || currentEditInputStaffAccount.value == '' || currentEditInputStaffPassword.value == '') {
    ElMessage.error('請輸入完整資訊')
    return
  }
  if (currentEditInputStaffId.value == currentStaff.value.id && currentEditInputStaffName.value == currentStaff.value.name && currentEditInputStaffJobTitle.value == currentStaff.value.jobTitle && currentEditInputStaffAccount.value == currentStaff.value.account && currentEditInputStaffPassword.value == currentStaff.value.password && editAuthorityCheckList.value == currentStaff.value.authorityCheckList) {
    editStaffDialog.value = false
    ElMessage.success('保存成功')
    return
  } else {
    const anotherId = ref([])
    anotherId.value = (authorityManagementStore.staffList.filter(item => item.id != currentStaff.value.id))
    if (anotherId.value.some(item => item.id == currentEditInputStaffId.value)) {
      ElMessage.error('此Id已存在,請重新輸入')
      return
    }
    const anotherAccount = ref([])
    anotherAccount.value = (authorityManagementStore.staffList.filter(item => item.account != currentStaff.value.account))
    if (anotherAccount.value.some(item => item.account == currentEditInputStaffAccount.value)) {
      ElMessage.error('此帳號已存在,請重新輸入')
      return
    }
    if (currentEditInputStaffId.value <= 0) {
      ElMessage.error('Id不可為負數且需大於0,請重新輸入')
      return
    }
  }
  currentStaff.value.id = currentEditInputStaffId.value
  currentStaff.value.name = currentEditInputStaffName.value
  currentStaff.value.jobTitle = currentEditInputStaffJobTitle.value
  currentStaff.value.account = currentEditInputStaffAccount.value
  currentStaff.value.password = currentEditInputStaffPassword.value
  currentStaff.value.authorityCheckList = editAuthorityCheckList.value
  currentStaff.value.canOrder = editAuthorityCheckList.value.some(item => item.includes('canOrder')) ? 'O' : 'X'
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
  ElMessage.success('保存成功')
}
// 分頁器
// 定義當前的頁數
const staffCurrentPage = ref(1)
// 切換頁數
const handleStaffCurrentChange = (page) => {
  staffCurrentPage.value = page
}
// 計算當前頁數並切換顯示內容
const sliceStaffList = computed(() => {
  return authorityManagementStore.staffList.slice((staffCurrentPage.value - 1) * 10, staffCurrentPage.value * 10)
})

// 付款方式相關的功能
// 存放當前選擇的付款方式
const currentPayMethod = ref({})
// 將選擇的付款方式存入
const handleCurrentPayMethodChange = (row) => {
  currentPayMethod.value = row
}
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
  ElMessage.error('操作取消')
}
// 定義當前新增付款方式的Id
const currentInputPayMethodId = ref()
// 定義當前新增付款方式的名稱
const currentInputPayMethodName = ref('')
// 定義當前選擇付款方式
const currentSelectPayMethod = ref('')
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
    ElMessage.error('請輸入完整資訊')
    return
  }
  if (orderStore.paymentList.find((item) => item.id == currentInputPayMethodId.value)) {
    ElMessage.error('此Id已存在,請重新輸入')
    return
  }
  if (orderStore.paymentList.find((item) => item.name == currentInputPayMethodName.value)) {
    ElMessage.error('此付款方式已存在,請重新輸入')
    return
  }
  if (currentInputPayMethodId.value <= 0) {
    ElMessage.error('Id不可為負數且需大於0,請重新輸入')
    return
  }
  // 送出新增付款方式的表單格式
  const addPayMethodForm = {
    id: currentInputPayMethodId.value,
    name: currentInputPayMethodName.value,
    disabled: !isUsePayMethod.value,
    useMethod: currentSelectPayMethod.value,
  }
  orderStore.paymentList.push(addPayMethodForm)
  ElMessage.success('新增付款方式成功')
  addPayMethodDialog.value = false
}
// 刪除付款方式
const deletePayMethod = () => {
  if (currentPayMethod.value.id == 1) {
    ElMessage.error('不可刪除現金支付')
    return
  }
  if (currentPayMethod.value.name) {
    ElMessageBox.confirm(
      `是否刪除付款方式 ${currentPayMethod.value.name} ?`,
      '警告',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
      .then(() => {
        orderStore.paymentList = orderStore.paymentList.filter((item) => item.id !== currentPayMethod.value.id);
        ElMessage.success('刪除成功')
      })
      .catch(() => {
        ElMessage.error('取消操作');
      })
  } else {
    ElMessageBox.alert('請先選擇要刪除的付款方式', '通知', {
      confirmButtonText: '繼續選擇',
      type: 'info',
    })
  }
}
// 控制編輯付款方式Dialog
const editPayMethodDialog = ref(false)
// 定義當前編輯付款方式的Id
const currentEditInputPayMethodId = ref()
// 定義當前編輯付款方式的名稱
const currentEditInputPayMethodName = ref('')
// 定義當前選擇付款方式
const currentSelectEditPayMethod = ref('')
// 定義當前是否啟用付款方式
const isUseEditPayMethod = ref(true)
// 定義付款方式
// 開啟控制編輯付款方式Dialog
const openEditPayMethodDialog = () => {
  if (currentPayMethod.value.id === 1) {
    ElMessage.error('不可編輯現金支付')
    return
  }
  if (currentPayMethod.value.name) {
    orderStore.payment = '現金'
    currentEditInputPayMethodId.value = currentPayMethod.value.id
    currentEditInputPayMethodName.value = currentPayMethod.value.name
    currentSelectEditPayMethod.value = currentPayMethod.value.useMethod
    isUseEditPayMethod.value = !currentPayMethod.value.disabled
    editPayMethodDialog.value = true
  } else {
    ElMessageBox.alert('請先選擇要編輯的付款方式', '通知', {
      confirmButtonText: '繼續選擇',
      type: 'info',
    })
    return
  }

}
// 關閉編輯付款方式Dialog
const closeEditPayMethodDialog = () => {
  editPayMethodDialog.value = false
  ElMessage.error('操作取消')
}
// 儲存編輯
const editPayMethod = () => {
  if (currentEditInputPayMethodId.value == '' || currentEditInputPayMethodName.value == '' || currentSelectEditPayMethod.value == '') {
    ElMessage.error('請輸入完整資訊')
    return
  }
  if (currentEditInputPayMethodId.value == currentPayMethod.value.id && currentEditInputPayMethodName.value == currentPayMethod.value.name && currentSelectEditPayMethod.value == currentPayMethod.value.useMethod && isUseEditPayMethod.value == !currentPayMethod.value.disabled) {
    editPayMethodDialog.value = false
    ElMessage.success('保存成功')
    return
  } else {
    const anotherId = ref([])
    anotherId.value = (orderStore.paymentList.filter(item => item.id != currentPayMethod.value.id))
    if (anotherId.value.some(item => item.id == currentEditInputPayMethodId.value)) {
      ElMessage.error('此Id已存在,請重新輸入')
      return
    }
    const anotherName = ref([])
    anotherName.value = (orderStore.paymentList.filter(item => item.name != currentPayMethod.value.name))
    if (anotherName.value.some(item => item.name == currentEditInputPayMethodName.value)) {
      ElMessage.error('此支付方式已存在,請重新輸入')
      return
    }
    if (currentEditInputPayMethodId.value <= 0) {
      ElMessage.error('Id不可為負數且需大於0,請重新輸入')
      return
    }
  }
  currentPayMethod.value.id = currentEditInputPayMethodId.value
  currentPayMethod.value.name = currentEditInputPayMethodName.value
  currentPayMethod.value.useMethod = currentSelectEditPayMethod.value
  currentPayMethod.value.disabled = !isUseEditPayMethod.value
  editPayMethodDialog.value = false
  ElMessage.success('保存成功')
}
// 分頁器
// 定義當前的頁數
const payMethodCurrentPage = ref(1)
// 切換頁數
const handlePayMethodCurrentChange = (page) => {
  payMethodCurrentPage.value = page
}
// 計算當前頁數並切換顯示內容
const slicePayMethodList = computed(() => {
  return orderStore.paymentList.slice((payMethodCurrentPage.value - 1) * 10, payMethodCurrentPage.value * 10)
})

</script>

<style lang="scss" scoped></style>