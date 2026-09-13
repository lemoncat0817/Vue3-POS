import type { Context } from 'hono'
import { eq } from 'drizzle-orm'
import type { AuditLogAction } from '@pos/contract'
import { findActiveOperatorSession } from '../auth/operator-session'
import { auditLogs, staff } from '../db/schema'
import type { AppEnv } from '../types'

async function resolveOperatorLabel(c: Context<AppEnv>): Promise<string> {
  const sessionToken = c.req.header('X-Operator-Session') ?? null
  if (!sessionToken) return '未知操作者'
  const session = await findActiveOperatorSession(c.get('db'), sessionToken)
  if (!session) return '未知操作者'
  const row = await c.get('db').select().from(staff).where(eq(staff.id, session.staffId)).get()
  return row ? `${row.jobTitle} - ${row.name}` : '未知操作者'
}

// 稽核寫入失敗不中斷主業務流程，operatorOverride 供未建立 session 等場景覆寫
export async function recordAuditLog(
  c: Context<AppEnv>,
  action: AuditLogAction,
  detail: string,
  operatorOverride?: string
): Promise<void> {
  try {
    const db = c.get('db')
    const tenantId = c.get('tenantId') ?? null
    const operator = operatorOverride ?? (await resolveOperatorLabel(c))
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
