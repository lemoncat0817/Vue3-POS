import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { and, eq } from 'drizzle-orm'
import {
  addOnOptionSchema,
  categorySchema,
  catalogResponseSchema,
  createAddOnOptionRequestSchema,
  createCategoryRequestSchema,
  createModifierGroupRequestSchema,
  createProductRequestSchema,
  modifierGroupSchema,
  productSchema,
  updateAddOnOptionRequestSchema,
  updateCategoryRequestSchema,
  updateModifierGroupRequestSchema,
  updateProductRequestSchema
} from '@pos/contract'
import {
  addOnOptions,
  categories,
  modifierGroups,
  modifierOptions,
  productModifierGroups,
  products
} from '../db/schema'
import { requireCapability } from '../middleware/require-capability'
import { requireDeviceToken } from '../middleware/require-device-token'
import { tenantFilter } from '../db/tenant-scope'
import type { AnyDb } from '../db/types'
import type { AppEnv } from '../types'

const errorSchema = z.object({ error: z.string() })

const getCatalogRoute = createRoute({
  method: 'get',
  path: '/',
  middleware: [requireDeviceToken] as const,
  responses: {
    200: {
      description: '目前的菜單（分類、品項、規格群組、加購選項）',
      content: { 'application/json': { schema: catalogResponseSchema } }
    }
  }
})

/** 菜單管理寫入 API：支援分類、品項、規格群組與加購選項之後台維護。 */
const createCategoryRoute = createRoute({
  method: 'post',
  path: '/categories',
  middleware: [requireDeviceToken, requireCapability('canSetCategory')] as const,
  request: { body: { content: { 'application/json': { schema: createCategoryRequestSchema } } } },
  responses: {
    201: {
      description: '分類建立成功',
      content: { 'application/json': { schema: categorySchema } }
    },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    }
  }
})

const updateCategoryRoute = createRoute({
  method: 'put',
  path: '/categories/{id}',
  middleware: [requireDeviceToken, requireCapability('canSetCategory')] as const,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: { content: { 'application/json': { schema: updateCategoryRequestSchema } } }
  },
  responses: {
    200: {
      description: '分類更新成功',
      content: { 'application/json': { schema: categorySchema } }
    },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    },
    404: { description: '找不到這個分類', content: { 'application/json': { schema: errorSchema } } }
  }
})

const deleteCategoryRoute = createRoute({
  method: 'delete',
  path: '/categories/{id}',
  middleware: [requireDeviceToken, requireCapability('canSetCategory')] as const,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    204: { description: '分類已刪除' },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    },
    404: {
      description: '找不到這個分類',
      content: { 'application/json': { schema: errorSchema } }
    },
    409: {
      description: '這個分類底下還有品項，需要先刪除或搬移品項',
      content: { 'application/json': { schema: errorSchema } }
    }
  }
})

const createProductRoute = createRoute({
  method: 'post',
  path: '/products',
  middleware: [requireDeviceToken, requireCapability('canSetProduct')] as const,
  request: { body: { content: { 'application/json': { schema: createProductRequestSchema } } } },
  responses: {
    201: {
      description: '品項建立成功',
      content: { 'application/json': { schema: productSchema } }
    },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    },
    404: {
      description: '找不到對應的分類或規格群組',
      content: { 'application/json': { schema: errorSchema } }
    }
  }
})

const updateProductRoute = createRoute({
  method: 'put',
  path: '/products/{id}',
  middleware: [requireDeviceToken, requireCapability('canSetProduct')] as const,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: { content: { 'application/json': { schema: updateProductRequestSchema } } }
  },
  responses: {
    200: {
      description: '品項更新成功',
      content: { 'application/json': { schema: productSchema } }
    },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    },
    404: {
      description: '找不到這個品項或對應的分類／規格群組',
      content: { 'application/json': { schema: errorSchema } }
    }
  }
})

const deleteProductRoute = createRoute({
  method: 'delete',
  path: '/products/{id}',
  middleware: [requireDeviceToken, requireCapability('canSetProduct')] as const,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    204: { description: '品項已刪除' },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    },
    404: { description: '找不到這個品項', content: { 'application/json': { schema: errorSchema } } }
  }
})

const createModifierGroupRoute = createRoute({
  method: 'post',
  path: '/modifier-groups',
  middleware: [requireDeviceToken, requireCapability('canSetProduct')] as const,
  request: {
    body: { content: { 'application/json': { schema: createModifierGroupRequestSchema } } }
  },
  responses: {
    201: {
      description: '規格群組建立成功',
      content: { 'application/json': { schema: modifierGroupSchema } }
    },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    }
  }
})

