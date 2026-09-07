<template>
  <!-- 現金折扣券 -->
  <div class="lg:flex-[1] w-[33%]">
    <div class="flex justify-between mt-2">
      <div class="ml-2 lg:text-lg text-sm text-blue-800 font-bold border-b-2 border-solid border-black">現金折扣券</div>
      <div class="flex mr-2">
        <!-- 新增功能 -->
        <button
:class="{ 'opacity-50': fromSelection(loginStore.userInfo)?.canSetMoneyDiscount === 'X', 'pointer-events-none': fromSelection(loginStore.userInfo)?.canSetMoneyDiscount === 'X' }" class="lg:px-2 px-0.5 border-2 border-solid border-black rounded-lg mx-1 lg:text-md text-sm text-blue-800 font-bold bg-red-500 select-none active:bg-yellow-300"
          @click="openAddMoneyDiscountDialog">新增</button>
        <!-- 新增現金折扣券 -->
        <el-dialog v-model="addMoneyDiscountDialog" title="新增現金折扣券" width="500">
          <!-- 現金折扣券名稱 -->
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            折扣券名稱:<input
v-model="currentInputName"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2" placeholder="例如: $50折價券..." />
          </div>
          <!-- 現金折扣券折扣金額 -->
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            折扣的金額:<input
v-model="currentInputMoneyDiscount" type="number" min="1" step="1"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
              placeholder="純數字,例如:1,2,3..." />
          </div>
          <template #footer>
            <div class="dialog-footer">
              <el-button @click="closeAddMoneyDiscountDialog">取消</el-button>
              <el-button type="primary" @click="addDrinkMoneyDiscount">
                新增
              </el-button>
            </div>
          </template>
        </el-dialog>
        <!-- 刪除功能 -->
        <button
:class="{ 'opacity-50': fromSelection(loginStore.userInfo)?.canSetMoneyDiscount === 'X', 'pointer-events-none': fromSelection(loginStore.userInfo)?.canSetMoneyDiscount === 'X' }" class="lg:px-2 px-0.5 border-2 border-solid border-black rounded-lg mx-1 lg:text-md text-sm text-blue-800 font-bold bg-red-500 select-none active:bg-yellow-300"
          @click="deleteDrinkMoneyDiscount">刪除</button>
        <!-- 編輯功能 -->
        <button
:class="{ 'opacity-50': fromSelection(loginStore.userInfo)?.canSetMoneyDiscount === 'X', 'pointer-events-none': fromSelection(loginStore.userInfo)?.canSetMoneyDiscount === 'X' }" class="lg:px-2 px-0.5 border-2 border-solid border-black rounded-lg mx-1 lg:text-md text-sm text-blue-800 font-bold bg-red-500 select-none active:bg-yellow-300"
          @click="openEditMoneyDiscountDialog">編輯</button>
        <!-- 編輯現金折扣券 -->
        <el-dialog v-model="editMoneyDiscountDialog" title="編輯現金折扣券" width="500">
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            折扣券名稱:<input
v-model="currentEditInputName"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2" placeholder="例如: $50折價券..." />
          </div>
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            折扣的金額:<input
v-model="currentEditInputMoneyDiscount" type="number" min="1" step="1"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
              placeholder="純數字,例如:1,2,3..." />
          </div>
          <template #footer>
            <div class="dialog-footer">
              <el-button @click="closeEditMoneyDiscountDialog">取消</el-button>
              <el-button type="primary" @click="editDrinkMoneyDiscount">
                保存
              </el-button>
            </div>
          </template>
        </el-dialog>
      </div>
    </div>
    <div>
      <el-table
