<template>
  <!-- 現金折扣券 -->
  <div class="flex-[1]">
    <div class="flex justify-between mt-2">
          <div class="ml-2 text-lg text-blue-800 font-bold border-b-2 border-solid border-black">現金折扣券</div>
          <div class="flex mr-2">
            <!-- 新增功能 -->
            <button @click="openAddMoneyDiscountDialog"
              class="px-2 border-2 border-solid border-black rounded-lg mx-1 text-md text-blue-800 font-bold bg-red-500 select-none active:bg-yellow-300">新增</button>
            <!-- 新增現金折扣券 -->
            <el-dialog v-model="addMoneyDiscountDialog" title="新增現金折扣券" width="500">
              <!-- 現金折扣券的Id -->
              <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
                折扣券的Id:<input v-model="currentInputId" type="number" min="1" step="1"
                  class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
                  placeholder="純數字,例如:1,2,3..." />
              </div>
              <!-- 現金折扣券名稱 -->
              <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
                折扣券名稱:<input v-model="currentInputName"
                  class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
                  placeholder="例如: $50折價券,$100折價券..." />
              </div>
              <!-- 現金折扣券折扣金額 -->
              <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
                折扣的金額:<input v-model="currentInputMoneyDiscount" type="number" min="1" step="1"
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
            <button @click="deleteDrinkMoneyDiscount"
              class="px-2 border-2 border-solid border-black rounded-lg mx-1 text-md text-blue-800 font-bold bg-red-500 select-none active:bg-yellow-300">刪除</button>
            <!-- 編輯功能 -->
            <button @click="openEditMoneyDiscountDialog"
              class="px-2 border-2 border-solid border-black rounded-lg mx-1 text-md text-blue-800 font-bold bg-red-500 select-none active:bg-yellow-300">編輯</button>
            <!-- 編輯現金折扣券 -->
            <el-dialog v-model="editMoneyDiscountDialog" title="編輯現金折扣券" width="500">
              <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
                折扣券的Id:<input v-model="currentEditInputId" type="number" min="1" step="1"
                  class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
                  placeholder="純數字,例如:1,2,3..." />
              </div>
              <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
                折扣券名稱:<input v-model="currentEditInputName"
                  class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
                  placeholder="例如: $50折價券,$100折價券..." />
              </div>
              <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
                折扣的金額:<input v-model="currentEditInputMoneyDiscount" type="number" min="1" step="1"
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
          <el-table class="cursor-pointer mt-2" :data="sliceMoneyDiscount" highlight-current-row height="440" empty-text="無現金折價券"
            @current-change="handleCurrentChange">
            <el-table-column align="center" type="index" label="序號" min-width="55" />
            <el-table-column align="center" label="Id" prop="id" min-width="55" />
            <el-table-column align="center" label="折價券名稱" prop="name" min-width="90" />
            <el-table-column align="center" label="折價金額" prop="discountMoney" min-width="100" />
          </el-table>
          <div class="w-full h-10 bg-gray-400 shadow-xl rounded-lg flex justify-around items-center mt-10">
            <p class="text-blue-800">{{ `共 ${discountStore.moneyDiscount.length} 樣` }}</p>
            <div class="h-full flex items-center">
              <el-pagination v-model:current-page="moneyDiscountCurrentPage" small background layout="prev, next"
                :total="discountStore.moneyDiscount.length" @current-change="handleMoneyDiscountCurrentChange" />
            </div>
            <p class="text-blue-800">{{ `${discountStore.moneyDiscount.length >0  ? moneyDiscountCurrentPage : 0 }/${Math.ceil(discountStore.moneyDiscount.length / 10)}頁` }}</p>
          </div>
        </div>   
  </div>
  
  <div class="flex-[1]"></div>
  <div class="flex-[1]"></div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import {useDiscountStore} from '@/stores/discount'
const discountStore = useDiscountStore()