const updateModifierGroupRoute = createRoute({
  method: 'put',
  path: '/modifier-groups/{id}',
  middleware: [requireDeviceToken, requireCapability('canSetProduct')] as const,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: { content: { 'application/json': { schema: updateModifierGroupRequestSchema } } }
  },
  responses: {
    200: {
      description: '規格群組更新成功',
      content: { 'application/json': { schema: modifierGroupSchema } }
    },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    },
    404: {
      description: '找不到這個規格群組',
      content: { 'application/json': { schema: errorSchema } }
    }
  }
})

const deleteModifierGroupRoute = createRoute({
  method: 'delete',
  path: '/modifier-groups/{id}',
  middleware: [requireDeviceToken, requireCapability('canSetProduct')] as const,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    204: { description: '規格群組已刪除' },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    },
    404: {
      description: '找不到這個規格群組',
      content: { 'application/json': { schema: errorSchema } }
    }
  }
})

const createAddOnRoute = createRoute({
  method: 'post',
  path: '/add-ons',
  middleware: [requireDeviceToken, requireCapability('canSetAddOns')] as const,
  request: {
    body: { content: { 'application/json': { schema: createAddOnOptionRequestSchema } } }
  },
  responses: {
    201: {
      description: '加購選項建立成功',
      content: { 'application/json': { schema: addOnOptionSchema } }
    },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    }
  }
})

const updateAddOnRoute = createRoute({
  method: 'put',
  path: '/add-ons/{id}',
  middleware: [requireDeviceToken, requireCapability('canSetAddOns')] as const,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: { content: { 'application/json': { schema: updateAddOnOptionRequestSchema } } }
  },
  responses: {
    200: {
      description: '加購選項更新成功',
      content: { 'application/json': { schema: addOnOptionSchema } }
    },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    },
    404: {
      description: '找不到這個加購選項',
      content: { 'application/json': { schema: errorSchema } }
    }
  }
})

const deleteAddOnRoute = createRoute({
  method: 'delete',
  path: '/add-ons/{id}',
  middleware: [requireDeviceToken, requireCapability('canSetAddOns')] as const,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    204: { description: '加購選項已刪除' },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    },
    404: {
      description: '找不到這個加購選項',
      content: { 'application/json': { schema: errorSchema } }
    }
  }
})

/** 一次寫入規格群組的所有選項：先刪光現有選項再整批重建，避免逐筆 diff 的複雜度。 */
async function replaceModifierOptions(
  db: AnyDb,
  groupId: string,
  tenantId: string | null,
  options: { name: string; priceDelta: number }[]
) {
  await db.delete(modifierOptions).where(eq(modifierOptions.groupId, groupId))
  if (options.length === 0) return
  await db
    .insert(modifierOptions)
    .values(options.map((option) => ({ id: crypto.randomUUID(), tenantId, groupId, ...option })))
}

async function loadModifierGroup(db: AnyDb, id: string, tenantId: string | null) {
  const group = await db
    .select()
    .from(modifierGroups)
    .where(and(eq(modifierGroups.id, id), tenantFilter(modifierGroups.tenantId, tenantId)))
    .get()
  if (!group) return null
  const options = await db
    .select()
    .from(modifierOptions)
    .where(eq(modifierOptions.groupId, id))
    .all()
  return modifierGroupSchema.parse({
    id: group.id,
    name: group.name,
    selectionType: group.selectionType,
    required: group.required,
    options: options.map((option) => ({
      id: option.id,
      name: option.name,
      priceDelta: option.priceDelta
    }))
  })
}

/** 一次寫入品項掛用的規格群組：先刪光現有關聯再整批重建。 */
async function replaceProductModifierGroups(
  db: AnyDb,
  productId: string,
  tenantId: string | null,
  groupIds: string[]
) {
  await db.delete(productModifierGroups).where(eq(productModifierGroups.productId, productId))
  if (groupIds.length === 0) return
  await db
    .insert(productModifierGroups)
    .values(groupIds.map((groupId) => ({ tenantId, productId, groupId })))
}

