import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import {
  addOnOptionSchema,
  catalogGroupSummarySchema,
  catalogItemSchema,
  catalogResponseSchema,
  createAddOnOptionRequestSchema,
  createCatalogGroupRequestSchema,
  createCatalogItemRequestSchema,
  updateAddOnOptionRequestSchema,
  updateCatalogGroupRequestSchema,
  updateCatalogItemRequestSchema,
} from '@pos/contract'
import { addOnOptions, catalogGroups, catalogItems } from '../db/schema'
import { requireDeviceToken } from '../middleware/require-device-token'
import type { AppEnv } from '../types'

const errorSchema = z.object({ error: z.string() })

const getCatalogRoute = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      description: '目前的菜單（飲料系列與品項、加料選項）',
      content: {
        'application/json': { schema: catalogResponseSchema },
      },
    },
  },
})

/**
 * 菜單管理寫入 API（P18：規劃書 §10 P18「菜單與權限管理接上伺服端」）。
 * productManagement.vue 原本的新增／編輯／刪除只改本機 Pinia 狀態，
 * 這裡補上對應的伺服端端點，讓異動真正落地——跟 P5 促銷引擎當時把
 * offerSetting.vue 接上伺服端寫入 API 是同一套模式（見 routes/
 * promotions.ts）。
 */
const createGroupRoute = createRoute({
  method: 'post',
  path: '/groups',
  middleware: [requireDeviceToken] as const,
  request: { body: { content: { 'application/json': { schema: createCatalogGroupRequestSchema } } } },
  responses: {
    201: { description: '飲品類型建立成功', content: { 'application/json': { schema: catalogGroupSummarySchema } } },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
  },
})

const updateGroupRoute = createRoute({
  method: 'put',
  path: '/groups/{id}',
  middleware: [requireDeviceToken] as const,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: { content: { 'application/json': { schema: updateCatalogGroupRequestSchema } } },
  },
  responses: {
    200: { description: '飲品類型更新成功', content: { 'application/json': { schema: catalogGroupSummarySchema } } },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
    404: { description: '找不到這個飲品類型', content: { 'application/json': { schema: errorSchema } } },
  },
})

const deleteGroupRoute = createRoute({
  method: 'delete',
  path: '/groups/{id}',
  middleware: [requireDeviceToken] as const,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    204: { description: '飲品類型已刪除' },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
    404: { description: '找不到這個飲品類型', content: { 'application/json': { schema: errorSchema } } },
    409: { description: '這個類型底下還有品項，需要先刪除或搬移品項', content: { 'application/json': { schema: errorSchema } } },
  },
})

const createItemRoute = createRoute({
  method: 'post',
  path: '/items',
  middleware: [requireDeviceToken] as const,
  request: { body: { content: { 'application/json': { schema: createCatalogItemRequestSchema } } } },
  responses: {
    201: { description: '飲料品項建立成功', content: { 'application/json': { schema: catalogItemSchema } } },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
    404: { description: '找不到對應的飲品類型', content: { 'application/json': { schema: errorSchema } } },
  },
})

const updateItemRoute = createRoute({
  method: 'put',
  path: '/items/{id}',
  middleware: [requireDeviceToken] as const,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: { content: { 'application/json': { schema: updateCatalogItemRequestSchema } } },
  },
  responses: {
    200: { description: '飲料品項更新成功', content: { 'application/json': { schema: catalogItemSchema } } },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
    404: { description: '找不到這個品項或對應的飲品類型', content: { 'application/json': { schema: errorSchema } } },
  },
})

const deleteItemRoute = createRoute({
  method: 'delete',
  path: '/items/{id}',
  middleware: [requireDeviceToken] as const,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    204: { description: '飲料品項已刪除' },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
    404: { description: '找不到這個品項', content: { 'application/json': { schema: errorSchema } } },
  },
})

const createAddOnRoute = createRoute({
  method: 'post',
  path: '/add-ons',
  middleware: [requireDeviceToken] as const,
  request: { body: { content: { 'application/json': { schema: createAddOnOptionRequestSchema } } } },
  responses: {
    201: { description: '配料建立成功', content: { 'application/json': { schema: addOnOptionSchema } } },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
  },
})

const updateAddOnRoute = createRoute({
  method: 'put',
  path: '/add-ons/{id}',
  middleware: [requireDeviceToken] as const,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: { content: { 'application/json': { schema: updateAddOnOptionRequestSchema } } },
  },
  responses: {
    200: { description: '配料更新成功', content: { 'application/json': { schema: addOnOptionSchema } } },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
    404: { description: '找不到這個配料', content: { 'application/json': { schema: errorSchema } } },
  },
})

const deleteAddOnRoute = createRoute({
  method: 'delete',
  path: '/add-ons/{id}',
  middleware: [requireDeviceToken] as const,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    204: { description: '配料已刪除' },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
    404: { description: '找不到這個配料', content: { 'application/json': { schema: errorSchema } } },
  },
})

