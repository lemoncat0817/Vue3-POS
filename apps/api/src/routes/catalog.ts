import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { catalogResponseSchema } from '@pos/contract'
import { addOnOptions, catalogGroups, catalogItems } from '../db/schema'
import type { AppEnv } from '../types'

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

export const catalogRoutes = new OpenAPIHono<AppEnv>().openapi(getCatalogRoute, async (c) => {
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
