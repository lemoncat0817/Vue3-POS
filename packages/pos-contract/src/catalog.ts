import { z } from 'zod'

// 伺服端菜單 schema：不綁定任何單一餐飲品類，品項只有一個底價，客製化選項
// （尺寸、甜度、熟度……）一律透過可重複掛用的規格群組（modifier group）表達，
// 而不是把「大杯／瓶裝」這類單一品類的容器欄位寫死進品項本身。

export const modifierSelectionTypeSchema = z.enum(['single', 'multiple'])
export type ModifierSelectionType = z.infer<typeof modifierSelectionTypeSchema>

/** 庫存數量。`null` 代表不追蹤庫存，非負整數代表剩餘可售量。扣至 0 會標示缺貨。 */
export const catalogStockSchema = z.number().int().nonnegative().nullable()

export const modifierOptionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  /** 相對於品項底價的加減金額，可為 0、正數（加價）或負數。 */
  priceDelta: z.number().int(),
  /** 庫存數量，語意同 catalogStockSchema。多選群組（加購用途）常見會設定，單選規格通常留 null。 */
  stock: catalogStockSchema
})
export type ModifierOption = z.infer<typeof modifierOptionSchema>

/** 規格群組（例如「甜度」，或加購用途的「加料」），全域定義後可掛在任意數量的品項上；加購只是 selectionType='multiple' 的規格群組。 */
export const modifierGroupSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  selectionType: modifierSelectionTypeSchema,
  required: z.boolean(),
  options: z.array(modifierOptionSchema)
})
export type ModifierGroup = z.infer<typeof modifierGroupSchema>

export const categorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1)
})
export type Category = z.infer<typeof categorySchema>

export const productSchema = z.object({
  id: z.string().min(1),
  categoryId: z.string().min(1),
  name: z.string().min(1),
  basePrice: z.number().int().nonnegative(),
  stock: catalogStockSchema,
  modifierGroupIds: z.array(z.string().min(1))
})
export type Product = z.infer<typeof productSchema>

/** GET /api/catalog 回應：點餐頁一次要用到的完整目錄。 */
export const catalogResponseSchema = z.object({
  categories: z.array(categorySchema),
  products: z.array(productSchema),
  modifierGroups: z.array(modifierGroupSchema)
})
export type CatalogResponse = z.infer<typeof catalogResponseSchema>

// 後台商品管理寫入 API request schema。資源 ID 一律由伺服端配發。

export const createCategoryRequestSchema = z.object({ name: z.string().min(1) })
export type CreateCategoryRequest = z.infer<typeof createCategoryRequestSchema>
export const updateCategoryRequestSchema = createCategoryRequestSchema
export type UpdateCategoryRequest = z.infer<typeof updateCategoryRequestSchema>

export const createProductRequestSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1),
  basePrice: z.number().int().nonnegative(),
  stock: catalogStockSchema,
  modifierGroupIds: z.array(z.string().min(1))
})
export type CreateProductRequest = z.infer<typeof createProductRequestSchema>
export const updateProductRequestSchema = createProductRequestSchema
export type UpdateProductRequest = z.infer<typeof updateProductRequestSchema>

export const createModifierOptionRequestSchema = z.object({
  name: z.string().min(1),
  priceDelta: z.number().int(),
  stock: catalogStockSchema
})
export type CreateModifierOptionRequest = z.infer<typeof createModifierOptionRequestSchema>

export const createModifierGroupRequestSchema = z.object({
  name: z.string().min(1),
  selectionType: modifierSelectionTypeSchema,
  required: z.boolean(),
  options: z.array(createModifierOptionRequestSchema)
})
export type CreateModifierGroupRequest = z.infer<typeof createModifierGroupRequestSchema>
export const updateModifierGroupRequestSchema = createModifierGroupRequestSchema
export type UpdateModifierGroupRequest = z.infer<typeof updateModifierGroupRequestSchema>
