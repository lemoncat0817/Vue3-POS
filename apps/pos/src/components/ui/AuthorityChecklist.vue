<template>
  <div class="flex flex-col gap-2.5">
    <!-- 角色範本快速套用（規劃書 §5.4）：選一個範本直接套用整組權限，
         不用 18 格逐一勾選。手動再調整任何一項，下方摘要就會變成
         「自訂」——這一列本身沒有「選取狀態」，永遠即時反映目前的
         authorityCheckList 到底符合哪個範本。 -->
    <div class="flex flex-wrap items-center gap-1.5">
      <span class="text-[11px] font-bold text-surface-400">角色範本：</span>
      <button
        v-for="role in STAFF_ROLE_NAMES" :key="role" type="button"
        class="rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors border"
        :class="currentRole === role
          ? 'border-primary-500 bg-primary-600 text-white'
          : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700'"
        @click="applyRole(role)">
        {{ role }}
      </button>
      <span
        class="ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold"
        :class="currentRole === CUSTOM_ROLE_LABEL
          ? 'bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400'
          : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'">
        目前：{{ currentRole }} · {{ modelValue.length }}/{{ AUTHORITY_FIELDS.length }} 項
      </span>
    </div>

    <!-- 依父子關係分組並階層縮排，取代原本 18 個等權重欄位平鋪成
         grid-cols-2 的作法——母權限取消時子權限自動連帶取消（見
         utils/authority.ts 的 cascadeAuthorityCheckList），這裡用
         disabled + 視覺淡化讓「為什麼這格關掉」看得出來。 -->
    <div class="max-h-64 overflow-y-auto rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/40 p-2.5 flex flex-col gap-2.5">
      <div v-for="group in groups" :key="group.title">
        <label
          v-if="group.root"
          class="flex items-center gap-2 rounded-lg p-1.5 text-xs font-bold cursor-pointer transition-colors hover:bg-white dark:hover:bg-surface-700">
          <input
            type="checkbox" :checked="modelValue.includes(group.root.value)"
            class="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500/20"
            @change="toggle(group.root.value, ($event.target as HTMLInputElement).checked)">
          <span class="text-surface-900 dark:text-surface-100">{{ group.root.label }}</span>
        </label>
        <div v-else class="px-1.5 pb-0.5 text-[11px] font-bold uppercase tracking-wide text-surface-400">{{ group.title }}</div>

        <div class="grid grid-cols-2 gap-1" :class="{ 'pl-6 mt-0.5': group.root }">
          <label
            v-for="field in group.children" :key="field.value"
            class="flex items-center gap-2 rounded-lg p-1.5 text-xs font-medium cursor-pointer transition-colors hover:bg-white dark:hover:bg-surface-700"
            :class="{ 'opacity-40 cursor-not-allowed': isDisabled(field) }">
            <input
              type="checkbox" :checked="modelValue.includes(field.value)"
              :disabled="isDisabled(field)"
              class="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500/20"
              @change="toggle(field.value, ($event.target as HTMLInputElement).checked)">
            <span class="text-surface-800 dark:text-surface-200">{{ field.label }}</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// UI-6（規劃書 §5.4「權限管理」）：從 permissionManagement/index.vue
// 抽出來的共用元件——新增人員／編輯人員兩個對話框原本各自重複一份
// 幾乎一樣的「18 格 checkbox 平鋪 grid-cols-2」，現在共用同一份分組
// ＋角色範本邏輯，不會有兩份互相漂移的風險。
import { computed } from 'vue'
import type { AuthorityKey } from '@/types'
import {
  AUTHORITY_FIELDS,
  STAFF_ROLE_NAMES,
  STAFF_ROLE_PRESETS,
  CUSTOM_ROLE_LABEL,
  cascadeAuthorityCheckList,
  deriveStaffRole,
  groupAuthorityFields,
  type AuthorityField,
  type StaffRoleName,
} from '@/utils/authority'

const props = defineProps<{ modelValue: AuthorityKey[] }>()
const emit = defineEmits<{ 'update:modelValue': [AuthorityKey[]] }>()

const groups = groupAuthorityFields()
const currentRole = computed(() => deriveStaffRole(props.modelValue))

function isDisabled(field: AuthorityField): boolean {
  return !!field.dependsOn && !props.modelValue.includes(field.dependsOn)
}

function toggle(key: AuthorityKey, checked: boolean) {
  const next = checked ? [...props.modelValue, key] : props.modelValue.filter((item) => item !== key)
  emit('update:modelValue', cascadeAuthorityCheckList(next))
}

function applyRole(role: StaffRoleName) {
  // role 一定是 STAFF_ROLE_NAMES（= Object.keys(STAFF_ROLE_PRESETS)）裡的一個，
  // 保證查得到；noUncheckedIndexedAccess 仍會把索引結果推成 T | undefined。
  emit('update:modelValue', [...STAFF_ROLE_PRESETS[role]!])
}
</script>
