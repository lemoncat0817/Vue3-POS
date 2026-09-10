import type { AuthorityKey } from '@/types'

/** 權限欄位清單、依附關係共用定義。權限的實際分組（角色）改由後端 roles 管理，見 stores/roles.ts。 */
export interface AuthorityField {
  label: string
  value: AuthorityKey
  dependsOn?: AuthorityKey
}

export const AUTHORITY_FIELDS: AuthorityField[] = [
  { label: '招待', value: 'canCompItem' },
  { label: '開收銀機', value: 'canOpenCashier' },
  { label: '管理班別／現金', value: 'canManageShift' },
  { label: '查看訂單', value: 'canCheckOrder' },
  { label: '編輯訂單狀態', value: 'canEditOrderStatus', dependsOn: 'canCheckOrder' },
  { label: '刪除訂單', value: 'canDeleteOrder', dependsOn: 'canCheckOrder' },
  { label: '退款／作廢', value: 'canRefundOrVoid', dependsOn: 'canCheckOrder' },
  { label: '查看後台設定', value: 'canCheckBackgroundSetting' },
  { label: '設定分類', value: 'canSetCategory', dependsOn: 'canCheckBackgroundSetting' },
  { label: '設定品項', value: 'canSetProduct', dependsOn: 'canCheckBackgroundSetting' },
  { label: '設定加購選項', value: 'canSetAddOns', dependsOn: 'canCheckBackgroundSetting' },
  { label: '設定訂單折價券', value: 'canSetOrderCoupon', dependsOn: 'canCheckBackgroundSetting' },
  { label: '設定快速折扣', value: 'canSetQuickDiscount', dependsOn: 'canCheckBackgroundSetting' },
  { label: '設定付款方式', value: 'canSetPayMethod', dependsOn: 'canCheckBackgroundSetting' },
  { label: '查看數據分析', value: 'canCheckDataAnalysis' },
  { label: '查看權限管理', value: 'canCheckAuthority' },
  { label: '設定人員名單', value: 'canSetAuthority', dependsOn: 'canCheckAuthority' },
  { label: '查看會員管理', value: 'canCheckMembers' },
  { label: '查看桌況管理', value: 'canManageTables' },
]

const PARENT_KEYS = ['canCheckOrder', 'canCheckBackgroundSetting', 'canCheckAuthority'] as const

/** 母權限被取消勾選時，連帶取消勾選依附在它底下的子權限。 */
export function cascadeAuthorityCheckList(list: AuthorityKey[]): AuthorityKey[] {
  let next = list
  for (const parent of PARENT_KEYS) {
    if (!next.includes(parent)) {
      const dependents = AUTHORITY_FIELDS.filter((field) => field.dependsOn === parent).map((field) => field.value)
      next = next.filter((item) => !dependents.includes(item))
    }
  }
  return next
}

/** 依 dependsOn 分組，供 UI 依階層渲染權限設定。無依附或被依附者歸類為「其他」。 */
export interface AuthorityGroup {
  title: string
  root?: AuthorityField
  children: AuthorityField[]
}
export function groupAuthorityFields(): AuthorityGroup[] {
  const roots = AUTHORITY_FIELDS.filter((field) =>
    !field.dependsOn && AUTHORITY_FIELDS.some((child) => child.dependsOn === field.value),
  )
  const grouped: AuthorityGroup[] = roots.map((root) => ({
    title: root.label,
    root,
    children: AUTHORITY_FIELDS.filter((field) => field.dependsOn === root.value),
  }))
  const others = AUTHORITY_FIELDS.filter((field) =>
    !field.dependsOn && !roots.some((root) => root.value === field.value),
  )
  if (others.length > 0) {
    grouped.push({ title: '其他', children: others })
  }
  return grouped
}
