<template>
  <div
    class="w-full flex flex-col rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-3 shadow-sm"
  >
    <div
      class="flex items-center justify-between pb-2 mb-2 border-b border-surface-100 dark:border-surface-800"
    >
      <div class="flex items-center gap-2">
        <span class="text-xs font-black text-surface-900 dark:text-surface-100">規格客製</span>
        <span
          v-if="fromSelection(catalogStore.selectedProduct)"
          class="text-xs font-bold text-primary-600 dark:text-primary-400"
        >
          「{{ fromSelection(catalogStore.selectedProduct)?.name }}」
        </span>
        <span
          v-if="catalogStore.editingLine"
          class="rounded-full bg-warning-500/15 text-warning-700 dark:text-warning-300 border border-warning-500/30 px-2 py-0.5 text-[10px] font-black flex items-center gap-1"
        >
          <Pencil class="w-2.5 h-2.5" />
          編輯購物車品項
        </span>
      </div>

      <div class="flex items-center gap-1.5">
        <div class="flex rounded-xl bg-surface-100 dark:bg-surface-800 p-0.5 text-xs font-bold">
          <button
            type="button"
            class="rounded-lg px-2.5 py-1 transition-colors select-none"
            :class="
              catalogStore.productPanel === 0
                ? 'bg-white dark:bg-surface-900 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'
            "
            @click="catalogStore.productPanel = 0"
          >
            規格選項
          </button>
          <button
            type="button"
            class="rounded-lg px-2.5 py-1 transition-colors select-none"
            :class="
              catalogStore.productPanel === 1
                ? 'bg-white dark:bg-surface-900 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'
            "
            @click="catalogStore.productPanel = 1"
          >
            加購
            <span
              v-if="catalogStore.selectedAddOnOptions.length > 0"
              class="text-primary-600 font-bold"
              >({{ catalogStore.selectedAddOnOptions.length }})</span
            >
          </button>
        </div>

        <button
          type="button"
          class="rounded-lg border border-surface-200 dark:border-surface-700 px-2 py-1 text-xs font-bold text-surface-600 dark:text-surface-400 hover:bg-danger-50 hover:text-danger-600 hover:border-danger-200 dark:hover:bg-danger-950/40 dark:hover:border-danger-800 dark:hover:text-danger-400 transition-colors select-none"
          @click="resetAll"
        >
          重置
        </button>
      </div>
    </div>

    <div
      v-if="catalogStore.productPanel === 0"
      class="flex flex-col gap-2.5 min-h-[140px] justify-center"
    >
      <div v-if="specGroups.length > 0" class="flex flex-col gap-2.5">
        <div
          v-for="group in specGroups"
          :key="String(group.id)"
          class="flex items-center gap-2"
        >
          <span
            class="w-16 text-xs font-bold text-surface-500 dark:text-surface-400 shrink-0 text-center"
          >
            {{ group.name }}<span v-if="group.required" class="text-danger-500">*</span>
          </span>
          <div class="flex flex-wrap items-center gap-1.5 flex-1">
            <button
              v-for="option in group.options"
              :key="String(option.id)"
              type="button"
              class="rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all select-none border"
              :class="
                isOptionSelected(group.id, option.id)
                  ? 'border-primary-500 bg-primary-600 text-white shadow-sm scale-[1.03]'
                  : 'border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700'
              "
              @click="toggleOption(group, option.id)"
            >
              {{ option.name
              }}<span v-if="Number(option.priceDelta) !== 0" class="opacity-75"
                >（{{ Number(option.priceDelta) > 0 ? '+' : '' }}{{ option.priceDelta }}）</span
              >
            </button>
          </div>
        </div>
      </div>

      <div
        v-else
        class="flex flex-col items-center justify-center py-6 text-surface-400 dark:text-surface-500"
      >
        <span class="text-sm font-bold">此品項為固定規格，沒有可客製化的選項</span>
      </div>
    </div>

    <div v-if="catalogStore.productPanel === 1" class="flex flex-col gap-3 min-h-[140px]">
      <div v-if="addOnGroups.length > 0" class="flex flex-col gap-3">
        <div v-for="group in addOnGroups" :key="String(group.id)" class="flex flex-col gap-1.5">
          <span class="text-xs font-bold text-surface-500 dark:text-surface-400">
            {{ group.name }}<span v-if="group.required" class="text-danger-500">*</span>
          </span>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            <button
              v-for="option in group.options"
              :key="String(option.id)"
              type="button"
              class="relative flex flex-col items-center justify-between p-2 rounded-xl border text-center transition-all select-none cursor-pointer"
              :class="{
                'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-900 dark:text-primary-100 ring-2 ring-primary-500/20':
                  isOptionSelected(group.id, option.id),
                'border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-700 dark:text-surface-200 hover:bg-white dark:hover:bg-surface-700':
                  !isOptionSelected(group.id, option.id),
                'cursor-not-allowed opacity-40 pointer-events-none': isOptionSoldOut(option)
              }"
              @click="toggleOption(group, option.id)"
            >
              <span class="text-xs font-bold">{{ option.name }}</span>
              <span class="text-[10px] font-bold text-primary-600 dark:text-primary-400 mt-1">
                +${{ option.priceDelta }}
              </span>
              <span
                v-if="isOptionSoldOut(option)"
                class="absolute top-0.5 right-0.5 rounded-full bg-danger-600 px-1.5 py-0.5 text-[8px] font-bold text-white shadow-sm"
                >缺貨</span
              >
            </button>
          </div>
        </div>
      </div>

      <div
        v-else
        class="flex flex-col items-center justify-center py-6 text-surface-400 dark:text-surface-500"
      >
        <span class="text-sm font-bold">此品項沒有可加購的選項</span>
      </div>
    </div>

    <div
      class="flex flex-wrap items-center justify-between gap-2 pt-2.5 mt-2 border-t border-surface-100 dark:border-surface-800"
    >
      <div class="flex items-center gap-1.5">
        <span class="text-xs font-bold text-surface-500 dark:text-surface-400 mr-1">數量</span>
        <button
          type="button"
          class="h-7 w-7 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 font-bold hover:bg-surface-100 dark:hover:bg-surface-700 text-sm flex items-center justify-center active:scale-95 select-none transition-colors cursor-pointer"
          @click="decreaseCount"
        >
          -
        </button>

        <!-- 數量徽章（點擊直接呼出數字鍵盤 Popover） -->
        <QuantityKeypadPopover
          v-model:open="isKeypadOpen"
          :model-value="catalogStore.productCount"
          @update:model-value="setCount"
        >
          <template #trigger="{ open }">
            <button
              type="button"
              class="h-7 px-2.5 rounded-lg border border-primary-200 dark:border-primary-800 bg-primary-50/70 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-mono font-black text-sm flex items-center gap-1.5 hover:bg-primary-100 dark:hover:bg-primary-900/60 hover:border-primary-400 active:scale-95 transition-all select-none cursor-pointer shadow-xs"
              :class="{ 'ring-2 ring-primary-500/40 border-primary-500': open }"
              title="點擊自訂數量 (開啟數字鍵盤)"
            >
              <span>{{ productCountDisplay }}</span>
              <span class="text-[11px] font-bold text-primary-600/70 dark:text-primary-400/70"
                >份</span
              >
              <Keyboard class="w-3.5 h-3.5 text-primary-500/80 dark:text-primary-400/80" />
            </button>
          </template>
        </QuantityKeypadPopover>

        <button
          type="button"
          class="h-7 w-7 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 font-bold hover:bg-surface-100 dark:hover:bg-surface-700 text-sm flex items-center justify-center active:scale-95 select-none transition-colors cursor-pointer"
          @click="increaseCount"
        >
          +
        </button>

        <div class="flex items-center gap-1 ml-1">
          <button
            v-for="preset in [1, 2, 3, 5]"
            :key="preset"
            type="button"
            class="px-2.5 py-1 rounded-lg border text-xs font-black select-none transition-all active:scale-95 cursor-pointer"
            :class="
              productCountDisplay === preset
                ? 'border-primary-500 bg-primary-600 text-white shadow-sm'
                : 'border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700'
            "
            @click="setCount(String(preset))"
          >
            {{ preset }}
          </button>
          <button
            type="button"
            class="flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-black select-none transition-all active:scale-95 cursor-pointer"
            :class="
              ![1, 2, 3, 5].includes(productCountDisplay)
                ? 'border-primary-500 bg-primary-600 text-white shadow-sm'
                : 'border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700'
            "
            title="開啟數字鍵盤自訂數量"
            @click="isKeypadOpen = true"
          >
            <span>自訂</span>
            <Keyboard class="w-3 h-3" />
          </button>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <div class="text-right">
          <span class="text-[10px] text-surface-400 block leading-tight">單項小計</span>
          <span
            class="text-sm font-black text-surface-900 dark:text-surface-100 font-mono leading-tight"
          >
            NT$
            {{
              Number.isNaN(catalogStore.productCurrentTotal) || !catalogStore.productCurrentTotal
                ? 0
                : catalogStore.productCurrentTotal
            }}
          </span>
        </div>
        <div v-if="catalogStore.editingLine" class="flex items-center gap-1.5">
          <button
            type="button"
            class="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 px-3 py-2 text-xs font-bold text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 active:scale-95 transition-all select-none cursor-pointer"
            @click="emit('cancelEdit')"
          >
            取消
          </button>
          <button
            type="button"
            class="rounded-xl bg-primary-600 px-4 py-2 text-xs font-black text-white hover:bg-primary-700 active:scale-95 shadow-md shadow-primary-600/25 transition-all select-none cursor-pointer flex items-center gap-1"
            @click="emit('saveEdit')"
          >
            <Check class="w-3.5 h-3.5" />
            更新品項
          </button>
        </div>
        <button
          v-else
          type="button"
          class="rounded-xl bg-primary-600 px-5 py-2 text-xs font-black text-white hover:bg-primary-700 active:scale-95 shadow-md shadow-primary-600/25 transition-all select-none cursor-pointer"
          @click="emit('addProduct')"
        >
          新增
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCatalogStore } from '@/stores/catalog'
const catalogStore = useCatalogStore()
import { computed, ref } from 'vue'
import { confirm } from '@/composables/useConfirm'
import { showToast } from '@/composables/useToast'
import type { FormNumeric, ModifierGroup, ModifierOption } from '@/types'
import { fromSelection } from '@/utils/selection'
import QuantityKeypadPopover from '@/components/ui/QuantityKeypadPopover.vue'
import { Keyboard, Pencil, Check } from 'lucide-vue-next'

