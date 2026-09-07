import { authorityKeySchema, operatorLoginRequestSchema, operatorLoginResponseSchema, type Staff } from '@pos/contract'
import type { PermissionFlag } from '@/types/common'
import type { AuthorityKey, StaffMember } from '@/types/staff'
import { fetchJson } from './http'

/** 對應 POST /api/auth/operator-login。帳號或 PIN 錯誤、裝置憑證無效、帳號被鎖定都是 401，見 fetchJson 的 ApiError。 */
export async function operatorLogin(account: string, pin: string): Promise<Staff> {
  const body = operatorLoginRequestSchema.parse({ account, pin })
  const res = await fetchJson<unknown>('/api/auth/operator-login', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return operatorLoginResponseSchema.parse(res)
}

/**
 * 把伺服端的乾淨型別（`capabilities: AuthorityKey[]` 單一陣列來源）轉成
 * apps/pos 現行元件仍在使用的 `StaffMember` 形狀（16 個獨立 `'O'/'X'`
 * 欄位＋一份平行的 `authorityCheckList` 陣列，即 D-10 描述的雙重來源）。
 *
 * 這個轉換是刻意的權宜之計，不是本次一併修掉 D-10：P4 的範圍是身分
 * 驗證（登入這個動作本身改成真的向伺服端驗證 PIN），backgroundSetting/
 * permissionManagement 那個管理員可以直接編輯權限的頁面目前還是純本機
 * 狀態、也還沒有對應的伺服端寫入 API（跟 P3 對 productManagement catalog
 * CRUD 的處理方式一致）。把授權（capabilities 陣列）跟身分驗證
 * （這個帳號＋PIN 是否有效）耦合在一起一次改完，會把這個段落的風險
 * 拉得更大；D-10 的整併留到菜單管理／權限管理一起接上伺服端寫入 API
 * 的階段。
 */
export function toStaffMember(staff: Staff): StaffMember {
  const capabilitySet = new Set(staff.capabilities)
  const flags = Object.fromEntries(
    authorityKeySchema.options.map((key) => [key, capabilitySet.has(key) ? 'O' : 'X']),
  ) as Record<AuthorityKey, PermissionFlag>

  return {
    ...flags,
    id: staff.id,
    name: staff.name,
    jobTitle: staff.jobTitle,
    account: staff.account,
    // 已經不再使用明碼密碼比對（見 login/index.vue），這個欄位純粹是
    // 為了滿足 StaffMember 的既有型別而保留，不會被讀取或顯示。
    password: '',
    authorityCheckList: staff.capabilities,
  }
}
