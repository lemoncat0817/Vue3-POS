import { z } from 'zod'

// 伺服端菜單 schema：價格為 number，不支援容器時為 null，避免前端表單舊有 'none' 字面值混用。

export const drinkCustomizedSchema = z.enum(['none', 'cold', 'both'])
export type DrinkCustomized = z.infer<typeof drinkCustomizedSchema>

/** 庫存數量。`null` 代表不追蹤庫存，非負整數代表剩餘可售量。扣至 0 會標示缺貨。 */
export const catalogStockSchema = z.number().int().nonnegative().nullable()

export const catalogItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  priceL: z.number().int().nonnegative().nullable(),
  priceBottle: z.number().int().nonnegative().nullable(),
  customized: drinkCustomizedSchema,
  stock: catalogStockSchema,
})
export type CatalogItem = z.infer<typeof catalogItemSchema>

/** 飲品類型（不含底下品項），菜單管理寫入 API 的建立／更新回應用這個形狀。 */
export const catalogGroupSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.string().min(1),
})
export type CatalogGroupSummary = z.infer<typeof catalogGroupSummarySchema>

export const catalogGroupSchema = catalogGroupSummarySchema.extend({
  items: z.array(catalogItemSchema),
})
export type CatalogGroup = z.infer<typeof catalogGroupSchema>

export const addOnOptionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  price: z.number().int().nonnegative(),
  stock: catalogStockSchema,
})
export type AddOnOption = z.infer<typeof addOnOptionSchema>

export const catalogResponseSchema = z.object({
  groups: z.array(catalogGroupSchema),
  addOns: z.array(addOnOptionSchema),
})
export type CatalogResponse = z.infer<typeof catalogResponseSchema>

/** 菜單管理寫入 API 請求 schema。資源 ID 一律由伺服端配發。 */
export const createCatalogGroupRequestSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
})
export type CreateCatalogGroupRequest = z.infer<typeof createCatalogGroupRequestSchema>

export const updateCatalogGroupRequestSchema = createCatalogGroupRequestSchema
export type UpdateCatalogGroupRequest = z.infer<typeof updateCatalogGroupRequestSchema>

export const createCatalogItemRequestSchema = z.object({
  groupId: z.string().min(1),
  name: z.string().min(1),
  priceL: z.number().int().nonnegative().nullable(),
  priceBottle: z.number().int().nonnegative().nullable(),
  customized: drinkCustomizedSchema,
  stock: catalogStockSchema,
})
export type CreateCatalogItemRequest = z.infer<typeof createCatalogItemRequestSchema>

export const updateCatalogItemRequestSchema = createCatalogItemRequestSchema
export type UpdateCatalogItemRequest = z.infer<typeof updateCatalogItemRequestSchema>

export const createAddOnOptionRequestSchema = z.object({
  name: z.string().min(1),
  price: z.number().int().nonnegative(),
  stock: catalogStockSchema,
})
export type CreateAddOnOptionRequest = z.infer<typeof createAddOnOptionRequestSchema>

export const updateAddOnOptionRequestSchema = createAddOnOptionRequestSchema
export type UpdateAddOnOptionRequest = z.infer<typeof updateAddOnOptionRequestSchema>