// 現金折扣券相關功能
// 存放當前已選現金折扣券
const currentMoneyDiscount = ref({})
// 接收當前回傳的已選的類型
const handleCurrentChange = (row) => {
  currentMoneyDiscount.value = row
}
// 存放當前輸入的Id
const currentInputId = ref()
// 存放當前輸入的現金折扣券名稱
const currentInputName = ref('')
// 存放當前輸入的折扣金額
const currentInputMoneyDiscount = ref()
// 控制新增dialog視窗開關
const addMoneyDiscountDialog = ref(false)
// 開啟新增dialog視窗
const openAddMoneyDiscountDialog = () => {
  currentInputId.value = ''
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
const addDrinkMoneyDiscount = () => {
  if (currentInputId.value === '' || currentInputName.value === '' || currentInputMoneyDiscount.value === '') {
    ElMessage.error('請輸入完整資訊')
    return
  }
  if (discountStore.moneyDiscount.find((item) => item.id == currentInputId.value)) {
    ElMessage.error('此Id已存在,請重新輸入')
    return
  }
  if (discountStore.moneyDiscount.find((item) => item.name == currentInputName.value)) {
    ElMessage.error('此折扣券名稱,請重新輸入')
    return
  }
  const newDrinkMoneyDiscount = {
    id: currentInputId.value,
    name: currentInputName.value,
    discountMoney: currentInputMoneyDiscount.value,
  }
  discountStore.moneyDiscount.push(newDrinkMoneyDiscount)
  addMoneyDiscountDialog.value = false
  ElMessage.success('新增成功')
}
// 存放當前現金折扣券當前的頁數
const moneyDiscountCurrentPage = ref(1)
// 控制現金折扣券當前頁數
const handleMoneyDiscountCurrentChange = (page) => {
  moneyDiscountCurrentPage.value = page
}
// 計算並切換當前頁面內容
const sliceMoneyDiscount = computed(() => {
  return discountStore.moneyDiscount.slice((moneyDiscountCurrentPage.value - 1) * 10, moneyDiscountCurrentPage.value * 10)
})
// 刪除當前選擇的現金折扣券
const deleteDrinkMoneyDiscount = () => {
  if (currentMoneyDiscount.value.name ) {
    ElMessageBox.confirm(
      `是否刪除折扣券 ${currentMoneyDiscount.value.name} ?`,
      '警告',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
      .then(() => {
        discountStore.moneyDiscount = discountStore.moneyDiscount.filter((item) => item.id !== currentMoneyDiscount.value.id);
        ElMessage.success('刪除成功')
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
// 存放當前編輯輸入的Id
const currentEditInputId = ref()
// 存放當前編輯輸入的類型名稱
const currentEditInputName = ref('')
// 存放當前編輯輸入的類型代號
const currentEditInputMoneyDiscount = ref()
// 開啟編輯dialog視窗
const openEditMoneyDiscountDialog = () => {
  if (currentMoneyDiscount.value.name) {
    currentEditInputId.value = currentMoneyDiscount.value.id
    currentEditInputName.value = currentMoneyDiscount.value.name
    currentEditInputMoneyDiscount.value = currentMoneyDiscount.value.discountMoney
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
// 編輯茶品類型
const editDrinkMoneyDiscount = () => {
  if (currentEditInputId.value === '' || currentEditInputName.value === '' || currentEditInputMoneyDiscount.value === '') {
    ElMessage.error('請輸入完整資訊')
    return
  }
  if (currentEditInputId.value == currentMoneyDiscount.value.id && currentEditInputName.value == currentMoneyDiscount.value.name && currentEditInputMoneyDiscount.value == currentMoneyDiscount.value.type) {
    editMoneyDiscountDialog.value = false
    ElMessage.success('保存成功')
    return
  } else {
    const anotherId = ref([])
    anotherId.value = (discountStore.moneyDiscount.filter(item => item.id != currentMoneyDiscount.value.id))
    if (anotherId.value.some(item => item.id == currentEditInputId.value)) {
      ElMessage.error('此Id已存在,請重新輸入')
      return
    }
    const anotherName = ref([])
    anotherName.value = (discountStore.moneyDiscount.filter(item => item.name != currentMoneyDiscount.value.name))
    if (anotherName.value.some(item => item.name == currentEditInputName.value)) {
      ElMessage.error('此折價券名稱已存在,請重新輸入')
      return
    }
  }
  currentMoneyDiscount.value.id = currentEditInputId.value
  currentMoneyDiscount.value.name = currentEditInputName.value
  currentMoneyDiscount.value.discountMoney = currentEditInputMoneyDiscount.value
  editMoneyDiscountDialog.value = false
  ElMessage.success('保存成功')
}
</script>

<style lang="scss" scoped>

</style>