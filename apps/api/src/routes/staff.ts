import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { createStaffRequestSchema, staffSchema } from '@pos/contract'
import { hashSecret } from '../auth/hash'
import { staff } from '../db/schema'
import { requireDeviceToken } from '../middleware/require-device-token'
import type { AppEnv } from '../types'

const listStaffRoute = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      description: '員工名單',
      content: { 'application/json': { schema: z.array(staffSchema) } },
    },
  },
})

const createStaffRoute = createRoute({
  method: 'post',
  path: '/',
  // 新增員工會異動權限名單，屬於需要裝置憑證的異動操作（見
  // src/middleware/require-device-token.ts 的說明）。掛在路由定義本身
  // 的 middleware，只套用在這一條路由，不影響上面的 GET。
  middleware: [requireDeviceToken] as const,
  request: {
    body: { content: { 'application/json': { schema: createStaffRequestSchema } } },
  },
  responses: {
    201: {
      description: '員工建立成功',
      content: { 'application/json': { schema: staffSchema } },
    },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: z.object({ error: z.string() }) } },
    },
  },
})

export const staffRoutes = new OpenAPIHono<AppEnv>()
  .openapi(listStaffRoute, async (c) => {
    const db = c.get('db')
    const rows = await db.select().from(staff).all()
    return c.json(
      rows.map((row) =>
        staffSchema.parse({
          id: row.id,
          name: row.name,
          jobTitle: row.jobTitle,
          account: row.account,
          capabilities: row.capabilities,
        }),
      ),
      200,
    )
  })
  .openapi(createStaffRoute, async (c) => {
    const { pin, ...input } = c.req.valid('json')
    const db = c.get('db')

    // PIN 只在這裡經手一次，雜湊後存進資料庫，明碼不落地（見
    // src/auth/hash.ts）。
    const { hash, salt } = await hashSecret(pin)
    const newStaff = {
      id: crypto.randomUUID(),
      ...input,
      pinHash: hash,
      pinSalt: salt,
      failedPinAttempts: 0,
      lockedUntil: null,
    }
    await db.insert(staff).values(newStaff)

    return c.json(staffSchema.parse(newStaff), 201)
  })
