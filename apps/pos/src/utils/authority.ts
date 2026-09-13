import { AUTHORITY_KEY_LABELS } from '@pos/contract'
import type { AuthorityKey } from '@/types'

export interface AuthorityField {
  label: string
  value: AuthorityKey
  dependsOn?: AuthorityKey
}

const AUTHORITY_FIELD_ORDER: Array<{ value: AuthorityKey; dependsOn?: AuthorityKey }> = [
  { value: 'canCompItem' },
  { value: 'canOpenCashier' },
  { value: 'canManageShift' },
  { value: 'canCheckOrder' },
  { value: 'canEditOrderStatus', dependsOn: 'canCheckOrder' },
  { value: 'canDeleteOrder', dependsOn: 'canCheckOrder' },
  { value: 'canRefundOrVoid', dependsOn: 'canCheckOrder' },
  { value: 'canCheckBackgroundSetting' },
  { value: 'canSetCategory', dependsOn: 'canCheckBackgroundSetting' },
  { value: 'canSetProduct', dependsOn: 'canCheckBackgroundSetting' },
  { value: 'canSetOrderCoupon', dependsOn: 'canCheckBackgroundSetting' },
  { value: 'canSetQuickDiscount', dependsOn: 'canCheckBackgroundSetting' },
  { value: 'canSetPayMethod', dependsOn: 'canCheckBackgroundSetting' },
  { value: 'canSetBusinessHours', dependsOn: 'canCheckBackgroundSetting' },
  { value: 'canCheckDataAnalysis' },
  { value: 'canCheckAuthority' },
  { value: 'canManageStaff', dependsOn: 'canCheckAuthority' },
  { value: 'canManageRoles', dependsOn: 'canCheckAuthority' },
  { value: 'canCheckMembers' },
  { value: 'canManageMembers', dependsOn: 'canCheckMembers' },
  { value: 'canManageTables' },
  { value: 'canManageDevices', dependsOn: 'canCheckAuthority' },
  { value: 'canCheckAuditLog' }
]

export const AUTHORITY_FIELDS: AuthorityField[] = AUTHORITY_FIELD_ORDER.map((field) => ({
  ...field,
  label: AUTHORITY_KEY_LABELS[field.value]
}))

const PARENT_KEYS = [
  'canCheckOrder',
  'canCheckBackgroundSetting',
  'canCheckAuthority',
  'canCheckMembers'
] as const

export function cascadeAuthorityCheckList(list: AuthorityKey[]): AuthorityKey[] {
  let next = list
  for (const parent of PARENT_KEYS) {
    if (!next.includes(parent)) {
      const dependents = AUTHORITY_FIELDS.filter((field) => field.dependsOn === parent).map(
        (field) => field.value
      )
      next = next.filter((item) => !dependents.includes(item))
    }
  }
  return next
}

export interface AuthorityGroup {
  title: string
  root?: AuthorityField
  children: AuthorityField[]
}
export function groupAuthorityFields(): AuthorityGroup[] {
  const roots = AUTHORITY_FIELDS.filter(
    (field) => !field.dependsOn && AUTHORITY_FIELDS.some((child) => child.dependsOn === field.value)
  )
  const grouped: AuthorityGroup[] = roots.map((root) => ({
    title: root.label,
    root,
    children: AUTHORITY_FIELDS.filter((field) => field.dependsOn === root.value)
  }))
  const others = AUTHORITY_FIELDS.filter(
    (field) => !field.dependsOn && !roots.some((root) => root.value === field.value)
  )
  if (others.length > 0) {
    grouped.push({ title: '其他', children: others })
  }
  return grouped
}
