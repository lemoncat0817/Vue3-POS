<template>
  <div class="w-full flex flex-col p-4">
    <div
      class="flex items-center gap-1.5 rounded-xl bg-surface-100 dark:bg-surface-800 p-1 mb-4 self-start"
    >
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="rounded-lg px-4 py-2 text-xs lg:text-sm font-bold transition-all select-none"
        :class="
          activeTab === tab.key
            ? 'bg-white dark:bg-surface-900 text-primary-600 dark:text-primary-400 shadow-sm'
            : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200'
        "
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 分類 -->
    <div v-if="activeTab === 'categories'" class="flex flex-col">
      <div
        class="flex items-center justify-between pb-3 mb-3 border-b border-surface-100 dark:border-surface-800"
      >
        <span class="text-sm font-black text-surface-900 dark:text-surface-100">分類</span>
        <button
          type="button"
          class="pos-btn pos-btn-primary px-3 py-1.5 text-xs"
          :class="{ 'opacity-50 pointer-events-none': !canSetCategory }"
          @click="openAddCategoryDialog"
        >
          ＋ 新增分類
        </button>
      </div>

      <div
        class="overflow-hidden rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm min-h-[540px] flex flex-col justify-between"
      >
        <div class="overflow-x-auto flex-1">
          <table class="w-full text-left text-sm">
            <thead
              class="border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400"
            >
              <tr>
                <th class="px-4 py-3.5 text-left">名稱</th>
                <th class="px-4 py-3.5 text-center">品項數</th>
                <th class="px-4 py-3.5 text-center">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
              <tr v-if="sliceCategories.length === 0">
                <td
                  colspan="3"
                  class="px-4 py-16 text-center text-surface-400 dark:text-surface-500"
                >
                  <div class="flex flex-col items-center justify-center gap-2">
                    <FolderTree class="h-10 w-10 text-surface-300 dark:text-surface-700" />
                    <span class="text-base font-semibold text-surface-700 dark:text-surface-300"
                      >無分類</span
                    >
                    <span class="text-xs text-surface-400 dark:text-surface-500"
                      >尚未建立分類，可點選上方「＋ 新增分類」</span
                    >
                  </div>
                </td>
              </tr>
              <tr
                v-for="row in sliceCategories"
                :key="row.id"
                class="transition-colors hover:bg-surface-50/80 dark:hover:bg-surface-800/40"
              >
                <td
                  class="px-4 py-3.5 align-middle text-left font-bold text-surface-900 dark:text-surface-100"
                >
                  {{ row.name }}
                </td>
                <td class="px-4 py-3.5 align-middle text-center font-mono text-surface-500">
                  {{ productCountOf(row.id) }}
                </td>
                <td class="px-4 py-3.5 align-middle text-center">
                  <div class="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      class="pos-btn pos-btn-secondary px-2.5 py-1 text-xs"
                      :class="{ 'opacity-50 pointer-events-none': !canSetCategory }"
                      @click="openEditCategoryDialog(row)"
                    >
                      編輯
                    </button>
                    <button
                      type="button"
                      class="pos-btn pos-btn-danger px-2.5 py-1 text-xs"
                      :class="{ 'opacity-50 pointer-events-none': !canSetCategory }"
                      @click="removeCategory(row)"
                    >
                      刪除
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <TablePagination
          :page="categoryPage"
          :page-count="categoryPageCount"
          :total="catalogStore.categories.length"
          :current-count="sliceCategories.length"
          unit="個分類"
          @update:page="(v) => (categoryPage = v)"
        />
      </div>
    </div>

    <!-- 品項 -->
    <div v-if="activeTab === 'products'" class="flex flex-col">
      <div
        class="flex items-center justify-between pb-3 mb-3 border-b border-surface-100 dark:border-surface-800"
      >
        <span class="text-sm font-black text-surface-900 dark:text-surface-100">品項</span>
        <button
          type="button"
          class="pos-btn pos-btn-primary px-3 py-1.5 text-xs"
          :class="{ 'opacity-50 pointer-events-none': !canSetProduct }"
          @click="openAddProductDialog"
        >
          ＋ 新增品項
        </button>
      </div>

      <div
        class="overflow-hidden rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm min-h-[540px] flex flex-col justify-between"
      >
        <div class="overflow-x-auto flex-1">
          <table class="w-full text-left text-sm">
            <thead
              class="border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400"
            >
              <tr>
                <th class="px-4 py-3.5 text-left">名稱</th>
                <th class="px-4 py-3.5 text-left">分類</th>
                <th class="px-4 py-3.5 text-right">底價</th>
                <th class="px-4 py-3.5 text-left">規格群組</th>
                <th class="px-4 py-3.5 text-center">庫存</th>
                <th class="px-4 py-3.5 text-center">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
              <tr v-if="sliceProducts.length === 0">
                <td
                  colspan="6"
                  class="px-4 py-16 text-center text-surface-400 dark:text-surface-500"
                >
                  <div class="flex flex-col items-center justify-center gap-2">
                    <Package class="h-10 w-10 text-surface-300 dark:text-surface-700" />
                    <span class="text-base font-semibold text-surface-700 dark:text-surface-300"
                      >無品項</span
                    >
                    <span class="text-xs text-surface-400 dark:text-surface-500"
                      >尚未建立品項，可點選上方「＋ 新增品項」</span
                    >
                  </div>
                </td>
              </tr>
              <tr
                v-for="row in sliceProducts"
                :key="row.id"
                class="transition-colors hover:bg-surface-50/80 dark:hover:bg-surface-800/40"
              >
                <td
                  class="px-4 py-3.5 align-middle text-left font-bold text-surface-900 dark:text-surface-100"
                >
                  {{ row.name }}
                </td>
                <td
                  class="px-4 py-3.5 align-middle text-left text-surface-600 dark:text-surface-300"
                >
                  {{ categoryNameOf(row.categoryId) }}
                </td>
                <td
                  class="px-4 py-3.5 align-middle text-right font-mono font-bold text-surface-800 dark:text-surface-200"
                >
                  ${{ row.basePrice }}
                </td>
                <td
                  class="px-4 py-3.5 align-middle text-left text-surface-500 max-w-[160px] truncate"
                  :title="modifierGroupNamesOf(row).join('、')"
                >
                  {{ modifierGroupNamesOf(row).join('、') || '無' }}
                </td>
                <td class="px-4 py-3.5 align-middle text-center" :class="stockClass(row.stock)">
                  {{ stockLabel(row.stock) }}
                </td>
                <td class="px-4 py-3.5 align-middle text-center">
                  <div class="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      class="pos-btn pos-btn-secondary px-2.5 py-1 text-xs"
                      :class="{ 'opacity-50 pointer-events-none': !canSetProduct }"
                      @click="openEditProductDialog(row)"
                    >
                      編輯
                    </button>
                    <button
                      type="button"
                      class="pos-btn pos-btn-danger px-2.5 py-1 text-xs"
                      :class="{ 'opacity-50 pointer-events-none': !canSetProduct }"
                      @click="removeProduct(row)"
                    >
                      刪除
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <TablePagination
          :page="productPage"
          :page-count="productPageCount"
          :total="catalogStore.products.length"
          :current-count="sliceProducts.length"
          unit="個品項"
          @update:page="(v) => (productPage = v)"
        />
      </div>
    </div>

    <!-- 規格群組 -->
    <div v-if="activeTab === 'modifierGroups'" class="flex flex-col">
      <div
        class="flex items-center justify-between pb-3 mb-3 border-b border-surface-100 dark:border-surface-800"
      >
        <span class="text-sm font-black text-surface-900 dark:text-surface-100">規格群組</span>
        <button
          type="button"
          class="pos-btn pos-btn-primary px-3 py-1.5 text-xs"
          :class="{ 'opacity-50 pointer-events-none': !canSetProduct }"
          @click="openAddModifierGroupDialog"
        >
          ＋ 新增規格群組
        </button>
      </div>

      <div
        class="overflow-hidden rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm min-h-[540px] flex flex-col justify-between"
      >
        <div class="overflow-x-auto flex-1">
          <table class="w-full text-left text-sm">
            <thead
              class="border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400"
            >
              <tr>
                <th class="px-4 py-3.5 text-left">名稱</th>
                <th class="px-4 py-3.5 text-center">選擇方式</th>
                <th class="px-4 py-3.5 text-center">必選</th>
                <th class="px-4 py-3.5 text-left">選項</th>
                <th class="px-4 py-3.5 text-center">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
              <tr v-if="sliceModifierGroups.length === 0">
                <td
                  colspan="5"
                  class="px-4 py-16 text-center text-surface-400 dark:text-surface-500"
                >
                  <div class="flex flex-col items-center justify-center gap-2">
                    <Sliders class="h-10 w-10 text-surface-300 dark:text-surface-700" />
                    <span class="text-base font-semibold text-surface-700 dark:text-surface-300"
                      >無規格群組</span
                    >
                    <span class="text-xs text-surface-400 dark:text-surface-500"
                      >尚未建立規格群組，可點選上方「＋ 新增規格群組」</span
                    >
                  </div>
                </td>
              </tr>
              <tr
                v-for="row in sliceModifierGroups"
                :key="row.id"
                class="transition-colors hover:bg-surface-50/80 dark:hover:bg-surface-800/40"
              >
                <td
                  class="px-4 py-3.5 align-middle text-left font-bold text-surface-900 dark:text-surface-100"
                >
                  {{ row.name }}
                </td>
                <td
                  class="px-4 py-3.5 align-middle text-center text-surface-600 dark:text-surface-300"
                >
                  {{ row.selectionType === 'single' ? '單選' : '多選' }}
                </td>
                <td class="px-4 py-3.5 align-middle text-center">
                  <span
                    class="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold"
                    :class="
                      row.required
                        ? 'bg-danger-50 text-danger-600 dark:bg-danger-950/40 dark:text-danger-400'
                        : 'bg-surface-100 text-surface-500 dark:bg-surface-800'
                    "
                  >
                    {{ row.required ? '必選' : '選填' }}
                  </span>
                </td>
                <td
                  class="px-4 py-3.5 align-middle text-left text-surface-500 max-w-[220px] truncate"
                  :title="optionSummary(row)"
                >
                  {{ optionSummary(row) }}
                </td>
                <td class="px-4 py-3.5 align-middle text-center">
                  <div class="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      class="pos-btn pos-btn-secondary px-2.5 py-1 text-xs"
                      :class="{ 'opacity-50 pointer-events-none': !canSetProduct }"
                      @click="openEditModifierGroupDialog(row)"
                    >
                      編輯
                    </button>
                    <button
                      type="button"
                      class="pos-btn pos-btn-danger px-2.5 py-1 text-xs"
                      :class="{ 'opacity-50 pointer-events-none': !canSetProduct }"
                      @click="removeModifierGroup(row)"
                    >
                      刪除
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <TablePagination
          :page="modifierGroupPage"
          :page-count="modifierGroupPageCount"
          :total="catalogStore.modifierGroups.length"
          :current-count="sliceModifierGroups.length"
          unit="組規格群組"
          @update:page="(v) => (modifierGroupPage = v)"
        />
      </div>
    </div>

    <!-- 加購選項 -->
    <div v-if="activeTab === 'addOns'" class="flex flex-col">
      <div
        class="flex items-center justify-between pb-3 mb-3 border-b border-surface-100 dark:border-surface-800"
      >
        <span class="text-sm font-black text-surface-900 dark:text-surface-100">加購選項</span>
        <button
          type="button"
          class="pos-btn pos-btn-primary px-3 py-1.5 text-xs"
          :class="{ 'opacity-50 pointer-events-none': !canSetAddOns }"
          @click="openAddAddOnDialog"
        >
          ＋ 新增加購選項
        </button>
      </div>

      <div
        class="overflow-hidden rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm min-h-[540px] flex flex-col justify-between"
      >
        <div class="overflow-x-auto flex-1">
          <table class="w-full text-left text-sm">
            <thead
              class="border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400"
            >
              <tr>
                <th class="px-4 py-3.5 text-left">名稱</th>
                <th class="px-4 py-3.5 text-right">價錢</th>
                <th class="px-4 py-3.5 text-center">庫存</th>
                <th class="px-4 py-3.5 text-center">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
              <tr v-if="sliceAddOns.length === 0">
                <td
                  colspan="4"
                  class="px-4 py-16 text-center text-surface-400 dark:text-surface-500"
                >
                  <div class="flex flex-col items-center justify-center gap-2">
                    <PlusCircle class="h-10 w-10 text-surface-300 dark:text-surface-700" />
                    <span class="text-base font-semibold text-surface-700 dark:text-surface-300"
                      >無加購選項</span
                    >
                    <span class="text-xs text-surface-400 dark:text-surface-500"
                      >尚未建立加購選項，可點選上方「＋ 新增加購選項」</span
                    >
                  </div>
                </td>
              </tr>
              <tr
                v-for="row in sliceAddOns"
                :key="row.id"
                class="transition-colors hover:bg-surface-50/80 dark:hover:bg-surface-800/40"
              >
                <td
                  class="px-4 py-3.5 align-middle text-left font-bold text-surface-900 dark:text-surface-100"
                >
                  {{ row.name }}
                </td>
                <td
                  class="px-4 py-3.5 align-middle text-right font-mono font-bold text-primary-600 dark:text-primary-400"
                >
                  ${{ row.price }}
                </td>
                <td class="px-4 py-3.5 align-middle text-center" :class="stockClass(row.stock)">
                  {{ stockLabel(row.stock) }}
                </td>
                <td class="px-4 py-3.5 align-middle text-center">
                  <div class="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      class="pos-btn pos-btn-secondary px-2.5 py-1 text-xs"
                      :class="{ 'opacity-50 pointer-events-none': !canSetAddOns }"
                      @click="openEditAddOnDialog(row)"
                    >
                      編輯
                    </button>
                    <button
                      type="button"
                      class="pos-btn pos-btn-danger px-2.5 py-1 text-xs"
                      :class="{ 'opacity-50 pointer-events-none': !canSetAddOns }"
                      @click="removeAddOn(row)"
                    >
                      刪除
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <TablePagination
          :page="addOnPage"
          :page-count="addOnPageCount"
          :total="catalogStore.addOns.length"
          :current-count="sliceAddOns.length"
          unit="個加購選項"
          @update:page="(v) => (addOnPage = v)"
        />
      </div>
    </div>

    <!-- 分類新增/編輯 -->
    <ModalDialog
      v-model:open="categoryDialog.open"
      :title="categoryDialog.editingId ? '編輯分類' : '新增分類'"
    >
      <div class="flex flex-col gap-3 py-2">
        <label class="flex flex-col gap-1 text-xs font-bold text-surface-600 dark:text-surface-300">
          分類名稱
          <input
            v-model="categoryDialog.name"
            class="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 outline-none focus:border-primary-500"
            placeholder="例如: 主餐、飲品..."
          />
        </label>
      </div>
      <div class="mt-4 flex justify-end gap-2">
        <button
          type="button"
          class="rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-sm font-bold text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800"
          @click="categoryDialog.open = false"
        >
          取消
        </button>
        <button
          type="button"
          class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700"
          @click="submitCategory"
        >
          {{ categoryDialog.editingId ? '保存' : '新增' }}
        </button>
      </div>
    </ModalDialog>

    <!-- 品項新增/編輯 -->
    <ModalDialog
      v-model:open="productDialog.open"
      :title="productDialog.editingId ? '編輯品項' : '新增品項'"
      size="lg"
    >
      <div class="flex flex-col gap-3.5 py-2">
        <label class="flex flex-col gap-1 text-xs font-bold text-surface-600 dark:text-surface-300">
          品項名稱
          <input
            v-model="productDialog.name"
            class="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 outline-none focus:border-primary-500"
            placeholder="例如: 招牌牛肉漢堡..."
          />
        </label>
        <div class="grid grid-cols-2 gap-3">
          <label
            class="flex flex-col gap-1 text-xs font-bold text-surface-600 dark:text-surface-300"
          >
            分類
            <select
              v-model="productDialog.categoryId"
              class="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 outline-none"
            >
              <option value="">請選擇分類</option>
              <option v-for="c in catalogStore.categories" :key="c.id" :value="String(c.id)">
                {{ c.name }}
              </option>
            </select>
          </label>
          <label
            class="flex flex-col gap-1 text-xs font-bold text-surface-600 dark:text-surface-300"
          >
            底價
            <input
              v-model="productDialog.basePrice"
              type="number"
              min="0"
              step="1"
              class="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 outline-none font-mono"
              placeholder="純數字"
            />
          </label>
        </div>
        <label class="flex flex-col gap-1 text-xs font-bold text-surface-600 dark:text-surface-300">
          庫存
          <input
            v-model="productDialog.stock"
            type="number"
            min="0"
            step="1"
            class="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 outline-none font-mono"
            placeholder="留空代表不追蹤庫存"
          />
        </label>
        <div class="flex flex-col gap-1 text-xs font-bold text-surface-600 dark:text-surface-300">
          規格群組（可複選）
          <div class="flex flex-wrap gap-1.5 mt-1">
            <label
              v-for="group in catalogStore.modifierGroups"
              :key="group.id"
              class="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 cursor-pointer select-none"
              :class="
                productDialog.modifierGroupIds.includes(String(group.id))
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300'
                  : 'border-surface-200 dark:border-surface-700'
              "
            >
              <input
                type="checkbox"
                class="rounded text-primary-600"
                :checked="productDialog.modifierGroupIds.includes(String(group.id))"
                @change="toggleProductModifierGroup(group.id)"
              />
              {{ group.name }}
            </label>
            <span v-if="catalogStore.modifierGroups.length === 0" class="text-surface-400 text-xs"
              >尚未建立規格群組</span
            >
          </div>
        </div>
      </div>
      <div class="mt-4 flex justify-end gap-2">
        <button
          type="button"
          class="rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-sm font-bold text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800"
          @click="productDialog.open = false"
        >
          取消
        </button>
        <button
          type="button"
          class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700"
          @click="submitProduct"
        >
          {{ productDialog.editingId ? '保存' : '新增' }}
        </button>
      </div>
    </ModalDialog>

    <!-- 規格群組新增/編輯 -->
    <ModalDialog
      v-model:open="modifierGroupDialog.open"
      :title="modifierGroupDialog.editingId ? '編輯規格群組' : '新增規格群組'"
      size="lg"
    >
      <div class="flex flex-col gap-3.5 py-2">
        <label class="flex flex-col gap-1 text-xs font-bold text-surface-600 dark:text-surface-300">
          群組名稱
          <input
            v-model="modifierGroupDialog.name"
            class="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 outline-none focus:border-primary-500"
            placeholder="例如: 甜度、熟度、容器大小..."
          />
        </label>
        <div class="grid grid-cols-2 gap-3">
          <label
            class="flex flex-col gap-1 text-xs font-bold text-surface-600 dark:text-surface-300"
          >
            選擇方式
            <select
              v-model="modifierGroupDialog.selectionType"
              class="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 outline-none"
            >
              <option value="single">單選</option>
              <option value="multiple">多選</option>
            </select>
          </label>
          <label
            class="flex items-center gap-2 text-xs font-bold text-surface-600 dark:text-surface-300 mt-5"
          >
            <input
              v-model="modifierGroupDialog.required"
              type="checkbox"
              class="rounded text-primary-600"
            />
            點餐時必選
          </label>
        </div>
        <div class="flex flex-col gap-2">
          <div
            class="flex items-center justify-between text-xs font-bold text-surface-600 dark:text-surface-300"
          >
            <span>選項</span>
            <button
              type="button"
              class="pos-btn pos-btn-secondary px-2 py-1 text-xs"
              @click="addModifierOptionRow"
            >
              ＋ 新增選項
            </button>
          </div>
          <div
            v-for="(option, index) in modifierGroupDialog.options"
            :key="index"
            class="flex items-center gap-2"
          >
            <input
              v-model="option.name"
              class="flex-1 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-1.5 text-sm text-surface-900 dark:text-surface-100 outline-none"
              placeholder="選項名稱，例如：大杯"
            />
            <input
              v-model="option.priceDelta"
              type="number"
              step="1"
              class="w-28 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-1.5 text-sm text-surface-900 dark:text-surface-100 outline-none font-mono"
              placeholder="加減價"
            />
            <button
              type="button"
              class="rounded-lg border border-danger-200 px-2 py-1.5 text-xs font-bold text-danger-600 hover:bg-danger-50 dark:border-danger-800 dark:text-danger-400"
              @click="modifierGroupDialog.options.splice(index, 1)"
            >
              移除
            </button>
          </div>
          <p v-if="modifierGroupDialog.options.length === 0" class="text-xs text-surface-400">
            尚未新增任何選項
          </p>
        </div>
      </div>
      <div class="mt-4 flex justify-end gap-2">
        <button
          type="button"
          class="rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-sm font-bold text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800"
          @click="modifierGroupDialog.open = false"
        >
          取消
        </button>
        <button
          type="button"
          class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700"
          @click="submitModifierGroup"
        >
          {{ modifierGroupDialog.editingId ? '保存' : '新增' }}
        </button>
      </div>
    </ModalDialog>

    <!-- 加購選項新增/編輯 -->
    <ModalDialog
      v-model:open="addOnDialog.open"
      :title="addOnDialog.editingId ? '編輯加購選項' : '新增加購選項'"
    >
      <div class="flex flex-col gap-3.5 py-2">
        <label class="flex flex-col gap-1 text-xs font-bold text-surface-600 dark:text-surface-300">
          名稱
          <input
            v-model="addOnDialog.name"
            class="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 outline-none focus:border-primary-500"
            placeholder="例如: 加起司、珍珠..."
          />
        </label>
        <label class="flex flex-col gap-1 text-xs font-bold text-surface-600 dark:text-surface-300">
          價錢
          <input
            v-model="addOnDialog.price"
            type="number"
            min="0"
            step="1"
            class="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 outline-none font-mono"
            placeholder="純數字"
          />
        </label>
        <label class="flex flex-col gap-1 text-xs font-bold text-surface-600 dark:text-surface-300">
          庫存
          <input
            v-model="addOnDialog.stock"
            type="number"
            min="0"
            step="1"
            class="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 outline-none font-mono"
            placeholder="留空代表不追蹤庫存"
          />
        </label>
      </div>
      <div class="mt-4 flex justify-end gap-2">
        <button
          type="button"
          class="rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-sm font-bold text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800"
          @click="addOnDialog.open = false"
        >
          取消
        </button>
        <button
          type="button"
          class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700"
          @click="submitAddOn"
        >
          {{ addOnDialog.editingId ? '保存' : '新增' }}
        </button>
      </div>
    </ModalDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { FolderTree, Package, PlusCircle, Sliders } from 'lucide-vue-next'
