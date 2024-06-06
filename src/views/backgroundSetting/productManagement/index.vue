<template>
      <!-- 飲品類型 -->
      <div class="flex-[1]">
        <div class="flex justify-between mt-2">
          <div class="ml-2 text-lg text-blue-800 font-bold border-b-2 border-solid border-black">飲品類型</div>
          <div class="flex mr-2">
            <!-- 新增功能 -->
            <button @click="openAddTypeDialog"
              class="px-2 border-2 border-solid border-black rounded-lg mx-1 text-md text-blue-800 font-bold bg-red-500 select-none active:bg-yellow-300">新增</button>
            <!-- 新增飲品類型 -->
            <el-dialog v-model="addTypeDialog" title="新增飲品類型" width="500">
              <!-- 飲品類型的Id -->
              <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
                飲品類型的Id:<input v-model="currentInputId" type="number" min="1" step="1"
                  class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
                  placeholder="純數字,例如:1,2,3..." />
              </div>
              <!-- 飲品類型 -->
              <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
                飲品類型:<input v-model="currentInputName"
                  class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
                  placeholder="例如: 原味茶,芝芝系列..." />
              </div>
              <!-- 飲品類型的代號 -->
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
          <el-table class="cursor-pointer mt-2" :data="sliceDrinkType" highlight-current-row height="440" empty-text="無飲品類型"
            @current-change="handleCurrentChange">
            <el-table-column align="center" type="index" label="序號" min-width="55" />
            <el-table-column align="center" label="Id" prop="id" min-width="55" />
            <el-table-column align="center" label="類型" prop="name" min-width="90" />
            <el-table-column align="center" label="類型代號" prop="type" min-width="100" />
          </el-table>
          <div class="w-full h-10 bg-gray-400 shadow-xl rounded-lg flex justify-around items-center mt-10">
            <p class="text-blue-800">{{ `共 ${drinkStore.drinkType.length} 樣` }}</p>
            <div class="h-full flex items-center">
              <el-pagination v-model:current-page="drinkTypeCurrentPage" small background layout="prev, next"
                :total="drinkStore.drinkType.length" @current-change="handleDrinkTypeCurrentChange" />
            </div>
            <p class="text-blue-800">{{ `${drinkStore.drinkType.length >0  ? drinkTypeCurrentPage : 0 }/${Math.ceil(drinkStore.drinkType.length / 10)}頁` }}</p>
          </div>
        </div>
      </div>
      <!-- 飲料品項 -->
      <div class="flex-[1] border-x-2 border-solid border-black rounded-lg">
        <div class="flex justify-between mt-2">
          <div class="ml-2 text-lg text-blue-800 font-bold border-b-2 border-solid border-black">飲料品項</div>
          <div class="flex mr-2">
            <!-- 新增功能 -->
            <button @click="openAddDrinkDialog"
              class="px-2 border-2 border-solid border-black rounded-lg mx-1 text-md text-blue-800 font-bold bg-red-500 select-none active:bg-yellow-300">新增</button>
            <!-- 新增飲品類型 -->
            <el-dialog v-model="addDrinkDialog" title="新增飲料品項" width="500">
              <!-- 飲料品項的Id -->
              <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
                飲料品項的Id:<input v-model="currentDrinkInputId" type="number" min="1" step="1"
                  class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
                  placeholder="純數字,例如:1,2,3..." />
              </div>
              <!-- 飲料名稱 -->
              <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
                飲料名稱:<input v-model="currentDrinkInputName"
                  class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
                  placeholder="例如: 芝芝金萱,金萱雙Q..." />
              </div>
              <!-- 大杯價格 -->
              <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
                大杯價格:
                <div class="flex">
                  <el-switch v-model="setPriceL" @change="checkPriceLSwitch" active-text="有" inactive-text="無"
                    inline-prompt />
                  <input v-if="setPriceL" v-model="currentDrinkInputPriceL" type="number" min="1" step="1"
                    class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
                    placeholder="無此容器，請關左側開關" />
                  <div v-else class="w-[235px] border-2 border-solid border-black rounded-lg ml-2 text-center px-2">
                    none
                  </div>
                </div>
              </div>
              <!-- 瓶裝價格 -->
              <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
                瓶裝價格:
                <div class="flex">
                  <el-switch v-model="setPriceBottle" @change="checkPriceBottleSwitch" active-text="有" inactive-text="無"
                    inline-prompt />
                  <input v-if="setPriceBottle" v-model="currentDrinkInputPriceBottle" type="number" min="1" step="1"
                    class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
                    placeholder="無此容器，請關左側開關" />
                  <div v-else class="w-[235px] border-2 border-solid border-black rounded-lg ml-2 text-center px-2">
                    none
                  </div>
                </div>
              </div>
              <!-- 客製化 -->
              <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
                客製化:
                <el-select v-model="currentDrinkSelectCustomized" placeholder="請選擇飲料的客製化設定" style="width: 235px"
                  @change="checkAddDrinkSelectCustomized">
                  <el-option v-for="item in customized" :key="item.value" :label="item.label" :value="item.value">
                    <span style="float: left">{{ item.label }}</span>
                    <span style="
                    float: right;
                    color: var(--el-text-color-secondary);
                    font-size: 13px;
                  ">
                      {{ item.value }}
                    </span>
                  </el-option>
                </el-select>
              </div>
              <template #footer>
                <div class="dialog-footer">
                  <el-button @click="closeAddDrinkDialog">取消</el-button>
                  <el-button type="primary" @click="addDrink">
                    新增
                  </el-button>
                </div>
              </template>
            </el-dialog>
            <!-- 刪除功能 -->
            <button @click="deleteDrink"
              class="px-2 border-2 border-solid border-black rounded-lg mx-1 text-md text-blue-800 font-bold bg-red-500 select-none active:bg-yellow-300">刪除</button>
            <!-- 編輯功能 -->
            <button @click="openEditDrinkDialog"
              class="px-2 border-2 border-solid border-black rounded-lg mx-1 text-md text-blue-800 font-bold bg-red-500 select-none active:bg-yellow-300">編輯</button>
            <!-- 編輯飲品類型 -->
            <el-dialog v-model="editDrinkDialog" title="編輯飲料品項" width="500">
              <!-- 飲料品項的Id -->
              <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
                飲料品項的Id:<input v-model="currentEditDrinkInputId" type="number" min="1" step="1"
                  class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
                  placeholder="無此容器，請關左側開關" />
              </div>
              <!-- 飲料名稱 -->
              <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
                飲料名稱:<input v-model="currentEditDrinkInputName"
                  class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
                  placeholder="例如: 芝芝金萱,金萱雙Q..." />
              </div>
              <!-- 大杯價格 -->
              <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
                大杯價格:
                <div class="flex">
                  <el-switch v-model="setEditPriceL" active-text="有" inactive-text="無" inline-prompt
                    @change="checkEditPriceLSwitch" />
                  <input v-if="setEditPriceL" v-model="currentEditDrinkInputPriceL" type="number" min="1" step="1"
                    class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
                    placeholder="無此容器，請關左側開關" />
                  <div v-else class="w-[235px] border-2 border-solid border-black rounded-lg ml-2 text-center px-2">
                    none
                  </div>
                </div>
              </div>
              <!-- 瓶裝價格 -->
              <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
                瓶裝價格:
                <div class="flex">
                  <el-switch v-model="setEditPriceBottle" active-text="有" inactive-text="無" inline-prompt
                    @change="checkEditPriceBottleSwitch" />
                  <input v-if="setEditPriceBottle" v-model="currentEditDrinkInputPriceBottle" type="number" min="1"
                    step="1" class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
                    placeholder="純數字,例如:1,2,3..." />
                  <div v-else class="w-[235px] border-2 border-solid border-black rounded-lg ml-2 text-center px-2">
                    none
                  </div>
                </div>
              </div>
              <!-- 客製化 -->
              <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
                客製化:
                <el-select v-model="currentEditDrinkSelectCustomized" placeholder="請選擇飲料的客製化設定" style="width: 235px"
                  @change="checkEditDrinkSelectCustomized">
                  <el-option v-for="item in customized" :key="item.value" :label="item.label" :value="item.value">
                    <span style="float: left">{{ item.label }}</span>
                    <span style="
                    float: right;
                    color: var(--el-text-color-secondary);
                    font-size: 13px;
                  ">
                      {{ item.value }}
                    </span>
                  </el-option>
                </el-select>
              </div>
              <template #footer>
                <div class="dialog-footer">
                  <el-button @click="closeEditDrinkDialog">取消</el-button>
                  <el-button type="primary" @click="editDrink">
                    保存
                  </el-button>
                </div>
              </template>
            </el-dialog>
          </div>
        </div>
        <div>
          <el-table class="cursor-pointer mt-2" :data="sliceDrink" highlight-current-row height="440"
            empty-text="請先選擇飲品類型" @current-change="handleCurrentDrinkChange">
            <el-table-column align="center" type="index" label="序號" min-width="55" />
            <el-table-column align="center" label="Id" prop="id" min-width="55" />
            <el-table-column align="center" label="飲料名稱" prop="name" min-width="100" />
            <el-table-column align="center" label="大杯價格" prop="priceL" min-width="80" />
            <el-table-column align="center" label="瓶裝價格" prop="priceBottle" min-width="80" />
            <el-table-column align="center" label="客製化" prop="customized" min-width="70" />
          </el-table>
          <div class="w-full h-10 bg-gray-400 shadow-xl rounded-lg flex justify-around items-center mt-10">
            <p  class="text-blue-800">{{ `共 ${currentType.drinkList ?currentType.drinkList.length:0} 樣` }}
            </p>
            <div class="h-full flex items-center">
              <el-pagination v-if="currentType.drinkList" v-model:current-page="drinkCurrentPage" small background
                layout="prev, next" :total="currentType.drinkList.length" @current-change="handleDrinkCurrentChange" />
              <el-pagination v-else v-model:current-page="drinkCurrentPage" small background layout="prev, next"
                :total="0" />
            </div>
            <p v-if="currentType.drinkList" class="text-blue-800">{{
              `${drinkCurrentPage}/${Math.ceil(currentType.drinkList.length / 10)}頁` }}</p>
            <p v-else class="text-blue-800">0/0頁</p>
          </div>
        </div>
      </div>
      <!-- 配料 -->
      <div class="flex-[1]">
        <div class="flex justify-between mt-2">
          <div class="ml-2 text-lg text-blue-800 font-bold border-b-2 border-solid border-black">配料</div>
          <div class="flex mr-2">
            <!-- 新增功能 -->
            <button @click="openAddIngredientsDialog"
              class="px-2 border-2 border-solid border-black rounded-lg mx-1 text-md text-blue-800 font-bold bg-red-500 select-none active:bg-yellow-300">新增</button>
            <!-- 新增配料 -->
            <el-dialog v-model="addIngredientsDialog" title="新增配料" width="500">
              <!-- 配料的Id -->
              <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
                配料的Id:<input v-model="currentIngredientsInputId" type="number" min="1" step="1"
                  class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
                  placeholder="純數字,例如:1,2,3..." />
              </div>
              <!-- 配料名稱 -->
              <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
                配料名稱:<input v-model="currentIngredientsInputName"
                  class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
                  placeholder="例如: 波霸,雙Q果..." />
              </div>
              <!-- 配料的價錢 -->
              <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
                配料的價錢:<input v-model="currentIngredientsInputPrice" type="number" min="1" step="1"
                  class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
                  placeholder="純數字,例如:1,2,3..." />
              </div>
              <template #footer>
                <div class="dialog-footer">
                  <el-button @click="closeAddIngredientsDialog">取消</el-button>
                  <el-button type="primary" @click="addDrinkIngredients">
                    新增
                  </el-button>
                </div>
              </template>
            </el-dialog>
            <!-- 刪除功能 -->
            <button @click="deleteDrinkIngredients"
              class="px-2 border-2 border-solid border-black rounded-lg mx-1 text-md text-blue-800 font-bold bg-red-500 select-none active:bg-yellow-300">刪除</button>
            <!-- 編輯功能 -->
            <button @click="openEditIngredientsDialog"
              class="px-2 border-2 border-solid border-black rounded-lg mx-1 text-md text-blue-800 font-bold bg-red-500 select-none active:bg-yellow-300">編輯</button>
            <!-- 編輯配料 -->
            <el-dialog v-model="editIngredientsDialog" title="編輯配料" width="500">
              <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
                配料的Id:<input v-model="currentEditIngredientsInputId" type="number" min="1" step="1"
                  class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
                  placeholder="純數字,例如:1,2,3..." />
              </div>
              <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
                配料名稱:<input v-model="currentEditIngredientsInputName"
                  class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
                  placeholder="例如: 波霸,雙Q果..." />
              </div>
              <div class="w-4/5 flex justify-between items-center text-blue-800 text-lg font-bold my-2">
                配料的價錢:<input v-model="currentEditIngredientsInputPrice" type="number" min="1" step="1"
                  class="border-2 border-solid border-black rounded-lg ml-2 text-center px-2"
                  placeholder="純數字,例如:1,2,3..." />
              </div>
              <template #footer>
                <div class="dialog-footer">
                  <el-button @click="closeEditIngredientsDialog">取消</el-button>
                  <el-button type="primary" @click="editDrinkIngredients">
                    保存
                  </el-button>
                </div>
              </template>
            </el-dialog>
          </div>
        </div>
        <div>
          <el-table class="cursor-pointer mt-2" :data="sliceIngredients" highlight-current-row height="440"
            empty-text="無配料" @current-change="handleCurrentIngredientsChange">
            <el-table-column align="center" type="index" label="序號" min-width="55" />
            <el-table-column align="center" label="Id" prop="id" min-width="55" />
            <el-table-column align="center" label="配料名稱" prop="name" min-width="90" />
            <el-table-column align="center" label="價錢" prop="price" min-width="65" />
          </el-table>
          <div class="w-full h-10 bg-gray-400 shadow-xl rounded-lg flex justify-around items-center mt-10">
            <p class="text-blue-800">{{ `共 ${drinkStore.drinkAdd.length} 樣` }}</p>
            <div class="h-full flex items-center">
              <el-pagination v-model:current-page="drinkIngredientsCurrentPage" small background layout="prev, next"
                :total="drinkStore.drinkAdd.length" @current-change="handleIngredientsCurrentChange" />
            </div>
            <p class="text-blue-800">{{ `${drinkStore.drinkAdd.length > 0
              ? drinkIngredientsCurrentPage : 0}/${Math.ceil(drinkStore.drinkAdd.length / 10)}頁` }}
            </p>
          </div>
        </div>
      </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
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
    type: currentInputType.value,
    drinkList: []
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
  if(drinkStore.drinkType.length == 1){
    ElMessage.error('至少要留有一個飲料類型，需修改請善用編輯功能')
    return
  }
  if (currentType.value.name ) {
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
        drinkStore.drinkTypeMenu = ''
        drinkStore.drinkType = drinkStore.drinkType.filter((item) => item.id !== currentType.value.id);
          window.location.reload() 
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

// 飲料品項相關功能
// 存放當前已選的飲料品項
const currentDrink = ref({})
// 接收當前回傳的已選的飲料品項
const handleCurrentDrinkChange = (row) => {
  currentDrink.value = row
}
// 控制新增飲料品項dialog視窗開關
const addDrinkDialog = ref(false)
// 打開新增飲料品項dialog視窗
const openAddDrinkDialog = () => {
  if (currentType.value.name) {
    setPriceL.value = true
    setPriceBottle.value = true
    currentDrinkInputId.value = ''
    currentDrinkInputName.value = ''
    currentDrinkInputPriceL.value = ''
    currentDrinkInputPriceBottle.value = ''
    currentDrinkSelectCustomized.value = ''
    addDrinkDialog.value = true
  } else {
    ElMessageBox.alert('請先選擇要新增飲料品項的的飲品類型', '通知', {
      confirmButtonText: '繼續選擇',
      type: 'info',
    })
    return
  }
}
// 存放當前輸入的飲料品項Id
const currentDrinkInputId = ref('')
// 存放當前輸入的飲料品項名稱
const currentDrinkInputName = ref('')
// 存放當前輸入的飲料品項大杯價格
const currentDrinkInputPriceL = ref('')
// 存放當前輸入的飲料品項瓶裝價格
const currentDrinkInputPriceBottle = ref('')
// 存放當前客製化的選項
const currentDrinkSelectCustomized = ref('')
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
    ElMessage.error('容器僅限大杯,已關閉瓶裝價格輸入')
    return
  }
}
// 關閉新增飲料品項dialog視窗
const closeAddDrinkDialog = () => {
  addDrinkDialog.value = false
  ElMessage.error('取消操作')
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
    ElMessage.error('因為無客製化，容器僅限大杯,請調整客製化設定')
    return
  }
}
// 新增飲料品項
const addDrink = () => {
  if (currentDrinkInputId.value === '' || currentDrinkInputName.value === '' || currentDrinkInputPriceL.value === '' || currentDrinkInputPriceBottle.value === '' || currentDrinkSelectCustomized.value === '') {
    ElMessage.error('請輸入完整資訊')
    return
  }
  if (currentType.value.drinkList.find((item) => item.id == currentDrinkInputId.value)) {
    ElMessage.error('此Id已存在,請重新輸入')
    return
  }
  if (currentType.value.drinkList.find((item) => item.name == currentDrinkInputName.value)) {
    ElMessage.error('此飲料名稱已存在,請重新輸入')
    return
  }
  if (currentDrinkInputPriceL.value === 'none' && currentDrinkInputPriceBottle.value === 'none') {
    ElMessage.error('請至少選擇一種飲料容器，請重新輸入')
    return
  }
  if (setPriceL.value == true && currentDrinkInputPriceL.value === 'none') {
    ElMessage.error('大杯價格不可為空，請重新輸入')
    return
  }
  if (setPriceBottle.value == true && currentDrinkInputPriceBottle.value === 'none') {
    ElMessage.error('瓶裝價格不可為空，請重新輸入')
    return
  }
  if (currentDrinkSelectCustomized.value === 'none') {
    if (currentDrinkInputPriceBottle.value !== 'none' && setPriceBottle.value !== false) {
      setPriceL.value = true
      setPriceBottle.value = false
      currentDrinkInputPriceBottle.value = 'none'
      ElMessage.error('因為無客製化，容器僅限大杯,已關閉瓶裝價格輸入')
      return
    }
  }
  const newDrink = {
    id: currentDrinkInputId.value,
    name: currentDrinkInputName.value,
    priceL: currentDrinkInputPriceL.value,
    priceBottle: currentDrinkInputPriceBottle.value,
    customized: currentDrinkSelectCustomized.value
  }
  currentType.value.drinkList.push(newDrink)
  addDrinkDialog.value = false
  ElMessage.success('新增成功')
}
// 刪除當前選擇的飲料品項
const deleteDrink = () => {
  if (currentDrink.value != null && currentDrink.value.name) {
    ElMessageBox.confirm(
      `是否刪除飲料品項 ${currentDrink.value.name} ?`,
      '警告',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
      .then(() => {
        currentType.value.drinkList = currentType.value.drinkList.filter((item) => item.id !== currentDrink.value.id)
        ElMessage.success('刪除成功')
      })
      .catch(() => {
        ElMessage.error('取消操作');
      })
  } else {
    ElMessageBox.alert('請先選擇要刪除的飲料品項', '通知', {
      confirmButtonText: '繼續選擇',
      type: 'info',
    })
  }
}
// 存放當前編輯輸入的Id
const currentEditDrinkInputId = ref()
// 存放當前編輯輸入的飲料名稱
const currentEditDrinkInputName = ref('')
// 存放當前編輯輸入的大杯價格
const currentEditDrinkInputPriceL = ref()
// 存放當前編輯輸入的瓶裝價格
const currentEditDrinkInputPriceBottle = ref()
// 存放當前客製化的選項
const currentEditDrinkSelectCustomized = ref('')
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
    ElMessage.error('因為無客製化，容器僅限大杯,請調整客製化設定')
    return
  }
}
// 判定當前客製化選項是否為none
const checkEditDrinkSelectCustomized = () => {
  if (currentEditDrinkSelectCustomized.value === 'none') {
    setEditPriceL.value = true
    setEditPriceBottle.value = false
    currentEditDrinkInputPriceBottle.value = 'none'
    ElMessage.error('容器僅限大杯,已關閉瓶裝價格輸入')
    return
  }
}
// 控制編輯dialog視窗開關
const editDrinkDialog = ref(false)
// 關閉編輯dialog視窗
const closeEditDrinkDialog = () => {
  editDrinkDialog.value = false
  ElMessage.error('取消操作')
}
// 開啟編輯dialog視窗
const openEditDrinkDialog = () => {
  if (currentDrink.value != null && currentDrink.value.name) {
    currentEditDrinkInputId.value = currentDrink.value.id
    currentEditDrinkInputName.value = currentDrink.value.name
    setEditPriceL.value = currentDrink.value.priceL == 'none' ? false : true
    setEditPriceBottle.value = currentDrink.value.priceBottle == 'none' ? false : true
    currentEditDrinkInputPriceL.value = currentDrink.value.priceL == 'none' ? 'none' : currentDrink.value.priceL
    currentEditDrinkInputPriceBottle.value = currentDrink.value.priceBottle == 'none' ? 'none' : currentDrink.value.priceBottle
    currentEditDrinkSelectCustomized.value = currentDrink.value.customized
    editDrinkDialog.value = true
  } else {
    ElMessageBox.alert('請先選擇要編輯的飲料品項', '通知', {
      confirmButtonText: '繼續選擇',
      type: 'info',
    })
  }
}

