<template>
  <div class="w-full flex items-center flex-col overflow-y-auto ">
    <div class="w-4/5 mt-10 flex flex-col items-center">
      <h1
        class="text-3xl text-white font-bold text-center border-2 border-solid border-black rounded-lg bg-red-500 px-2">
        後臺設定</h1>
      <div class="mt-5 flex">
        <div @click="settingStore.currentSettingPage = 0"
          class="px-2 border-2 border-solid border-black text-center mx-3 text-blue-800 bg-red-500 rounded-lg font-bold text-2xl cursor-pointer select-none"
          :class="{ 'bg-yellow-400': settingStore.currentSettingPage === 0 }">
          商品管理</div>
        <div @click="settingStore.currentSettingPage = 1"
          class="px-2 border-2 border-solid border-black text-center mx-3 text-blue-800 bg-red-500 rounded-lg font-bold text-2xl cursor-pointer select-none"
          :class="{ 'bg-yellow-400': settingStore.currentSettingPage === 1 }">
          優惠設定</div>
      </div>
    </div>
    <div class="w-4/5 h-[660px] mt-6 border-2 border-solid border-black rounded-lg flex ">
      <div class="flex-[1]">
        <div class="flex justify-between mt-2">
          <div class="ml-2 text-lg text-blue-800 font-bold border-b-2 border-solid border-black">飲品類型</div>
          <div class="flex mr-2">
            <!-- 新增功能 -->
            <button @click="openAddTypeDialog"
              class="px-2 border-2 border-solid border-black rounded-lg mx-1 text-md text-blue-800 font-bold bg-red-500 select-none active:bg-yellow-300">新增</button>
            <!-- 新增飲品類型 -->
            <el-dialog v-model="addTypeDialog" title="新增飲品類型" width="500">
              <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
                飲品類型的Id:<input v-model="currentInputId" type="number" min="1" step="1"
                  class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
                  placeholder="純數字,例如:1,2,3..." />
              </div>
              <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
                飲品類型:<input v-model="currentInputName"
                  class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
                  placeholder="例如: 原味茶,芝芝系列..." />
              </div>
              <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
                飲品類型的代號:<input v-model="currentInputType"
                  class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
                  placeholder="例如: drinkMilk..." />
              </div>
              <template #footer>
                <div class="dialog-footer">
                  <el-button @click="closeAddTypeDialog">取消</el-button>
                  <el-button type="primary" @click="addDrinkType">
                    新增
                  </el-button>
                </div>
              </template>
            </el-dialog>
            <!-- 刪除功能 -->
            <button @click="deleteDrinkType"
              class="px-2 border-2 border-solid border-black rounded-lg mx-1 text-md text-blue-800 font-bold bg-red-500 select-none active:bg-yellow-300">刪除</button>
            <!-- 編輯功能 -->
            <button @click="openEditTypeDialog"
              class="px-2 border-2 border-solid border-black rounded-lg mx-1 text-md text-blue-800 font-bold bg-red-500 select-none active:bg-yellow-300">編輯</button>
            <!-- 編輯飲品類型 -->
            <el-dialog v-model="editTypeDialog" title="編輯飲品類型" width="500">
              <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
                飲品類型的Id:<input v-model="currentEditInputId" type="number" min="1" step="1"
                  class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
                  placeholder="純數字,例如:1,2,3..." />
              </div>
              <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
                飲品類型:<input v-model="currentEditInputName"
                  class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
                  placeholder="例如: 原味茶,芝芝系列..." />
              </div>
              <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
                飲品類型的代號:<input v-model="currentEditInputType"
                  class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
                  placeholder="例如: drinkMilk..." />
              </div>
              <template #footer>
                <div class="dialog-footer">
                  <el-button @click="closeEditTypeDialog">取消</el-button>
                  <el-button type="primary" @click="editDrinkType">
                    保存
                  </el-button>
                </div>
              </template>
            </el-dialog>
          </div>
        </div>
        <div>
          <el-table class="cursor-pointer mt-2" :data="sliceDrinkType" highlight-current-row height="440"
            @current-change="handleCurrentChange">
            <el-table-column align="center" type="index" label="序號" width="80" />
            <el-table-column align="center" label="Id" prop="id" width="100" />
            <el-table-column align="center" label="類型" prop="name" min-width="100" />
            <el-table-column align="center" label="類型代號" prop="type" min-width="100" />
          </el-table>
          <div class="w-full h-10 bg-gray-400 shadow-xl rounded-lg flex justify-around items-center mt-10">
            <p class="text-blue-800">{{ `共 ${drinkStore.drinkType.length} 樣` }}</p>
            <div class="h-full flex items-center">
              <el-pagination v-model:current-page="drinkTypeCurrentPage" small background layout="prev, next"
                :total="drinkStore.drinkType.length" @current-change="handleDrinkTypeCurrentChange" />
            </div>
            <p class="text-blue-800">{{ `${drinkTypeCurrentPage}/${Math.ceil(drinkStore.drinkType.length / 10)}頁` }}</p>
          </div>
        </div>
      </div>
      <div class="flex-[1] bg-red-300"></div>
      <div class="flex-[1] bg-yellow-300"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'

import { useSettingStore } from '@/stores/setting'
const settingStore = useSettingStore()
import { useDrinkStore } from '@/stores/drink'
const drinkStore = useDrinkStore()