import ModalDialog from '@/components/ui/ModalDialog.vue'
import TablePagination from '@/components/ui/TablePagination.vue'
import { alert, confirm } from '@/composables/useConfirm'
import { showToast } from '@/composables/useToast'
import { useCatalogStore } from '@/stores/catalog'
const catalogStore = useCatalogStore()
import { useLoginStore } from '@/stores/login'
const loginStore = useLoginStore()
import type { AddOnOption, Category, ModifierGroup, ModifierSelectionType, Product } from '@/types'
import { hasCapability } from '@/utils/selection'
import { ApiError } from '@/api/http'
import {
  createAddOnOption,
  createCategory,
  createModifierGroup,
  createProduct,
  deleteAddOnOption,
  deleteCategory,
  deleteModifierGroup,
  deleteProduct,
  updateAddOnOption,
  updateCategory,
  updateModifierGroup,
  updateProduct
} from '@/api/catalog'

function apiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 409) return '這個分類底下還有品項，請先清空品項再刪除'
    return `操作失敗：${err.message}`
  }
  return '連不上伺服端，請確認網路連線'
}
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

const canSetCategory = computed(() => hasCapability(loginStore.userInfo, 'canSetCategory'))
const canSetProduct = computed(() => hasCapability(loginStore.userInfo, 'canSetProduct'))
const canSetAddOns = computed(() => hasCapability(loginStore.userInfo, 'canSetAddOns'))

