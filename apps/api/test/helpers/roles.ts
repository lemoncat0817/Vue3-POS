import { roles } from '../../src/db/schema'
import type { AnyDb } from '../../src/db/types'
import type { AuthorityKey } from '@pos/contract'

/** 測試用權限群組：多數 staff／auth 測試只在乎「有一個角色可以指」，直接寫入 db 省去多一趟 API 呼叫。 */
export async function seedRole(
  db: AnyDb,
  input: {
    id?: string
    name?: string
    capabilities?: AuthorityKey[]
    isSystem?: boolean
    tenantId?: string | null
  }
): Promise<string> {
  const id = input.id ?? crypto.randomUUID()
  await db.insert(roles).values({
    id,
    tenantId: input.tenantId ?? null,
    // 沒指定名稱時用 id 組出預設值，避免同一個測試 db 裡多次呼叫撞上 roles_name_idx。
    name: input.name ?? `測試角色-${id}`,
    capabilities: input.capabilities ?? [],
    isSystem: input.isSystem ?? false
  })
  return id
}