class="cursor-pointer mt-2" :data="sliceMoneyDiscount" highlight-current-row height="440"
        empty-text="無現金折價券" @current-change="handleCurrentChange">
        <el-table-column align="center" type="index" label="序號" min-width="55" />
        <el-table-column align="center" label="Id" prop="id" min-width="55" />
        <el-table-column align="center" label="折價券名稱" prop="name" min-width="90" />
        <el-table-column align="center" label="折價金額" prop="discountMoney" min-width="80" />
      </el-table>
      <div class="w-full h-10 bg-gray-400 shadow-xl rounded-lg flex justify-around items-center mt-10">
        <p class="text-blue-800">{{ `共 ${discountStore.moneyDiscount.length} 樣` }}</p>
        <div class="h-full flex items-center">
          <el-pagination
v-model:current-page="moneyDiscountCurrentPage" small background layout="prev, next"
            :total="discountStore.moneyDiscount.length" @current-change="handleMoneyDiscountCurrentChange" />
        </div>
        <p class="text-blue-800">{{ `${discountStore.moneyDiscount.length > 0 ? moneyDiscountCurrentPage : 0
          }/${Math.ceil(discountStore.moneyDiscount.length / 10)}頁` }}</p>
      </div>
    </div>
  </div>
  <div class="lg:flex-[1] w-[34%] border-x-2 border-solid border-black rounded-lg">
    <div class="flex justify-between mt-2">
      <div class="ml-2 lg:text-lg text-sm text-blue-800 font-bold border-b-2 border-solid border-black">折數折扣券</div>
      <div class="flex mr-2">
        <!-- 新增功能 -->
        <button
:class="{ 'opacity-50': fromSelection(loginStore.userInfo)?.canSetPercentDiscount === 'X', 'pointer-events-none': fromSelection(loginStore.userInfo)?.canSetPercentDiscount === 'X' }" class="lg:px-2 px-0.5 border-2 border-solid border-black rounded-lg mx-1 lg:text-md text-sm text-blue-800 font-bold bg-red-500 select-none active:bg-yellow-300"
          @click="openAddPercentDiscountDialog">新增</button>
        <!-- 新增折數折扣券 -->
        <el-dialog v-model="addPercentDiscountDialog" title="新增折數折扣券" width="500">
          <!-- 折數折扣券名稱 -->
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            折扣券名稱:<input
v-model="currentPercentDiscountInputName"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2" placeholder="例如: $50折價券..." />
          </div>
          <!-- 折數折扣券折扣金額 -->
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            折扣的折數:<input
v-model="currentInputPercentDiscount" type="number" min="0" step="0.01"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
              placeholder="純數字,例如:0.9,0.75..." />
          </div>
          <template #footer>
            <div class="dialog-footer">
              <el-button @click="closeAddPercentDiscountDialog">取消</el-button>
              <el-button type="primary" @click="addDrinkPercentDiscount">
                新增
              </el-button>
            </div>
          </template>
        </el-dialog>
        <!-- 刪除功能 -->
        <button
:class="{ 'opacity-50': fromSelection(loginStore.userInfo)?.canSetPercentDiscount === 'X', 'pointer-events-none': fromSelection(loginStore.userInfo)?.canSetPercentDiscount === 'X' }" class="lg:px-2 px-0.5 border-2 border-solid border-black rounded-lg mx-1 lg:text-md text-sm text-blue-800 font-bold bg-red-500 select-none active:bg-yellow-300"
          @click="deleteDrinkPercentDiscount">刪除</button>
        <!-- 編輯功能 -->
        <button