// 飲品類型相關功能
// 存放當前已選類型
const currentType = ref({})
// 接收當前回傳的已選的類型
const handleCurrentChange = (row) => {
  currentType.value = row
}
// 存放當前輸入的Id
const currentInputId = ref()
// 存放當前輸入的類型名稱
const currentInputName = ref('')
// 存放當前輸入的類型代號
const currentInputType = ref('')
// 控制新增dialog視窗開關
const addTypeDialog = ref(false)
// 開啟新增dialog視窗
const openAddTypeDialog = () => {
  currentInputId.value = ''
  currentInputName.value = ''
  currentInputType.value = ''
  addTypeDialog.value = true
}
// 關閉新增dialog視窗
const closeAddTypeDialog = () => {
  addTypeDialog.value = false
  ElMessage.error('取消操作')
}
// 新增茶品類型
const addDrinkType = () => {
  if (currentInputId.value === '' || currentInputName.value === '' || currentInputType.value === '') {
    ElMessage.error('請輸入完整資訊')
    return
  }
  if (drinkStore.drinkType.find((item) => item.id == currentInputId.value)) {
    ElMessage.error('此Id已存在,請重新輸入')
    return
  }
  if (drinkStore.drinkType.find((item) => item.name == currentInputName.value)) {
    ElMessage.error('此類型已存在,請重新輸入')
    return
  }
  if (drinkStore.drinkType.find((item) => item.type == currentInputType.value)) {
    ElMessage.error('此類型代碼已存在,請重新輸入')
    return
  }
  const newDrinkType = {
    id: currentInputId.value,
    name: currentInputName.value,
    type: currentInputType.value
  }
  drinkStore.drinkType.push(newDrinkType)
  addTypeDialog.value = false
  ElMessage.success('新增成功')
}
// 存放當前茶品類型當前的頁數
const drinkTypeCurrentPage = ref(1)
// 控制茶品類型當前頁數
const handleDrinkTypeCurrentChange = (page) => {
  drinkTypeCurrentPage.value = page
}
// 計算並切換當前頁面內容
const sliceDrinkType = computed(() => {
  return drinkStore.drinkType.slice((drinkTypeCurrentPage.value - 1) * 10, drinkTypeCurrentPage.value * 10)
})
// 刪除當前選擇的飲料類型
const deleteDrinkType = () => {
  if (currentType.value.name) {
    ElMessageBox.confirm(
      `是否刪除 ${currentType.value.name} 類型?`,
      '警告',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
      .then(() => {
        drinkStore.drinkType = drinkStore.drinkType.filter((item) => item.id !== currentType.value.id)
        ElMessage.success('刪除成功')
      })
      .catch(() => {
        ElMessage.error('取消操作');
      })
  } else {
    ElMessageBox.alert('請先選擇要刪除的類型', '通知', {
      confirmButtonText: '繼續選擇',
      type: 'info',
    })
  }
}
// 控制編輯dialog視窗開關
const editTypeDialog = ref(false)
// 存放當前編輯輸入的Id
const currentEditInputId = ref()
// 存放當前編輯輸入的類型名稱
const currentEditInputName = ref('')
// 存放當前編輯輸入的類型代號
const currentEditInputType = ref('')
// 開啟編輯dialog視窗
const openEditTypeDialog = () => {
  if (currentType.value.name) {
    currentEditInputId.value = currentType.value.id
    currentEditInputName.value = currentType.value.name
    currentEditInputType.value = currentType.value.type
    editTypeDialog.value = true
  } else {
    ElMessageBox.alert('請先選擇要編輯的類型', '通知', {
      confirmButtonText: '繼續選擇',
      type: 'info',
    })
  }
}
// 關閉編輯dialog視窗
const closeEditTypeDialog = () => {
  editTypeDialog.value = false
  ElMessage.error('取消操作')
}
// 編輯茶品類型
const editDrinkType = () => {
  if (currentEditInputId.value === '' || currentEditInputName.value === '' || currentEditInputType.value === '') {
    ElMessage.error('請輸入完整資訊')
    return
  }
  if (currentEditInputId.value == currentType.value.id && currentEditInputName.value == currentType.value.name && currentEditInputType.value == currentType.value.type) {
    editTypeDialog.value = false
    ElMessage.success('保存成功')
    return
  } else {
    const anotherId = ref([])
    anotherId.value = (drinkStore.drinkType.filter(item => item.id != currentType.value.id))
    if (anotherId.value.some(item => item.id == currentEditInputId.value)) {
      ElMessage.error('此Id已存在,請重新輸入')
      return
    }
    const anotherName = ref([])
    anotherName.value = (drinkStore.drinkType.filter(item => item.name != currentType.value.name))
    if (anotherName.value.some(item => item.name == currentEditInputName.value)) {
      ElMessage.error('此類型已存在,請重新輸入')
      return
    }
    const anotherType = ref([])
    anotherType.value = (drinkStore.drinkType.filter(item => item.type != currentType.value.type))
    if (anotherType.value.some(item => item.type == currentEditInputType.value)) {
      ElMessage.error('此類型代號已存在,請重新輸入')
      return
    }
  }
  currentType.value.id = currentEditInputId.value
  currentType.value.name = currentEditInputName.value
  currentType.value.type = currentEditInputType.value
  editTypeDialog.value = false
  ElMessage.success('保存成功')
}
</script>

<style scoped></style>