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
            權限管理: <el-checkbox-group
              class="w-[235px] border-2 border-solid border-black rounded-lg ml-2 text-center px-2 grid grid-cols-2 gap-0.5"
              v-model="authorityCheckList">
              <el-checkbox label="點餐" value="canOrder" />
              <el-checkbox label="開收銀機" value="canOpenCashier" />
              <el-checkbox label="查看訂單" value="canCheckOrder" />
              <el-checkbox label="商品管理" value="canEditProduct" />
              <el-checkbox label="優惠管理" value="canEditDiscount" />
              <el-checkbox label="查看數據" value="canCheckDataAnalysis" />
              <el-checkbox label="編輯權限" value="canEditAuthority" />
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
              class="w-[235px] border-2 border-solid border-black rounded-lg ml-2 text-center px-2 grid grid-cols-2 gap-0.5"
              v-model="editAuthorityCheckList">
              <el-checkbox label="點餐" value="canOrder" />
              <el-checkbox label="開收銀機" value="canOpenCashier" />
              <el-checkbox label="查看訂單" value="canCheckOrder" />
              <el-checkbox label="商品管理" value="canEditProduct" />
              <el-checkbox label="優惠管理" value="canEditDiscount" />
              <el-checkbox label="查看數據" value="canCheckDataAnalysis" />
              <el-checkbox label="編輯權限" value="canEditAuthority" />
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
    <div>
      <el-table class="cursor-pointer mt-2" :data="sliceStaffList" highlight-current-row height="440"
        empty-text="人員名單是空的" @current-change="handleCurrentStaffChange">
        <el-table-column align="center" type="index" label="序號" min-width="55" />
        <el-table-column align="center" label="Id" prop="id" min-width="55" />
        <el-table-column align="center" label="人員名稱" prop="name" min-width="80" />
        <el-table-column align="center" label="職稱" prop="jobTitle" min-width="80" />
        <el-table-column align="center" label="帳號" prop="account" min-width="80" />
        <el-table-column align="center" label="密碼" prop="password" min-width="95" />
        <el-table-column align="center" label="點餐" min-width="80">
          <template #default="{ row }">
            <p class="text-green-500" :class="{ 'text-red-700': row.canOrder != 'O' }">{{ row.canOrder }}</p>
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
        <el-table-column align="center" label="商品管理" min-width="80">
          <template #default="{ row }">
            <p class="text-green-500" :class="{ 'text-red-700': row.canEditProduct != 'O' }">{{ row.canEditProduct }}
            </p>
          </template>
        </el-table-column>
        <el-table-column align="center" label="優惠管理" min-width="80">
          <template #default="{ row }">
            <p class="text-green-500" :class="{ 'text-red-700': row.canEditDiscount != 'O' }">{{ row.canEditDiscount }}
            </p>
          </template>
        </el-table-column>
        <el-table-column align="center" label="查看數據" min-width="80">
          <template #default="{ row }">
            <p class="text-green-500" :class="{ 'text-red-700': row.canCheckDataAnalysis != 'O' }">{{
              row.canCheckDataAnalysis }}
            </p>
          </template>
        </el-table-column>
        <el-table-column align="center" label="編輯權限" min-width="80">
          <template #default="{ row }">
            <p class="text-green-500" :class="{ 'text-red-700': row.canEditAuthority != 'O' }">{{ row.canEditAuthority
              }}</p>
          </template>
        </el-table-column>
      </el-table>
      <div class="w-full h-10 bg-gray-400 shadow-xl rounded-lg flex justify-around items-center mt-10">
        <p class="text-blue-800">{{ `共 ${authorityManagementStore.StaffList.length} 樣` }}</p>
        <div class="h-full flex items-center">
          <el-pagination v-model:current-page="staffCurrentPage" small background layout="prev, next"
            :total="authorityManagementStore.StaffList.length" @current-change="handleStaffCurrentChange" />
        </div>
        <p class="text-blue-800">{{ `${authorityManagementStore.StaffList.length > 0 ? staffCurrentPage : 0
          }/${Math.ceil(authorityManagementStore.StaffList.length / 10)}頁` }}</p>
      </div>
    </div>
  </div>
  <!-- 常用優惠 -->
  <div class="flex-[1]">
    <div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useAuthorityManagementStore } from '@/stores/authorityManagement'