:class="{ 'opacity-50': fromSelection(loginStore.userInfo)?.canSetPercentDiscount === 'X', 'pointer-events-none': fromSelection(loginStore.userInfo)?.canSetPercentDiscount === 'X' }" class="lg:px-2 px-0.5 border-2 border-solid border-black rounded-lg mx-1 lg:text-md text-sm text-blue-800 font-bold bg-red-500 select-none active:bg-yellow-300"
          @click="openEditPercentDiscountDialog">編輯</button>
        <!-- 編輯折數折扣券 -->
        <el-dialog v-model="editPercentDiscountDialog" title="編輯折數折扣券" width="500">
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            折扣券名稱:<input
v-model="currentEditPercentDiscountInputName"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2" placeholder="例如: $50折價券..." />
          </div>
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            折扣的折數:<input
v-model="currentEditInputPercentDiscount" type="number" min="0" step="0.01"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
              placeholder="純數字,例如:0.9,0.75..." />
          </div>
          <template #footer>
            <div class="dialog-footer">
              <el-button @click="closeEditPercentDiscountDialog">取消</el-button>
              <el-button type="primary" @click="editDrinkPercentDiscount">
                保存
              </el-button>
            </div>
          </template>
        </el-dialog>
      </div>
    </div>
    <div>
      <el-table
class="cursor-pointer mt-2" :data="slicePercentDiscount" highlight-current-row height="440"
        empty-text="無折數折價券" @current-change="handleCurrentPercentDiscountChange">
        <el-table-column align="center" type="index" label="序號" min-width="55" />
        <el-table-column align="center" label="Id" prop="id" min-width="55" />
        <el-table-column align="center" label="折價券名稱" prop="name" min-width="90" />
        <el-table-column align="center" label="折價折數" prop="discountMoney" min-width="80" />
      </el-table>
      <div class="w-full h-10 bg-gray-400 shadow-xl rounded-lg flex justify-around items-center mt-10">
        <p class="text-blue-800">{{ `共 ${discountStore.percentDiscount.length} 樣` }}</p>
        <div class="h-full flex items-center">
          <el-pagination
v-model:current-page="percentDiscountCurrentPage" small background layout="prev, next"
            :total="discountStore.percentDiscount.length" @current-change="handlePercentDiscountCurrentChange" />
        </div>
        <p class="text-blue-800">{{ `${discountStore.percentDiscount.length > 0 ? percentDiscountCurrentPage : 0
          }/${Math.ceil(discountStore.percentDiscount.length / 10)}頁` }}</p>
      </div>
    </div>
  </div>
  <!-- 常用優惠 -->
  <div class="lg:flex-[1] w-[33%]">
    <div class="flex justify-between mt-2">
      <div class="ml-2 lg:text-lg text-sm text-blue-800 font-bold border-b-2 border-solid border-black">常用優惠</div>
      <div class="flex mr-2">
        <!-- 編輯功能 -->
        <button
:class="{ 'opacity-50': fromSelection(loginStore.userInfo)?.canSetOftenUseDiscount === 'X', 'pointer-events-none': fromSelection(loginStore.userInfo)?.canSetOftenUseDiscount === 'X' }" class="lg:px-2 px-0.5 border-2 border-solid border-black rounded-lg mx-1 lg:text-md text-sm text-blue-800 font-bold bg-red-500 select-none active:bg-yellow-300"
          @click="openEditOftenUseDiscountDialog">編輯</button>
        <!-- 編輯常用優惠 -->
        <el-dialog v-model="editOftenUseDiscountDialog" title="編輯常用優惠" width="500">
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            優惠名稱:<input
v-model="currentEditOftenUseDiscountInputName" :disabled="isEditName"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
              placeholder="例如: 九折,員工八折..." />
          </div>
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            折扣的金額:<input
v-model="currentEditInputEditOftenUseMoneyDiscount" type="number" min="1" step="1"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
              :disabled="isEditMoneyDiscount" placeholder="純數字,例如:1,2,3..." />
          </div>
          <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
            折扣的折數:<input
v-model="currentEditInputOftenUsePercentDiscount" type="number" min="0" step="0.01"
              class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
              :disabled="isEditPercentDiscount" placeholder="純數字,例如:0.95,0.85..." />
          </div>
          <template #footer>
            <div class="dialog-footer">
              <el-button @click="closeEditOftenUseDiscountDialog">取消</el-button>
              <el-button type="primary" @click="editDrinkOftenUseDiscount">
                保存
              </el-button>
            </div>
          </template>
        </el-dialog>
      </div>
    </div>
    <div>
      <el-table
