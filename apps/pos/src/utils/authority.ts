import type { AuthorityKey } from '@/types'

/** 權限欄位清單、依附關係與角色範本共用定義。 */
export interface AuthorityField {
  label: string
  value: AuthorityKey
  dependsOn?: AuthorityKey
}

export const AUTHORITY_FIELDS: AuthorityField[] = [
  { label: '免費招待', value: 'canFreeDrink' },
  { label: '開收銀機', value: 'canOpenCashier' },
  { label: '查看訂單', value: 'canCheckOrder' },
  { label: '編輯訂單狀態', value: 'canEditOrderStatus', dependsOn: 'canCheckOrder' },
  { label: '刪除訂單', value: 'canDeleteOrder', dependsOn: 'canCheckOrder' },
  { label: '查看後台設定', value: 'canCheckBackgroundSetting' },
  { label: '設定飲品類型', value: 'canSetDrinkType', dependsOn: 'canCheckBackgroundSetting' },
  { label: '設定飲料品項', value: 'canSetDrink', dependsOn: 'canCheckBackgroundSetting' },
  { label: '設定配料', value: 'canSetIngredients', dependsOn: 'canCheckBackgroundSetting' },
  { label: '設定現金折扣券', value: 'canSetMoneyDiscount', dependsOn: 'canCheckBackgroundSetting' },
  { label: '設定折數折扣券', value: 'canSetPercentDiscount', dependsOn: 'canCheckBackgroundSetting' },
  { label: '設定常用優惠', value: 'canSetOftenUseDiscount', dependsOn: 'canCheckBackgroundSetting' },
  { label: '查看數據分析', value: 'canCheckDataAnalysis' },
  { label: '查看權限管理', value: 'canCheckAuthority' },
  { label: '設定人員名單', value: 'canSetAuthority', dependsOn: 'canCheckAuthority' },
  { label: '設定付款方式', value: 'canSetPayMethod', dependsOn: 'canCheckAuthority' },
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

/** 角色預設範本：純前端顯示層依據 authorityCheckList 組合反推，不額外新增 DB 欄位。 */
export const STAFF_ROLE_PRESETS: Record<string, AuthorityKey[]> = {
  店長: AUTHORITY_FIELDS.map((field) => field.value),
  值班經理: [
    'canFreeDrink', 'canOpenCashier', 'canCheckOrder', 'canEditOrderStatus',
    'canCheckBackgroundSetting', 'canSetDrinkType', 'canSetDrink', 'canSetIngredients',
    'canCheckDataAnalysis',
  ],
  工讀生: ['canCheckOrder', 'canEditOrderStatus', 'canCheckBackgroundSetting'],
}
export const STAFF_ROLE_NAMES = Object.keys(STAFF_ROLE_PRESETS) as Array<keyof typeof STAFF_ROLE_PRESETS>
export type StaffRoleName = keyof typeof STAFF_ROLE_PRESETS
export const CUSTOM_ROLE_LABEL = '自訂'

function sameAuthoritySet(a: AuthorityKey[], b: AuthorityKey[]): boolean {
  if (a.length !== b.length) return false
  const set = new Set(b)
  return a.every((key) => set.has(key))
}

/** 從一組 authorityCheckList 反推最接近的角色範本；完全對不上任何範本就是「自訂」。 */
export function deriveStaffRole(authorityCheckList: AuthorityKey[]): string {
  for (const [role, preset] of Object.entries(STAFF_ROLE_PRESETS)) {
    if (sameAuthoritySet(authorityCheckList, preset)) return role
  }
  return CUSTOM_ROLE_LABEL
}
