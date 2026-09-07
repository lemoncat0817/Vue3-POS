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

export const catalogGroupSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.string().min(1),
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
