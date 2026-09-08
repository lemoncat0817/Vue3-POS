import { operatorLoginRequestSchema, operatorLoginResponseSchema, type Staff } from '@pos/contract'
import type { StaffMember } from '@/types/staff'
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
 * 把伺服端的 `Staff`（`capabilities: AuthorityKey[]` 單一陣列來源）轉成
 * apps/pos 現行元件使用的 `StaffMember` 形狀。
 *
 * D-10 修復前，這裡還要另外把 `capabilities` 展開成 16 個獨立的
 * `'O'/'X'` 欄位，讓兩份權限來源在轉換當下保持同步；`types/staff.ts`
 * 拿掉那 16 個欄位之後，這裡只是單純的形狀轉換（伺服端沒有 password
 * 欄位、apps/pos 的 StaffMember 型別歷史上有這個欄位），不再需要衍生
 * 任何資料。
 */
export function toStaffMember(staff: Staff): StaffMember {
  return {
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