export const catalogRoutes = new OpenAPIHono<AppEnv>()
  .openapi(getCatalogRoute, async (c) => {
    const db = c.get('db')

    const [groups, items, addOns] = await Promise.all([
      db.select().from(catalogGroups).all(),
      db.select().from(catalogItems).all(),
      db.select().from(addOnOptions).all(),
    ])

    const itemsByGroup = new Map<string, typeof items>()
    for (const item of items) {
      const list = itemsByGroup.get(item.groupId) ?? []
      list.push(item)
      itemsByGroup.set(item.groupId, list)
    }

    return c.json(
      catalogResponseSchema.parse({
        groups: groups.map((group) => ({
          id: group.id,
          name: group.name,
          type: group.type,
          items: (itemsByGroup.get(group.id) ?? []).map((item) => ({
            id: item.id,
            name: item.name,
            priceL: item.priceL,
            priceBottle: item.priceBottle,
            customized: item.customized,
          })),
        })),
        addOns: addOns.map((addOn) => ({ id: addOn.id, name: addOn.name, price: addOn.price })),
      }),
    )
  })
  .openapi(createGroupRoute, async (c) => {
    const input = c.req.valid('json')
    const db = c.get('db')
    const newGroup = { id: crypto.randomUUID(), ...input }
    await db.insert(catalogGroups).values(newGroup)
    return c.json(newGroup, 201)
  })
  .openapi(updateGroupRoute, async (c) => {
    const { id } = c.req.valid('param')
    const input = c.req.valid('json')
    const db = c.get('db')
    const existing = await db.select().from(catalogGroups).where(eq(catalogGroups.id, id)).get()
    if (!existing) return c.json({ error: '找不到這個飲品類型' }, 404)
    await db.update(catalogGroups).set(input).where(eq(catalogGroups.id, id))
    return c.json({ id, ...input }, 200)
  })
  .openapi(deleteGroupRoute, async (c) => {
    const { id } = c.req.valid('param')
    const db = c.get('db')
    const existing = await db.select().from(catalogGroups).where(eq(catalogGroups.id, id)).get()
    if (!existing) return c.json({ error: '找不到這個飲品類型' }, 404)
    const remainingItems = await db.select().from(catalogItems).where(eq(catalogItems.groupId, id)).all()
    if (remainingItems.length > 0) {
      return c.json({ error: '這個類型底下還有品項，請先刪除或搬移品項' }, 409)
    }
    await db.delete(catalogGroups).where(eq(catalogGroups.id, id))
    return c.body(null, 204)
  })
  .openapi(createItemRoute, async (c) => {
    const input = c.req.valid('json')
    const db = c.get('db')
    const group = await db.select().from(catalogGroups).where(eq(catalogGroups.id, input.groupId)).get()
    if (!group) return c.json({ error: '找不到對應的飲品類型' }, 404)
    const newItem = { id: crypto.randomUUID(), ...input }
    await db.insert(catalogItems).values(newItem)
    return c.json(
      { id: newItem.id, name: newItem.name, priceL: newItem.priceL, priceBottle: newItem.priceBottle, customized: newItem.customized },
      201,
    )
  })
  .openapi(updateItemRoute, async (c) => {
    const { id } = c.req.valid('param')
    const input = c.req.valid('json')
    const db = c.get('db')
    const existing = await db.select().from(catalogItems).where(eq(catalogItems.id, id)).get()
    if (!existing) return c.json({ error: '找不到這個品項' }, 404)
    const group = await db.select().from(catalogGroups).where(eq(catalogGroups.id, input.groupId)).get()
    if (!group) return c.json({ error: '找不到對應的飲品類型' }, 404)
    await db.update(catalogItems).set(input).where(eq(catalogItems.id, id))
    return c.json({ id, name: input.name, priceL: input.priceL, priceBottle: input.priceBottle, customized: input.customized }, 200)
  })
  .openapi(deleteItemRoute, async (c) => {
    const { id } = c.req.valid('param')
    const db = c.get('db')
    const existing = await db.select().from(catalogItems).where(eq(catalogItems.id, id)).get()
    if (!existing) return c.json({ error: '找不到這個品項' }, 404)
    await db.delete(catalogItems).where(eq(catalogItems.id, id))
    return c.body(null, 204)
  })
  .openapi(createAddOnRoute, async (c) => {
    const input = c.req.valid('json')
    const db = c.get('db')
    const newAddOn = { id: crypto.randomUUID(), ...input }
    await db.insert(addOnOptions).values(newAddOn)
    return c.json(newAddOn, 201)
  })
  .openapi(updateAddOnRoute, async (c) => {
    const { id } = c.req.valid('param')
    const input = c.req.valid('json')
    const db = c.get('db')
    const existing = await db.select().from(addOnOptions).where(eq(addOnOptions.id, id)).get()
    if (!existing) return c.json({ error: '找不到這個配料' }, 404)
    await db.update(addOnOptions).set(input).where(eq(addOnOptions.id, id))
    return c.json({ id, ...input }, 200)
  })
  .openapi(deleteAddOnRoute, async (c) => {
    const { id } = c.req.valid('param')
    const db = c.get('db')
    const existing = await db.select().from(addOnOptions).where(eq(addOnOptions.id, id)).get()
    if (!existing) return c.json({ error: '找不到這個配料' }, 404)
    await db.delete(addOnOptions).where(eq(addOnOptions.id, id))
    return c.body(null, 204)
  })
