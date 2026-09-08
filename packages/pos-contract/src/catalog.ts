import { z } from 'zod'

/**
 * 菜單相關的 schema。
 *
 * 這是伺服端的新設計，不是照搬 apps/pos 現行的 FormNumeric／'none'
 * 字面值那套（那是既有前端表單輸入造成的型別混用，見 apps/pos/src/
 * types/drink.ts 的說明）。伺服端資料一律由 Zod 解析成乾淨的型別：
 * 價格是 number，容器不支援時是 null，不是字串 'none'。
 */

export const drinkCustomizedSchema = z.enum(['none', 'cold', 'both'])
export type DrinkCustomized = z.infer<typeof drinkCustomizedSchema>

export const catalogItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  priceL: z.number().int().nonnegative().nullable(),
  priceBottle: z.number().int().nonnegative().nullable(),
  customized: drinkCustomizedSchema,
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
})
export type AddOnOption = z.infer<typeof addOnOptionSchema>

export const catalogResponseSchema = z.object({
  groups: z.array(catalogGroupSchema),
  addOns: z.array(addOnOptionSchema),
})
export type CatalogResponse = z.infer<typeof catalogResponseSchema>

/**
 * 菜單管理寫入 API 的請求（P18：規劃書 §10 P18「菜單與權限管理接上
 * 伺服端」）。productManagement.vue 原本的新增／編輯／刪除只改本機
 * Pinia 狀態，從來沒有呼叫過任何 API——換一台裝置或清掉瀏覽器資料
 * 就會遺失異動。id 一律由伺服端配發（見 routes/catalog.ts 的
 * crypto.randomUUID()），不像舊版讓使用者自己輸入數字 id：伺服端資源
 * 的主鍵不應該是使用者填的表單欄位，這裡順便修掉這個既有的設計缺口，
 * 不是刻意要跟舊版行為一致。
 */
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
})
export type CreateCatalogItemRequest = z.infer<typeof createCatalogItemRequestSchema>

export const updateCatalogItemRequestSchema = createCatalogItemRequestSchema
export type UpdateCatalogItemRequest = z.infer<typeof updateCatalogItemRequestSchema>

export const createAddOnOptionRequestSchema = z.object({
  name: z.string().min(1),
  price: z.number().int().nonnegative(),
})
export type CreateAddOnOptionRequest = z.infer<typeof createAddOnOptionRequestSchema>

export const updateAddOnOptionRequestSchema = createAddOnOptionRequestSchema
export type UpdateAddOnOptionRequest = z.infer<typeof updateAddOnOptionRequestSchema>