class="cursor-pointer mt-2" :data="discountStore.oftenUseDiscount" highlight-current-row height="440"
        @current-change="handleCurrentOftenUseDiscountChange">
        <el-table-column align="center" type="index" label="序號" min-width="55" />
        <el-table-column align="center" label="優惠名稱" prop="name" min-width="90" />
        <el-table-column align="center" label="折價金額" prop="discountMoney" min-width="80" />
        <el-table-column align="center" label="折價折數" prop="discountPercent" min-width="80" />
      </el-table>
      <div class="w-full h-10 bg-gray-400 shadow-xl rounded-lg flex justify-around items-center mt-10">
        <p class="text-blue-800">共 5 樣</p>
        <div class="h-full flex items-center">
          <el-pagination small background layout="prev, next" :total="5" />
        </div>
        <p class="text-blue-800">1/1頁</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useDiscountStore } from '@/stores/discount'
const discountStore = useDiscountStore()
import { useLoginStore } from "@/stores/login"
const loginStore = useLoginStore()
import type { FormNumeric, MaybeSelected, MoneyDiscount, OftenUseDiscount, PercentDiscount } from '@/types'
import { fromSelection } from '@/utils/selection'
import { ApiError } from '@/api/http'
import {
  createMoneyCoupon,
  createPercentCoupon,
  deleteMoneyCoupon,
  deletePercentCoupon,
  updateMoneyCoupon,
  updateOftenUseRate,
  updatePercentCoupon,
} from '@/api/promotions'

// P5：這個頁面的新增／刪除／編輯改成真的呼叫 apps/api 的促銷寫入端點
// （見 api/promotions.ts），不再只是本機陣列操作。Id 因此不再是這裡
// 手動輸入的欄位——新增時由伺服端配發（見 apps/api/src/routes/
// promotions.ts），編輯只能改名稱／金額，不能改 Id。
function apiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return `操作失敗：${err.message}`
  return '連不上伺服端，請確認網路連線'
}

