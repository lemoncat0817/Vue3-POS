<template>
  <div class="flex flex-col gap-1.5">
    <SelectRoot :model-value="modelValue" @update:model-value="(value: unknown) => emit('update:modelValue', String(value))">
      <SelectTrigger class="flex w-full items-center justify-between rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-xs font-bold text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500">
        <SelectValue placeholder="選擇權限群組" />
        <span aria-hidden="true" class="text-surface-400">▾</span>
      </SelectTrigger>
      <SelectPortal>
        <SelectContent class="z-50 min-w-[220px] rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-1 shadow-lg" position="popper">
          <SelectViewport class="p-1">
            <SelectItem
              v-for="role in rolesStore.roleList" :key="role.id" :value="role.id"
              class="cursor-pointer rounded-lg px-3 py-2 text-xs font-bold text-surface-700 dark:text-surface-300 outline-none hover:bg-surface-100 dark:hover:bg-surface-800 data-[state=checked]:bg-primary-50 data-[state=checked]:text-primary-600 dark:data-[state=checked]:bg-primary-950/40 dark:data-[state=checked]:text-primary-400">
              <SelectItemText>
                {{ role.name }}
                <span class="font-mono font-normal text-surface-400">{{ role.capabilities.length }}/{{ AUTHORITY_FIELDS.length }}</span>
              </SelectItemText>
            </SelectItem>
          </SelectViewport>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>
    <p class="text-[11px] text-surface-400">此人員的權限將完全跟隨所選的權限群組，如需個別調整請至「權限群組」頁面編輯。</p>
  </div>
</template>

<script setup lang="ts">
import { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from 'reka-ui'
import { AUTHORITY_FIELDS } from '@/utils/authority'
import { useRolesStore } from '@/stores/roles'

const rolesStore = useRolesStore()

defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()
</script>