const isKeypadOpen = ref(false)

const emit = defineEmits<{
  (e: 'addProduct'): void
  (e: 'saveEdit'): void
  (e: 'cancelEdit'): void
}>()

const specGroups = computed(() => catalogStore.specGroupsOf(fromSelection(catalogStore.selectedProduct)))
const addOnGroups = computed(() =>
  catalogStore.addOnGroupsOf(fromSelection(catalogStore.selectedProduct))
)

const isOptionSelected = (groupId: FormNumeric, optionId: FormNumeric) =>
  (catalogStore.selectedModifiers[String(groupId)] ?? []).includes(String(optionId))

const toggleOption = (group: ModifierGroup, optionId: FormNumeric) => {
  const key = String(group.id)
  const current = catalogStore.selectedModifiers[key] ?? []
  const id = String(optionId)
  if (group.selectionType === 'single') {
    catalogStore.selectedModifiers = {
      ...catalogStore.selectedModifiers,
      [key]: current.includes(id) ? [] : [id]
    }
  } else {
    catalogStore.selectedModifiers = {
      ...catalogStore.selectedModifiers,
      [key]: current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    }
  }
}

const productCountDisplay = computed(() => {
  const count = parseInt(catalogStore.productCount)
  return isNaN(count) || count < 1 ? 1 : count
})

const setCount = (val: string) => {
  catalogStore.productCount = val
}

const decreaseCount = () => {
  const current = productCountDisplay.value
  if (current > 1) {
    catalogStore.productCount = String(current - 1)
  }
}

const increaseCount = () => {
  const current = productCountDisplay.value
  catalogStore.productCount = String(current + 1)
}

// 選項庫存歸零視為缺貨不可加選（規格與加購共用同一個判斷，只是規格通常不設庫存）。
const isOptionSoldOut = (option: ModifierOption) => option.stock === 0

const resetAll = async () => {
  const result = await confirm({
    title: '警告',
    description: '是否要重置上面所有選項?'
  })
  if (result !== 'confirm') return
  catalogStore.selectedCategoryId = ''
  catalogStore.selectedProduct = []
  catalogStore.selectedModifiers = {}
  if (catalogStore.editingLine) {
    catalogStore.cancelEditLine()
  }
  showToast('重置成功', 'success')
}
</script>

<style lang="scss" scoped></style>