// 編輯飲料品項
const editDrink = () => {
  if (currentEditDrinkInputId.value === '' || currentEditDrinkInputName.value === '' || currentEditDrinkInputPriceL.value === '' || currentEditDrinkInputPriceBottle.value === '' || currentEditDrinkSelectCustomized.value === '') {
    ElMessage.error('請輸入完整資訊')
    return
  }
  if (setEditPriceL.value == true && currentEditDrinkInputPriceL.value === 'none') {
    ElMessage.error('大杯價格不可為空，請重新輸入')
    return
  }
  if (setEditPriceBottle.value == true && currentEditDrinkInputPriceBottle.value === 'none') {
    ElMessage.error('瓶裝價格不可為空，請重新輸入')
    return
  }
  if (currentEditDrinkInputId.value == currentDrink.value.id && currentEditDrinkInputName.value == currentDrink.value.name && currentEditDrinkInputPriceL.value == currentDrink.value.priceL && currentEditDrinkInputPriceBottle.value == currentDrink.value.priceBottle && currentEditDrinkSelectCustomized.value == currentDrink.value.customized) {
    editDrinkDialog.value = false
    ElMessage.success('保存成功')
    return
  } else {
    const anotherId = ref([])
    anotherId.value = (currentType.value.drinkList.filter(item => item.id != currentDrink.value.id))
    if (anotherId.value.some(item => item.id == currentEditDrinkInputId.value)) {
      ElMessage.error('此Id已存在,請重新輸入')
      return
    }
    const anotherName = ref([])
    anotherName.value = (currentType.value.drinkList.filter(item => item.name != currentDrink.value.name))
    if (anotherName.value.some(item => item.name == currentEditDrinkInputName.value)) {
      ElMessage.error('此飲料名稱已存在,請重新輸入')
      return
    }
    if (currentEditDrinkInputPriceL.value == 'none' && currentEditDrinkInputPriceBottle.value == 'none') {
      ElMessage.error('請至少選擇一種飲料容器,請重新輸入')
      return
    }
    if (currentEditDrinkSelectCustomized.value === 'none') {
      if (currentEditDrinkInputPriceBottle.value !== 'none' && setPriceBottle.value !== false) {
        setEditPriceL.value = true
        setEditPriceBottle.value = false
        currentEditDrinkInputPriceBottle.value = 'none'
        ElMessage.error('因為無客製化，容器僅限大杯,已關閉瓶裝價格輸入')
        return
      }
    }
  }
  currentDrink.value.id = currentEditDrinkInputId.value
  currentDrink.value.name = currentEditDrinkInputName.value
  currentDrink.value.priceL = currentEditDrinkInputPriceL.value
  currentDrink.value.priceBottle = currentEditDrinkInputPriceBottle.value
  currentDrink.value.customized = currentEditDrinkSelectCustomized.value
  editDrinkDialog.value = false
  ElMessage.success('保存成功')
}
// 存放當前茶品類型當前的頁數
const drinkCurrentPage = ref(1)
// 控制茶品類型當前頁數
const handleDrinkCurrentChange = (page) => {
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

// 配料的相關功能
// 存放當前所選的配料選項
const currentIngredientsDrink = ref({})
// 接收當前回傳的已選的飲料品項
const handleCurrentIngredientsChange = (row) => {
  currentIngredientsDrink.value = row
}
// 控制新增配料dialog視窗開關
const addIngredientsDialog = ref(false)
// 打開新增配料dialog視窗
const openAddIngredientsDialog = () => {
  currentIngredientsInputId.value = ''
  currentIngredientsInputName.value = ''
  currentIngredientsInputPrice.value = ''
  addIngredientsDialog.value = true
}
// 關閉新增配料dialog視窗
const closeAddIngredientsDialog = () => {
  addIngredientsDialog.value = false
  ElMessage.error('取消操作')
}
// 存放當前輸入的配料Id
const currentIngredientsInputId = ref('')
// 存放當前輸入的配料名稱
const currentIngredientsInputName = ref('')
// 存放當前輸入的配料價格
const currentIngredientsInputPrice = ref('')
// 新增配料
const addDrinkIngredients = () => {
  if (currentIngredientsInputId.value === '' || currentIngredientsInputName.value === '' || currentIngredientsInputPrice.value === '') {
    ElMessage.error('請輸入完整資訊')
    return
  }
  if (drinkStore.drinkAdd.find((item) => item.id == currentIngredientsInputId.value)) {
    ElMessage.error('此Id已存在,請重新輸入')
    return
  }
  if (drinkStore.drinkAdd.find((item) => item.name == currentIngredientsInputName.value)) {
    ElMessage.error('此配料名稱已存在,請重新輸入')
    return
  }
  const newIngredients = {
    id: currentIngredientsInputId.value,
    name: currentIngredientsInputName.value,
    price: currentIngredientsInputPrice.value
  }
  drinkStore.drinkAdd.push(newIngredients)
  addIngredientsDialog.value = false
  ElMessage.success('新增成功')
}
// 刪除配料
const deleteDrinkIngredients = () => {
  if (currentIngredientsDrink.value.name) {
    ElMessageBox.confirm(
      `是否刪除配料 ${currentIngredientsDrink.value.name} ?`,
      '警告',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
      .then(() => {
        drinkStore.drinkAdd = drinkStore.drinkAdd.filter((item) => item.id !== currentIngredientsDrink.value.id)
        ElMessage.success('刪除成功')
      })
      .catch(() => {
        ElMessage.error('取消操作');
      })
  } else {
    ElMessageBox.alert('請先選擇要刪除的配料', '通知', {
      confirmButtonText: '繼續選擇',
      type: 'info',
    })
  }
}
// 控制編輯dialog視窗開關
const editIngredientsDialog = ref(false)
// 關閉編輯dialog視窗
const closeEditIngredientsDialog = () => {
  editIngredientsDialog.value = false
  ElMessage.error('取消操作')
}
// 存放當前編輯輸入的配料Id
const currentEditIngredientsInputId = ref('')
// 存放當前編輯輸入的配料名稱
const currentEditIngredientsInputName = ref('')
// 存放當前編輯輸入的配料價格
const currentEditIngredientsInputPrice = ref('')
// 開啟編輯dialog視窗
const openEditIngredientsDialog = () => {
  if (currentIngredientsDrink.value.name) {
    currentEditIngredientsInputId.value = currentIngredientsDrink.value.id
    currentEditIngredientsInputName.value = currentIngredientsDrink.value.name
    currentEditIngredientsInputPrice.value = currentIngredientsDrink.value.price
    editIngredientsDialog.value = true
  } else {
    ElMessageBox.alert('請先選擇要編輯的配料', '通知', {
      confirmButtonText: '繼續選擇',
      type: 'info',
    })
  }
}
// 編輯配料
const editDrinkIngredients = () => {
  if (currentEditIngredientsInputId.value === '' || currentEditIngredientsInputName.value === '' || currentEditIngredientsInputPrice.value === '') {
    ElMessage.error('請輸入完整資訊')
    return
  }
  if (currentEditIngredientsInputId.value == currentIngredientsDrink.value.id && currentEditIngredientsInputName.value == currentIngredientsDrink.value.name && currentEditIngredientsInputPrice.value == currentIngredientsDrink.value.price) {
    editIngredientsDialog.value = false
    ElMessage.success('保存成功')
    return
  } else {
    const anotherId = ref([])
    anotherId.value = (drinkStore.drinkAdd.filter(item => item.id != currentIngredientsDrink.value.id))
    if (anotherId.value.some(item => item.id == currentEditIngredientsInputId.value)) {
      ElMessage.error('此Id已存在,請重新輸入')
      return
    }
    const anotherName = ref([])
    anotherName.value = (drinkStore.drinkAdd.filter(item => item.name != currentIngredientsDrink.value.name))
    if (anotherName.value.some(item => item.name == currentEditIngredientsInputName.value)) {
      ElMessage.error('此配料名稱已存在,請重新輸入')
      return
    }
  }
  currentIngredientsDrink.value.id = currentEditIngredientsInputId.value
  currentIngredientsDrink.value.name = currentEditIngredientsInputName.value
  currentIngredientsDrink.value.price = currentEditIngredientsInputPrice.value
  editIngredientsDialog.value = false
  ElMessage.success('保存成功')
}
// 存放當前茶品類型當前的頁數
const drinkIngredientsCurrentPage = ref(1)
// 控制茶品類型當前頁數
const handleIngredientsCurrentChange = (page) => {
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
</script>

<style lang="scss" scoped>

</style>