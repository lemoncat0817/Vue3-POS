<template>
  <div class="flex flex-col gap-2.5">
    <div class="flex items-center justify-between px-0.5">
      <span class="text-[11px] font-bold text-surface-400">勾選此角色擁有的權限：</span>
      <span
        class="rounded-full bg-surface-100 px-2 py-0.5 text-[11px] font-bold text-surface-500 dark:bg-surface-800 dark:text-surface-400"
      >
        {{ modelValue.length }}/{{ AUTHORITY_FIELDS.length }} 項
      </span>
    </div>

    <!-- 依父子階層分組，母權限取消時子權限連帶取消並 disabled -->
    <div
      class="max-h-64 overflow-y-auto rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/40 p-2.5 flex flex-col gap-2.5"
    >
      <div v-for="group in groups" :key="group.title">
        <label
          v-if="group.root"
          class="flex items-center gap-2 rounded-lg p-1.5 text-xs font-bold cursor-pointer transition-colors hover:bg-white dark:hover:bg-surface-700"
        >
          <input
            type="checkbox"
            :checked="modelValue.includes(group.root.value)"
            class="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500/20"
            @change="toggle(group.root.value, ($event.target as HTMLInputElement).checked)"
          />
          <span class="text-surface-900 dark:text-surface-100">{{ group.root.label }}</span>
        </label>
        <div
          v-else
          class="px-1.5 pb-0.5 text-[11px] font-bold uppercase tracking-wide text-surface-400"
        >
          {{ group.title }}
        </div>

        <div class="grid grid-cols-2 gap-1" :class="{ 'pl-6 mt-0.5': group.root }">
          <label
            v-for="field in group.children"
            :key="field.value"
            class="flex items-center gap-2 rounded-lg p-1.5 text-xs font-medium cursor-pointer transition-colors hover:bg-white dark:hover:bg-surface-700"
            :class="{ 'opacity-40 cursor-not-allowed': isDisabled(field) }"
          >
            <input
              type="checkbox"
              :checked="modelValue.includes(field.value)"
              :disabled="isDisabled(field)"
              class="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500/20"
              @change="toggle(field.value, ($event.target as HTMLInputElement).checked)"
            />
            <span class="text-surface-800 dark:text-surface-200">{{ field.label }}</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AuthorityKey } from '@/types'
import {
  AUTHORITY_FIELDS,
  cascadeAuthorityCheckList,
  groupAuthorityFields,
  type AuthorityField
} from '@/utils/authority'

const props = defineProps<{ modelValue: AuthorityKey[] }>()
const emit = defineEmits<{ 'update:modelValue': [AuthorityKey[]] }>()

const groups = groupAuthorityFields()

function isDisabled(field: AuthorityField): boolean {
  return !!field.dependsOn && !props.modelValue.includes(field.dependsOn)
}

function toggle(key: AuthorityKey, checked: boolean) {
  const next = checked
    ? [...props.modelValue, key]
    : props.modelValue.filter((item) => item !== key)
  emit('update:modelValue', cascadeAuthorityCheckList(next))
}
</script>