// 現金折扣券相關功能
// 存放當前已選現金折扣券
const currentMoneyDiscount = ref<MaybeSelected<MoneyDiscount>>({})
// 接收當前回傳的已選的類型
const handleCurrentChange = (row: MoneyDiscount) => {
  currentMoneyDiscount.value = row
}
// 存放當前輸入的現金折扣券名稱
const currentInputName = ref('')
// 存放當前輸入的折扣金額
const currentInputMoneyDiscount = ref<FormNumeric>('')
// 控制新增dialog視窗開關
const addMoneyDiscountDialog = ref(false)
// 開啟新增dialog視窗
const openAddMoneyDiscountDialog = () => {
  currentInputName.value = ''
  currentInputMoneyDiscount.value = ''
  addMoneyDiscountDialog.value = true
}
// 關閉新增dialog視窗
const closeAddMoneyDiscountDialog = () => {
  addMoneyDiscountDialog.value = false
  ElMessage.error('取消操作')
}
// 新增現金折扣券
const addDrinkMoneyDiscount = async () => {
  if (currentInputName.value === '' || currentInputMoneyDiscount.value === '') {
    ElMessage.error('請輸入完整資訊')
    return
  }
  if (discountStore.moneyDiscount.find((item) => item.name == currentInputName.value)) {
    ElMessage.error('此折扣券名稱已存在,請重新輸入')
    return
  }
  if (Number(currentInputMoneyDiscount.value) <= 0) {
    ElMessage.error('折抵金額不可為負數且需大於0,請重新輸入')
    return
  }
  try {
    const created = await createMoneyCoupon({
      name: currentInputName.value,
      discountMoney: Number(currentInputMoneyDiscount.value),
    })
    discountStore.moneyDiscount.push(created)
    addMoneyDiscountDialog.value = false
    ElMessage.success('新增成功')
  } catch (err) {
    ElMessage.error(apiErrorMessage(err))
  }
}
// 存放當前現金折扣券當前的頁數
const moneyDiscountCurrentPage = ref(1)
// 控制現金折扣券當前頁數
const handleMoneyDiscountCurrentChange = (page: number) => {
  moneyDiscountCurrentPage.value = page
}
// 計算並切換當前頁面內容
const sliceMoneyDiscount = computed(() => {
  return discountStore.moneyDiscount.slice((moneyDiscountCurrentPage.value - 1) * 10, moneyDiscountCurrentPage.value * 10)
})
// 刪除當前選擇的現金折扣券
const deleteDrinkMoneyDiscount = () => {
  if (currentMoneyDiscount.value.name) {
    ElMessageBox.confirm(
      `是否刪除折扣券 ${currentMoneyDiscount.value.name} ?`,
      '警告',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
      .then(async () => {
        try {
          await deleteMoneyCoupon(String(currentMoneyDiscount.value.id))
          discountStore.moneyDiscount = discountStore.moneyDiscount.filter((item) => item.id !== currentMoneyDiscount.value.id)
          ElMessage.success('刪除成功')
        } catch (err) {
          ElMessage.error(apiErrorMessage(err))
        }
      })
      .catch(() => {
        ElMessage.error('取消操作');
      })
  } else {
    ElMessageBox.alert('請先選擇要刪除的折扣券', '通知', {
      confirmButtonText: '繼續選擇',
      type: 'info',
    })
  }
}
// 控制編輯dialog視窗開關
const editMoneyDiscountDialog = ref(false)
// 存放當前編輯輸入的折扣券名稱
const currentEditInputName = ref('')
// 存放當前編輯輸入的折扣金額
const currentEditInputMoneyDiscount = ref<FormNumeric>('')
// 開啟編輯dialog視窗
const openEditMoneyDiscountDialog = () => {
  if (currentMoneyDiscount.value.name) {
    currentEditInputName.value = currentMoneyDiscount.value.name
    currentEditInputMoneyDiscount.value = currentMoneyDiscount.value.discountMoney!
    editMoneyDiscountDialog.value = true
  } else {
    ElMessageBox.alert('請先選擇要編輯的折扣券', '通知', {
      confirmButtonText: '繼續選擇',
      type: 'info',
    })
  }
}
// 關閉編輯dialog視窗
const closeEditMoneyDiscountDialog = () => {
  editMoneyDiscountDialog.value = false
  ElMessage.error('取消操作')
}
// 編輯現金折價券
const editDrinkMoneyDiscount = async () => {
  if (currentEditInputName.value === '' || currentEditInputMoneyDiscount.value === '') {
    ElMessage.error('請輸入完整資訊')
    return
  }
  if (currentEditInputName.value == currentMoneyDiscount.value.name && currentEditInputMoneyDiscount.value == currentMoneyDiscount.value.discountMoney) {
    editMoneyDiscountDialog.value = false
    ElMessage.success('保存成功')
    return
  }
  const anotherName = discountStore.moneyDiscount.filter(item => item.id != currentMoneyDiscount.value.id)
  if (anotherName.some(item => item.name == currentEditInputName.value)) {
    ElMessage.error('此折價券名稱已存在,請重新輸入')
    return
  }
  if (Number(currentEditInputMoneyDiscount.value) <= 0) {
    ElMessage.error('折抵金額不可為負數且需大於0,請重新輸入')
    return
  }
  try {
    const updated = await updateMoneyCoupon(String(currentMoneyDiscount.value.id), {
      name: currentEditInputName.value,
      discountMoney: Number(currentEditInputMoneyDiscount.value),
    })
    currentMoneyDiscount.value.name = updated.name
    currentMoneyDiscount.value.discountMoney = updated.discountMoney
    editMoneyDiscountDialog.value = false
    ElMessage.success('保存成功')
  } catch (err) {
    ElMessage.error(apiErrorMessage(err))
  }
}

// 折數折扣券相關功能
// 存放當前已選折數折扣券
const currentPercentDiscount = ref<MaybeSelected<PercentDiscount>>({})
// 接收當前回傳的已選的類型
const handleCurrentPercentDiscountChange = (row: PercentDiscount) => {
  currentPercentDiscount.value = row
}
// 存放當前輸入的折數折扣券名稱
const currentPercentDiscountInputName = ref('')
// 存放當前輸入的折扣金額
const currentInputPercentDiscount = ref<FormNumeric>('')
// 控制新增dialog視窗開關
const addPercentDiscountDialog = ref(false)
// 開啟新增dialog視窗
const openAddPercentDiscountDialog = () => {
  currentPercentDiscountInputName.value = ''
  currentInputPercentDiscount.value = ''
  addPercentDiscountDialog.value = true
}
// 關閉新增dialog視窗
const closeAddPercentDiscountDialog = () => {
  addPercentDiscountDialog.value = false
  ElMessage.error('取消操作')
}
// 新增折數折扣券
const addDrinkPercentDiscount = async () => {
  if (currentPercentDiscountInputName.value === '' || currentInputPercentDiscount.value === '') {
    ElMessage.error('請輸入完整資訊')
    return
  }
  if (discountStore.percentDiscount.find((item) => item.name == currentPercentDiscountInputName.value)) {
    ElMessage.error('此折扣券名稱已存在,請重新輸入')
    return
  }
  if (Number(currentInputPercentDiscount.value) < 0) {
    ElMessage.error('折抵折數不可為負數,請重新輸入')
    return
  } else if (Number(currentInputPercentDiscount.value) >= 1) {
    ElMessage.error('折抵折數不可大於等於1,請重新輸入')
    return
  }
  try {
    const created = await createPercentCoupon({
      name: currentPercentDiscountInputName.value,
      discountPercent: Number(currentInputPercentDiscount.value),
    })
    discountStore.percentDiscount.push({ id: created.id, name: created.name, discountMoney: created.discountPercent })
    addPercentDiscountDialog.value = false
    ElMessage.success('新增成功')
  } catch (err) {
    ElMessage.error(apiErrorMessage(err))
  }
}
// 存放當前折數折扣券當前的頁數
const percentDiscountCurrentPage = ref(1)
// 控制折數折扣券當前頁數
const handlePercentDiscountCurrentChange = (page: number) => {
  percentDiscountCurrentPage.value = page
}
// 計算並切換當前頁面內容
const slicePercentDiscount = computed(() => {
  return discountStore.percentDiscount.slice((percentDiscountCurrentPage.value - 1) * 10, percentDiscountCurrentPage.value * 10)
})
// 刪除當前選擇的折數折扣券
const deleteDrinkPercentDiscount = () => {
  if (currentPercentDiscount.value.name) {
    ElMessageBox.confirm(
      `是否刪除折扣券 ${currentPercentDiscount.value.name} ?`,
      '警告',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
      .then(async () => {
        try {
          await deletePercentCoupon(String(currentPercentDiscount.value.id))
          discountStore.percentDiscount = discountStore.percentDiscount.filter((item) => item.id !== currentPercentDiscount.value.id)
          ElMessage.success('刪除成功')
        } catch (err) {
          ElMessage.error(apiErrorMessage(err))
        }
      })
      .catch(() => {
        ElMessage.error('取消操作');
      })
  } else {
    ElMessageBox.alert('請先選擇要刪除的折扣券', '通知', {
      confirmButtonText: '繼續選擇',
      type: 'info',
    })
  }
}
// 控制編輯dialog視窗開關
const editPercentDiscountDialog = ref(false)
// 存放當前編輯輸入的折扣券名稱
const currentEditPercentDiscountInputName = ref('')
// 存放當前編輯輸入的折扣金額
const currentEditInputPercentDiscount = ref<FormNumeric>('')
// 開啟編輯dialog視窗
const openEditPercentDiscountDialog = () => {
  if (currentPercentDiscount.value.name) {
    currentEditPercentDiscountInputName.value = currentPercentDiscount.value.name
    currentEditInputPercentDiscount.value = currentPercentDiscount.value.discountMoney!
    editPercentDiscountDialog.value = true
  } else {
    ElMessageBox.alert('請先選擇要編輯的折扣券', '通知', {
      confirmButtonText: '繼續選擇',
      type: 'info',
    })
  }
}
// 關閉編輯dialog視窗
const closeEditPercentDiscountDialog = () => {
  editPercentDiscountDialog.value = false
  ElMessage.error('取消操作')
}
// 編輯折數折扣券
const editDrinkPercentDiscount = async () => {
  if (currentEditPercentDiscountInputName.value === '' || currentEditInputPercentDiscount.value === '') {
    ElMessage.error('請輸入完整資訊')
    return
  }
  if (currentEditPercentDiscountInputName.value == currentPercentDiscount.value.name && currentEditInputPercentDiscount.value == currentPercentDiscount.value.discountMoney) {
    editPercentDiscountDialog.value = false
    ElMessage.success('保存成功')
    return
  }
  const anotherName = discountStore.percentDiscount.filter(item => item.id != currentPercentDiscount.value.id)
  if (anotherName.some(item => item.name == currentEditPercentDiscountInputName.value)) {
    ElMessage.error('此折價券名稱已存在,請重新輸入')
    return
  }
  if (Number(currentEditInputPercentDiscount.value) < 0) {
    ElMessage.error('折抵折數不可為負數,請重新輸入')
    return
  } else if (Number(currentEditInputPercentDiscount.value) >= 1) {
    ElMessage.error('折抵折數不可大於等於1,請重新輸入')
    return
  }
  try {
    const updated = await updatePercentCoupon(String(currentPercentDiscount.value.id), {
      name: currentEditPercentDiscountInputName.value,
      discountPercent: Number(currentEditInputPercentDiscount.value),
    })
    currentPercentDiscount.value.name = updated.name
    currentPercentDiscount.value.discountMoney = updated.discountPercent
    editPercentDiscountDialog.value = false
    ElMessage.success('保存成功')
  } catch (err) {
    ElMessage.error(apiErrorMessage(err))
  }
}

// 常用優惠相關功能
// 存放當前所選的常用功能
const currentOftenUseDiscount = ref<MaybeSelected<OftenUseDiscount>>({})
// 將當前所選的常用功能存入
const handleCurrentOftenUseDiscountChange = (row: OftenUseDiscount) => {
  currentOftenUseDiscount.value = row
}
// 控制編輯dialog視窗開關
const editOftenUseDiscountDialog = ref(false)
// 存放當前編輯輸入的優惠名稱
const currentEditOftenUseDiscountInputName = ref('')
// 存放當前編輯輸入的折扣金額
const currentEditInputEditOftenUseMoneyDiscount = ref<FormNumeric>('')
// 存放當前編輯輸入的折扣折數
const currentEditInputOftenUsePercentDiscount = ref<FormNumeric>('')
// 是否可以編輯優惠名稱
const isEditName = ref(false)
// 是否可以編輯折扣金額
const isEditMoneyDiscount = ref(false)
// 是否可以編輯折扣折數
const isEditPercentDiscount = ref(false)
// 開啟編輯dialog視窗
//
// P5：oftenUseDiscount[].id 現在對應伺服端的 slot（0～4，見 api/
// promotions.ts 的 toOftenUseDiscountList()），不再是舊種子資料的
// 1～5——這裡的分組邊界因此從 <=2／>=3 改成 <=1／>=2（slot 0、1 是
// 環保／瓶裝容器群組，2～4 是三個折數群組），對照 @pos/domain 的
// OftenUseRates 型別說明。
const openEditOftenUseDiscountDialog = () => {
  if (currentOftenUseDiscount.value.name) {
    currentEditOftenUseDiscountInputName.value = currentOftenUseDiscount.value.name
    currentEditInputEditOftenUseMoneyDiscount.value = currentOftenUseDiscount.value.discountMoney!
    currentEditInputOftenUsePercentDiscount.value = currentOftenUseDiscount.value.discountPercent!
    if (Number(currentOftenUseDiscount.value.id) <= 1) {
      isEditName.value = true
      isEditPercentDiscount.value = true
    } else {
      isEditName.value = false
      isEditPercentDiscount.value = false
    }
    if (Number(currentOftenUseDiscount.value.id) >= 2) {
      isEditMoneyDiscount.value = true
    } else {
      isEditMoneyDiscount.value = false
    }
    editOftenUseDiscountDialog.value = true
  } else {
    ElMessageBox.alert('請先選擇要編輯的優惠', '通知', {
      confirmButtonText: '繼續選擇',
      type: 'info',
    })
  }
}
// 關閉編輯dialog視窗
const closeEditOftenUseDiscountDialog = () => {
  editOftenUseDiscountDialog.value = false
  ElMessage.error('取消操作')
}
// 編輯常用優惠
const editDrinkOftenUseDiscount = async () => {
  if (currentEditOftenUseDiscountInputName.value === '' || currentEditInputEditOftenUseMoneyDiscount.value === '' || currentEditInputOftenUsePercentDiscount.value === '') {
    ElMessage.error('請輸入完整資訊')
    return
  }
  if (currentEditOftenUseDiscountInputName.value == currentOftenUseDiscount.value.name && currentEditInputEditOftenUseMoneyDiscount.value == currentOftenUseDiscount.value.discountMoney && currentEditInputOftenUsePercentDiscount.value == currentOftenUseDiscount.value.discountPercent) {
    editOftenUseDiscountDialog.value = false
    ElMessage.success('保存成功')
    return
  }
  const anotherName = discountStore.oftenUseDiscount.filter(item => item.id != currentOftenUseDiscount.value.id)
  if (anotherName.some(item => item.name == currentEditOftenUseDiscountInputName.value)) {
    ElMessage.error('此優惠名稱已存在,請重新輸入')
    return
  }
  if (Number(currentEditInputEditOftenUseMoneyDiscount.value) <= 0 && !isEditMoneyDiscount.value) {
    ElMessage.error('折抵金額不可為負數且需大於0,請重新輸入')
    return
  }
  if (Number(currentEditInputOftenUsePercentDiscount.value) < 0 && !isEditPercentDiscount.value) {
    ElMessage.error('折抵折數不可為負數,請重新輸入')
    return
  } else if (Number(currentEditInputOftenUsePercentDiscount.value) >= 1 && !isEditPercentDiscount.value) {
    ElMessage.error('折抵折數不可大於等於1,請重新輸入')
    return
  }
  try {
    const updated = await updateOftenUseRate(Number(currentOftenUseDiscount.value.id), {
      name: currentEditOftenUseDiscountInputName.value,
      discountMoney: Number(currentEditInputEditOftenUseMoneyDiscount.value),
      discountPercent: Number(currentEditInputOftenUsePercentDiscount.value),
    })
    currentOftenUseDiscount.value.name = updated.name
    currentOftenUseDiscount.value.discountMoney = updated.discountMoney
    currentOftenUseDiscount.value.discountPercent = updated.discountPercent
    editOftenUseDiscountDialog.value = false
    ElMessage.success('保存成功')
  } catch (err) {
    ElMessage.error(apiErrorMessage(err))
  }
}
</script>

<style lang="scss" scoped></style>