export const catalogRoutes = new OpenAPIHono<AppEnv>()
  .openapi(getCatalogRoute, async (c) => {
    const db = c.get('db')
    const tenantId = c.get('tenantId')

    const [categoryRows, productRows, groupRows, optionRows, productGroupRows, addOns] =
      await Promise.all([
        db
          .select()
          .from(categories)
          .where(tenantFilter(categories.tenantId, tenantId))
          .all(),
        db
          .select()
          .from(products)
          .where(tenantFilter(products.tenantId, tenantId))
          .all(),
        db
          .select()
          .from(modifierGroups)
          .where(tenantFilter(modifierGroups.tenantId, tenantId))
          .all(),
        db
          .select()
          .from(modifierOptions)
          .where(tenantFilter(modifierOptions.tenantId, tenantId))
          .all(),
        db
          .select()
          .from(productModifierGroups)
          .where(tenantFilter(productModifierGroups.tenantId, tenantId))
          .all(),
        db
          .select()
          .from(addOnOptions)
          .where(tenantFilter(addOnOptions.tenantId, tenantId))
          .all()
      ])

    const optionsByGroup = new Map<string, typeof optionRows>()
    for (const option of optionRows) {
      const list = optionsByGroup.get(option.groupId) ?? []
      list.push(option)
      optionsByGroup.set(option.groupId, list)
    }
    const groupIdsByProduct = new Map<string, string[]>()
    for (const row of productGroupRows) {
      const list = groupIdsByProduct.get(row.productId) ?? []
      list.push(row.groupId)
      groupIdsByProduct.set(row.productId, list)
    }

    return c.json(
      catalogResponseSchema.parse({
        categories: categoryRows.map((category) => ({ id: category.id, name: category.name })),
        products: productRows.map((product) => ({
          id: product.id,
          categoryId: product.categoryId,
          name: product.name,
          basePrice: product.basePrice,
          stock: product.stock,
          modifierGroupIds: groupIdsByProduct.get(product.id) ?? []
        })),
        modifierGroups: groupRows.map((group) => ({
          id: group.id,
          name: group.name,
          selectionType: group.selectionType,
          required: group.required,
          options: (optionsByGroup.get(group.id) ?? []).map((option) => ({
            id: option.id,
            name: option.name,
            priceDelta: option.priceDelta
          }))
        })),
        addOns: addOns.map((addOn) => ({
          id: addOn.id,
          name: addOn.name,
          price: addOn.price,
          stock: addOn.stock
        }))
      })
    )
  })
  .openapi(createCategoryRoute, async (c) => {
    const input = c.req.valid('json')
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const newCategory = { id: crypto.randomUUID(), tenantId, ...input }
    await db.insert(categories).values(newCategory)
    return c.json(newCategory, 201)
  })
  .openapi(updateCategoryRoute, async (c) => {
    const { id } = c.req.valid('param')
    const input = c.req.valid('json')
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const existing = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), tenantFilter(categories.tenantId, tenantId)))
      .get()
    if (!existing) return c.json({ error: '找不到這個分類' }, 404)
    await db.update(categories).set(input).where(eq(categories.id, id))
    return c.json({ id, ...input }, 200)
  })
  .openapi(deleteCategoryRoute, async (c) => {
    const { id } = c.req.valid('param')
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const existing = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), tenantFilter(categories.tenantId, tenantId)))
      .get()
    if (!existing) return c.json({ error: '找不到這個分類' }, 404)
    const remainingProducts = await db
      .select()
      .from(products)
      .where(eq(products.categoryId, id))
      .all()
    if (remainingProducts.length > 0) {
      return c.json({ error: '這個分類底下還有品項，請先刪除或搬移品項' }, 409)
    }
    await db.delete(categories).where(eq(categories.id, id))
    return c.body(null, 204)
  })
  .openapi(createProductRoute, async (c) => {
    const input = c.req.valid('json')
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const category = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, input.categoryId), tenantFilter(categories.tenantId, tenantId)))
      .get()
    if (!category) return c.json({ error: '找不到對應的分類' }, 404)
    for (const groupId of input.modifierGroupIds) {
      const group = await db
        .select()
        .from(modifierGroups)
        .where(and(eq(modifierGroups.id, groupId), tenantFilter(modifierGroups.tenantId, tenantId)))
        .get()
      if (!group) return c.json({ error: `找不到規格群組 ${groupId}` }, 404)
    }
    const newProduct = {
      id: crypto.randomUUID(),
      tenantId,
      categoryId: input.categoryId,
      name: input.name,
      basePrice: input.basePrice,
      stock: input.stock
    }
    await db.insert(products).values(newProduct)
    await replaceProductModifierGroups(db, newProduct.id, tenantId, input.modifierGroupIds)
    return c.json({ ...newProduct, modifierGroupIds: input.modifierGroupIds }, 201)
  })
  .openapi(updateProductRoute, async (c) => {
    const { id } = c.req.valid('param')
    const input = c.req.valid('json')
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const existing = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), tenantFilter(products.tenantId, tenantId)))
      .get()
    if (!existing) return c.json({ error: '找不到這個品項' }, 404)
    const category = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, input.categoryId), tenantFilter(categories.tenantId, tenantId)))
      .get()
    if (!category) return c.json({ error: '找不到對應的分類' }, 404)
    for (const groupId of input.modifierGroupIds) {
      const group = await db
        .select()
        .from(modifierGroups)
        .where(and(eq(modifierGroups.id, groupId), tenantFilter(modifierGroups.tenantId, tenantId)))
        .get()
      if (!group) return c.json({ error: `找不到規格群組 ${groupId}` }, 404)
    }
    await db
      .update(products)
      .set({
        categoryId: input.categoryId,
        name: input.name,
        basePrice: input.basePrice,
        stock: input.stock
      })
      .where(eq(products.id, id))
    await replaceProductModifierGroups(db, id, tenantId, input.modifierGroupIds)
    return c.json({ id, ...input }, 200)
  })
  .openapi(deleteProductRoute, async (c) => {
    const { id } = c.req.valid('param')
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const existing = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), tenantFilter(products.tenantId, tenantId)))
      .get()
    if (!existing) return c.json({ error: '找不到這個品項' }, 404)
    await db.delete(productModifierGroups).where(eq(productModifierGroups.productId, id))
    await db.delete(products).where(eq(products.id, id))
    return c.body(null, 204)
  })
  .openapi(createModifierGroupRoute, async (c) => {
    const input = c.req.valid('json')
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const newGroup = {
      id: crypto.randomUUID(),
      tenantId,
      name: input.name,
      selectionType: input.selectionType,
      required: input.required
    }
    await db.insert(modifierGroups).values(newGroup)
    await replaceModifierOptions(db, newGroup.id, tenantId, input.options)
    const created = await loadModifierGroup(db, newGroup.id, tenantId)
    return c.json(created!, 201)
  })
  .openapi(updateModifierGroupRoute, async (c) => {
    const { id } = c.req.valid('param')
    const input = c.req.valid('json')
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const existing = await db
      .select()
      .from(modifierGroups)
      .where(and(eq(modifierGroups.id, id), tenantFilter(modifierGroups.tenantId, tenantId)))
      .get()
    if (!existing) return c.json({ error: '找不到這個規格群組' }, 404)
    await db
      .update(modifierGroups)
      .set({ name: input.name, selectionType: input.selectionType, required: input.required })
      .where(eq(modifierGroups.id, id))
    await replaceModifierOptions(db, id, tenantId, input.options)
    const updated = await loadModifierGroup(db, id, tenantId)
    return c.json(updated!, 200)
  })
  .openapi(deleteModifierGroupRoute, async (c) => {
    const { id } = c.req.valid('param')
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const existing = await db
      .select()
      .from(modifierGroups)
      .where(and(eq(modifierGroups.id, id), tenantFilter(modifierGroups.tenantId, tenantId)))
      .get()
    if (!existing) return c.json({ error: '找不到這個規格群組' }, 404)
    await db.delete(modifierOptions).where(eq(modifierOptions.groupId, id))
    await db.delete(productModifierGroups).where(eq(productModifierGroups.groupId, id))
    await db.delete(modifierGroups).where(eq(modifierGroups.id, id))
    return c.body(null, 204)
  })
  .openapi(createAddOnRoute, async (c) => {
    const input = c.req.valid('json')
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const newAddOn = { id: crypto.randomUUID(), tenantId, ...input }
    await db.insert(addOnOptions).values(newAddOn)
    return c.json(newAddOn, 201)
  })
  .openapi(updateAddOnRoute, async (c) => {
    const { id } = c.req.valid('param')
    const input = c.req.valid('json')
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const existing = await db
      .select()
      .from(addOnOptions)
      .where(and(eq(addOnOptions.id, id), tenantFilter(addOnOptions.tenantId, tenantId)))
      .get()
    if (!existing) return c.json({ error: '找不到這個加購選項' }, 404)
    await db.update(addOnOptions).set(input).where(eq(addOnOptions.id, id))
    return c.json({ id, ...input }, 200)
  })
  .openapi(deleteAddOnRoute, async (c) => {
    const { id } = c.req.valid('param')
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const existing = await db
      .select()
      .from(addOnOptions)
      .where(and(eq(addOnOptions.id, id), tenantFilter(addOnOptions.tenantId, tenantId)))
      .get()
    if (!existing) return c.json({ error: '找不到這個加購選項' }, 404)
    await db.delete(addOnOptions).where(eq(addOnOptions.id, id))
    return c.body(null, 204)
  })
