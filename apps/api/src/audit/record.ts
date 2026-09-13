import type { Context } from 'hono'
import { eq } from 'drizzle-orm'
import type { AuditLogAction } from '@pos/contract'
import { findActiveOperatorSession } from '../auth/operator-session'
import { auditLogs, staff } from '../db/schema'
import type { AppEnv } from '../types'

/**
 * 反解目前操作者的顯示名稱（`${jobTitle} - ${name}`，比照前端 fromSelection()
 * 組字串的既有慣例）。呼叫這支函式的路由都已經過 requireCapability／
 * checkCapability 驗證，X-Operator-Session 保證存在且有效，理論上不會走到
 * 「查無操作者」這個分支，只是防禦性寫法。
 */
async function resolveOperatorLabel(c: Context<AppEnv>): Promise<string> {
  const sessionToken = c.req.header('X-Operator-Session') ?? null
  if (!sessionToken) return '未知操作者'
  const session = await findActiveOperatorSession(c.get('db'), sessionToken)
  if (!session) return '未知操作者'
  const row = await c.get('db').select().from(staff).where(eq(staff.id, session.staffId)).get()
  return row ? `${row.jobTitle} - ${row.name}` : '未知操作者'
}

/**
 * 記錄一筆操作紀錄。刻意不用前端傳來的 operator 字串（那是既有寫入點
 * ——訂單作廢/退款、班別開關、會員點數調整——沿用至今、可被自由填寫的
 * 慣例），改以 session 反解，讓新增的稽核軌跡比舊欄位更可信；寫入失敗
 * 不擋原本的業務異動，操作紀錄是輔助性質，不該讓一筆稽核寫入失敗擋住
 * 使用者真正在做的事。
 */
export async function recordAuditLog(
  c: Context<AppEnv>,
  action: AuditLogAction,
  detail: string
): Promise<void> {
  try {
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const operator = await resolveOperatorLabel(c)
    await db.insert(auditLogs).values({
      tenantId,
      action,
      operator,
      detail,
      createdAt: new Date().toISOString()
    })
  } catch (err) {
    console.error(`寫入操作紀錄失敗（action: ${action}）`, err)
  }
}
