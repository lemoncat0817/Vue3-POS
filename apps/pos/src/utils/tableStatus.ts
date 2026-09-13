import type { TableStatus } from '@pos/contract'

export const tableStatusOptions: { value: TableStatus; label: string }[] = [
  { value: 'empty', label: '空桌' },
  { value: 'occupied', label: '使用中' },
  { value: 'reserved', label: '已預約' }
]

export function tableStatusLabel(status: TableStatus): string {
  return tableStatusOptions.find((option) => option.value === status)?.label ?? status
}

export function tableStatusCardClass(status: TableStatus): string {
  if (status === 'occupied')
    return 'border-danger-300 bg-danger-50 text-danger-700 dark:border-danger-800 dark:bg-danger-950 dark:text-danger-300'
  if (status === 'reserved')
    return 'border-warning-300 bg-warning-50 text-warning-700 dark:border-warning-800 dark:bg-warning-950 dark:text-warning-300'
  return 'border-success-300 bg-success-50 text-success-700 dark:border-success-800 dark:bg-success-950 dark:text-success-300'
}