const authorityManagementStore = useAuthorityManagementStore()

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
// 新增人員
const addStaff = () => {
  if (currentInputStaffId.value == '' || currentInputStaffName.value == '' || currentInputStaffJobTitle.value == '' || currentInputStaffAccount.value == '' || currentInputStaffPassword.value == '') {
    ElMessage.error('請輸入完整資訊')
    return
  }
  if (authorityManagementStore.StaffList.find((item) => item.id == currentInputStaffId.value)) {
    ElMessage.error('此Id已存在,請重新輸入')
    return
  }
  if (authorityManagementStore.StaffList.find((item) => item.account == currentInputStaffAccount.value)) {
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
    canOpenCashier: authorityCheckList.value.some(item => item.includes('canOpenCashier')) ? 'O' : 'X',
    canCheckOrder: authorityCheckList.value.some(item => item.includes('canCheckOrder')) ? 'O' : 'X',
    canEditProduct: authorityCheckList.value.some(item => item.includes('canEditProduct')) ? 'O' : 'X',
    canEditDiscount: authorityCheckList.value.some(item => item.includes('canEditDiscount')) ? 'O' : 'X',
    canCheckDataAnalysis: authorityCheckList.value.some(item => item.includes('canCheckDataAnalysis')) ? 'O' : 'X',
    canEditAuthority: authorityCheckList.value.some(item => item.includes('canEditAuthority')) ? 'O' : 'X',
  }
  authorityManagementStore.StaffList.push(addStaffForm)
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
        authorityManagementStore.StaffList = authorityManagementStore.StaffList.filter((item) => item.id !== currentStaff.value.id);
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
// 開啟控制編輯人員Dialog人員Dialog
const openEditStaffDialog = () => {
  currentEditInputStaffId.value = currentStaff.value.id
  currentEditInputStaffName.value = currentStaff.value.name
  currentEditInputStaffJobTitle.value = currentStaff.value.jobTitle
  currentEditInputStaffAccount.value = currentStaff.value.account
  currentEditInputStaffPassword.value = currentStaff.value.password
  editAuthorityCheckList.value = currentStaff.value.authorityCheckList
  editStaffDialog.value = true
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
    anotherId.value = (authorityManagementStore.StaffList.filter(item => item.id != currentStaff.value.id))
    if (anotherId.value.some(item => item.id == currentEditInputStaffId.value)) {
      ElMessage.error('此Id已存在,請重新輸入')
      return
    }
    const anotherAccount = ref([])
    anotherAccount.value = (authorityManagementStore.StaffList.filter(item => item.account != currentStaff.value.account))
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
  currentStaff.value.canOpenCashier = editAuthorityCheckList.value.some(item => item.includes('canOpenCashier')) ? 'O' : 'X'
  currentStaff.value.canCheckOrder = editAuthorityCheckList.value.some(item => item.includes('canCheckOrder')) ? 'O' : 'X'
  currentStaff.value.canEditProduct = editAuthorityCheckList.value.some(item => item.includes('canEditProduct')) ? 'O' : 'X'
  currentStaff.value.canEditDiscount = editAuthorityCheckList.value.some(item => item.includes('canEditDiscount')) ? 'O' : 'X'
  currentStaff.value.canCheckDataAnalysis = editAuthorityCheckList.value.some(item => item.includes('canCheckDataAnalysis')) ? 'O' : 'X'
  currentStaff.value.canEditAuthority = editAuthorityCheckList.value.some(item => item.includes('canEditAuthority')) ? 'O' : 'X'
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
  return authorityManagementStore.StaffList.slice((staffCurrentPage.value - 1) * 10, staffCurrentPage.value * 10)
})

</script>

<style lang="scss" scoped></style>