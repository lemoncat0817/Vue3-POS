<template>
  <div class="flex flex-col gap-2.5">
    <!-- 角色範本快速套用列 -->
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
          : 'bg-success-50 text-success-600 dark:bg-success-950/50 dark:text-success-400'">
        目前：{{ currentRole }} · {{ modelValue.length }}/{{ AUTHORITY_FIELDS.length }} 項
      </span>
    </div>

    <!-- 依父子階層分組，母權限取消時子權限連帶取消並 disabled -->
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
  // role 保證存在於 STAFF_ROLE_PRESETS，! 滿足 noUncheckedIndexedAccess
  emit('update:modelValue', [...STAFF_ROLE_PRESETS[role]!])
}
</script>