const tabs = [
  { key: 'categories', label: '分類' },
  { key: 'products', label: '品項' },
  { key: 'modifierGroups', label: '規格群組' },
  { key: 'addOns', label: '加購選項' }
] as const
const activeTab = ref<(typeof tabs)[number]['key']>('categories')

// ---------- 分類 ----------
const categoryPage = ref(1)
const categoryPageCount = computed(() =>
  Math.max(Math.ceil(catalogStore.categories.length / 10), 1)
)
const sliceCategories = computed(() =>
  catalogStore.categories.slice((categoryPage.value - 1) * 10, categoryPage.value * 10)
)
const productCountOf = (categoryId: Category['id']) =>
  catalogStore.products.filter((p) => String(p.categoryId) === String(categoryId)).length

const categoryDialog = reactive<{ open: boolean; editingId: Category['id'] | null; name: string }>({
  open: false,
  editingId: null,
  name: ''
})
function openAddCategoryDialog() {
  categoryDialog.editingId = null
  categoryDialog.name = ''
  categoryDialog.open = true
}
function openEditCategoryDialog(row: Category) {
  categoryDialog.editingId = row.id
  categoryDialog.name = row.name
  categoryDialog.open = true
}
async function submitCategory() {
  if (categoryDialog.name.trim() === '') {
    showToast('請輸入分類名稱', 'error')
    return
  }
  if (
    catalogStore.categories.some(
      (item) => item.name === categoryDialog.name && item.id !== categoryDialog.editingId
    )
  ) {
    showToast('此分類已存在,請重新輸入', 'error')
    return
  }
  try {
    if (categoryDialog.editingId === null) {
      const created = await createCategory({ name: categoryDialog.name })
      catalogStore.categories.push({ id: created.id, name: created.name })
    } else {
      const updated = await updateCategory(String(categoryDialog.editingId), {
        name: categoryDialog.name
      })
      const target = catalogStore.categories.find((item) => item.id === categoryDialog.editingId)
      if (target) target.name = updated.name
    }
    categoryDialog.open = false
    showToast(categoryDialog.editingId === null ? '新增成功' : '保存成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
async function removeCategory(row: Category) {
  const result = await confirm({
    title: '警告',
    description: `是否刪除分類 ${row.name}？`,
    variant: 'danger'
  })
  if (result !== 'confirm') return
  try {
    await deleteCategory(String(row.id))
    catalogStore.categories = catalogStore.categories.filter((item) => item.id !== row.id)
    showToast('刪除成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}

// ---------- 品項 ----------
const productPage = ref(1)
const productPageCount = computed(() => Math.max(Math.ceil(catalogStore.products.length / 10), 1))
const sliceProducts = computed(() =>
  catalogStore.products.slice((productPage.value - 1) * 10, productPage.value * 10)
)
const categoryNameOf = (categoryId: Product['categoryId']) =>
  catalogStore.categories.find((c) => String(c.id) === String(categoryId))?.name ?? '未分類'
const modifierGroupNamesOf = (product: Product) =>
  catalogStore.modifierGroupsOf(product).map((g) => g.name)

const productDialog = reactive<{
  open: boolean
  editingId: Product['id'] | null
  name: string
  categoryId: string
  basePrice: string
  stock: string
  modifierGroupIds: string[]
}>({
  open: false,
  editingId: null,
  name: '',
  categoryId: '',
  basePrice: '',
  stock: '',
  modifierGroupIds: []
})
function openAddProductDialog() {
  if (catalogStore.categories.length === 0) {
    void alert({ title: '通知', description: '請先新增至少一個分類', confirmText: '我知道了' })
    return
  }
  productDialog.editingId = null
  productDialog.name = ''
  productDialog.categoryId = ''
  productDialog.basePrice = ''
  productDialog.stock = ''
  productDialog.modifierGroupIds = []
  productDialog.open = true
}
function openEditProductDialog(row: Product) {
  productDialog.editingId = row.id
  productDialog.name = row.name
  productDialog.categoryId = String(row.categoryId)
  productDialog.basePrice = String(row.basePrice)
  productDialog.stock = row.stock == null ? '' : String(row.stock)
  productDialog.modifierGroupIds = row.modifierGroupIds.map(String)
  productDialog.open = true
}
function toggleProductModifierGroup(groupId: ModifierGroup['id']) {
  const id = String(groupId)
  productDialog.modifierGroupIds = productDialog.modifierGroupIds.includes(id)
    ? productDialog.modifierGroupIds.filter((item) => item !== id)
    : [...productDialog.modifierGroupIds, id]
}
async function submitProduct() {
  if (
    productDialog.name.trim() === '' ||
    productDialog.categoryId === '' ||
    productDialog.basePrice === ''
  ) {
    showToast('請輸入完整資訊', 'error')
    return
  }
  if (Number(productDialog.basePrice) < 0) {
    showToast('底價不可為負數,請重新輸入', 'error')
    return
  }
  if (
    catalogStore.products.some(
      (item) => item.name === productDialog.name && item.id !== productDialog.editingId
    )
  ) {
    showToast('此品項名稱已存在,請重新輸入', 'error')
    return
  }
  const payload = {
    categoryId: productDialog.categoryId,
    name: productDialog.name,
    basePrice: Number(productDialog.basePrice),
    stock: toApiStock(productDialog.stock),
    modifierGroupIds: productDialog.modifierGroupIds
  }
  try {
    if (productDialog.editingId === null) {
      const created = await createProduct(payload)
      catalogStore.products.push(created)
    } else {
      const updated = await updateProduct(String(productDialog.editingId), payload)
      const index = catalogStore.products.findIndex((item) => item.id === productDialog.editingId)
      if (index !== -1) catalogStore.products[index] = updated
    }
    productDialog.open = false
    showToast(productDialog.editingId === null ? '新增成功' : '保存成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
async function removeProduct(row: Product) {
  const result = await confirm({
    title: '警告',
    description: `是否刪除品項 ${row.name}？`,
    variant: 'danger'
  })
  if (result !== 'confirm') return
  try {
    await deleteProduct(String(row.id))
    catalogStore.products = catalogStore.products.filter((item) => item.id !== row.id)
    showToast('刪除成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}

// ---------- 規格群組 ----------
const modifierGroupPage = ref(1)
const modifierGroupPageCount = computed(() =>
  Math.max(Math.ceil(catalogStore.modifierGroups.length / 10), 1)
)
const sliceModifierGroups = computed(() =>
  catalogStore.modifierGroups.slice(
    (modifierGroupPage.value - 1) * 10,
    modifierGroupPage.value * 10
  )
)

function optionSummary(group: ModifierGroup) {
  return group.options
    .map((o) =>
      Number(o.priceDelta) !== 0
        ? `${o.name}(${Number(o.priceDelta) > 0 ? '+' : ''}${o.priceDelta})`
        : o.name
    )
    .join('、')
}

const modifierGroupDialog = reactive<{
  open: boolean
  editingId: ModifierGroup['id'] | null
  name: string
  selectionType: ModifierSelectionType
  required: boolean
  options: { name: string; priceDelta: string }[]
}>({ open: false, editingId: null, name: '', selectionType: 'single', required: true, options: [] })
function addModifierOptionRow() {
  modifierGroupDialog.options.push({ name: '', priceDelta: '0' })
}
function openAddModifierGroupDialog() {
  modifierGroupDialog.editingId = null
  modifierGroupDialog.name = ''
  modifierGroupDialog.selectionType = 'single'
  modifierGroupDialog.required = true
  modifierGroupDialog.options = [{ name: '', priceDelta: '0' }]
  modifierGroupDialog.open = true
}
function openEditModifierGroupDialog(row: ModifierGroup) {
  modifierGroupDialog.editingId = row.id
  modifierGroupDialog.name = row.name
  modifierGroupDialog.selectionType = row.selectionType
  modifierGroupDialog.required = row.required
  modifierGroupDialog.options = row.options.map((o) => ({
    name: o.name,
    priceDelta: String(o.priceDelta)
  }))
  modifierGroupDialog.open = true
}
async function submitModifierGroup() {
  if (modifierGroupDialog.name.trim() === '') {
    showToast('請輸入群組名稱', 'error')
    return
  }
  const options = modifierGroupDialog.options.filter((o) => o.name.trim() !== '')
  if (options.length === 0) {
    showToast('請至少新增一個選項', 'error')
    return
  }
  const payload = {
    name: modifierGroupDialog.name,
    selectionType: modifierGroupDialog.selectionType,
    required: modifierGroupDialog.required,
    options: options.map((o) => ({ name: o.name, priceDelta: Number(o.priceDelta) || 0 }))
  }
  try {
    if (modifierGroupDialog.editingId === null) {
      const created = await createModifierGroup(payload)
      catalogStore.modifierGroups.push(created)
    } else {
      const updated = await updateModifierGroup(String(modifierGroupDialog.editingId), payload)
      const index = catalogStore.modifierGroups.findIndex(
        (item) => item.id === modifierGroupDialog.editingId
      )
      if (index !== -1) catalogStore.modifierGroups[index] = updated
    }
    modifierGroupDialog.open = false
    showToast(modifierGroupDialog.editingId === null ? '新增成功' : '保存成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
async function removeModifierGroup(row: ModifierGroup) {
  const result = await confirm({
    title: '警告',
    description: `是否刪除規格群組 ${row.name}？掛用這個群組的品項會一併移除該規格。`,
    variant: 'danger'
  })
  if (result !== 'confirm') return
  try {
    await deleteModifierGroup(String(row.id))
    catalogStore.modifierGroups = catalogStore.modifierGroups.filter((item) => item.id !== row.id)
    catalogStore.products.forEach((product) => {
      product.modifierGroupIds = product.modifierGroupIds.filter(
        (id) => String(id) !== String(row.id)
      )
    })
    if (
      modifierGroupPage.value > 1 &&
      (modifierGroupPage.value - 1) * 10 >= catalogStore.modifierGroups.length
    ) {
      modifierGroupPage.value--
    }
    showToast('刪除成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}

// ---------- 加購選項 ----------
const addOnPage = ref(1)
const addOnPageCount = computed(() => Math.max(Math.ceil(catalogStore.addOns.length / 10), 1))
const sliceAddOns = computed(() =>
  catalogStore.addOns.slice((addOnPage.value - 1) * 10, addOnPage.value * 10)
)

const addOnDialog = reactive<{
  open: boolean
  editingId: AddOnOption['id'] | null
  name: string
  price: string
  stock: string
}>({
  open: false,
  editingId: null,
  name: '',
  price: '',
  stock: ''
})
function openAddAddOnDialog() {
  addOnDialog.editingId = null
  addOnDialog.name = ''
  addOnDialog.price = ''
  addOnDialog.stock = ''
  addOnDialog.open = true
}
function openEditAddOnDialog(row: AddOnOption) {
  addOnDialog.editingId = row.id
  addOnDialog.name = row.name
  addOnDialog.price = String(row.price)
  addOnDialog.stock = row.stock == null ? '' : String(row.stock)
  addOnDialog.open = true
}
async function submitAddOn() {
  if (addOnDialog.name.trim() === '' || addOnDialog.price === '') {
    showToast('請輸入完整資訊', 'error')
    return
  }
  if (Number(addOnDialog.price) < 0) {
    showToast('價錢不可為負數,請重新輸入', 'error')
    return
  }
  if (
    catalogStore.addOns.some(
      (item) => item.name === addOnDialog.name && item.id !== addOnDialog.editingId
    )
  ) {
    showToast('此名稱已存在,請重新輸入', 'error')
    return
  }
  const payload = {
    name: addOnDialog.name,
    price: Number(addOnDialog.price),
    stock: toApiStock(addOnDialog.stock)
  }
  try {
    if (addOnDialog.editingId === null) {
      const created = await createAddOnOption(payload)
      catalogStore.addOns.push(created)
    } else {
      const updated = await updateAddOnOption(String(addOnDialog.editingId), payload)
      const index = catalogStore.addOns.findIndex((item) => item.id === addOnDialog.editingId)
      if (index !== -1) catalogStore.addOns[index] = updated
    }
    addOnDialog.open = false
    showToast(addOnDialog.editingId === null ? '新增成功' : '保存成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
async function removeAddOn(row: AddOnOption) {
  const result = await confirm({
    title: '警告',
    description: `是否刪除加購選項 ${row.name}？`,
    variant: 'danger'
  })
  if (result !== 'confirm') return
  try {
    await deleteAddOnOption(String(row.id))
    catalogStore.addOns = catalogStore.addOns.filter((item) => item.id !== row.id)
    showToast('刪除成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
</script>

<style lang="scss" scoped></style>
