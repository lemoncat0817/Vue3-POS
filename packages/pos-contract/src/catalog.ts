import { z } from 'zod'

export const modifierSelectionTypeSchema = z.enum(['single', 'multiple'])
export type ModifierSelectionType = z.infer<typeof modifierSelectionTypeSchema>

export const catalogStockSchema = z.number().int().nonnegative().nullable()

export const modifierOptionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  priceDelta: z.number().int(),
  stock: catalogStockSchema
})
export type ModifierOption = z.infer<typeof modifierOptionSchema>

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

export const catalogResponseSchema = z.object({
  categories: z.array(categorySchema),
  products: z.array(productSchema),
  modifierGroups: z.array(modifierGroupSchema)
})
export type CatalogResponse = z.infer<typeof catalogResponseSchema>

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
