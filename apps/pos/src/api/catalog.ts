import {
  addOnOptionSchema,
  categorySchema,
  catalogResponseSchema,
  modifierGroupSchema,
  productSchema,
  type AddOnOption,
  type Category,
  type CatalogResponse,
  type CreateAddOnOptionRequest,
  type CreateCategoryRequest,
  type CreateModifierGroupRequest,
  type CreateProductRequest,
  type ModifierGroup,
  type Product
} from '@pos/contract'
import { fetchJson } from './http'
import type {
  AddOnOption as LocalAddOnOption,
  Category as LocalCategory,
  ModifierGroup as LocalModifierGroup,
  Product as LocalProduct
} from '@/types/catalog'

/** 查詢菜單目錄（GET /api/catalog）。 */
export async function fetchCatalog(): Promise<CatalogResponse> {
  const body = await fetchJson<unknown>('/api/catalog')
  return catalogResponseSchema.parse(body)
}

export function toLocalCategories(catalog: CatalogResponse): LocalCategory[] {
  return catalog.categories.map((category) => ({ id: category.id, name: category.name }))
}

export function toLocalProducts(catalog: CatalogResponse): LocalProduct[] {
  return catalog.products.map((product) => ({
    id: product.id,
    categoryId: product.categoryId,
    name: product.name,
    basePrice: product.basePrice,
    stock: product.stock,
    modifierGroupIds: product.modifierGroupIds
  }))
}

export function toLocalModifierGroups(catalog: CatalogResponse): LocalModifierGroup[] {
  return catalog.modifierGroups.map((group) => ({
    id: group.id,
    name: group.name,
    selectionType: group.selectionType,
    required: group.required,
    options: group.options.map((option) => ({
      id: option.id,
      name: option.name,
      priceDelta: option.priceDelta
    }))
  }))
}

export function toLocalAddOns(catalog: CatalogResponse): LocalAddOnOption[] {
  return catalog.addOns.map((addOn) => ({
    id: addOn.id,
    name: addOn.name,
    price: addOn.price,
    stock: addOn.stock
  }))
}

// 後台商品管理 API（分類、品項、規格群組、加購選項之 CRUD）。

export async function createCategory(input: CreateCategoryRequest): Promise<Category> {
  const body = await fetchJson<unknown>('/api/catalog/categories', {
    method: 'POST',
    body: JSON.stringify(input)
  })
  return categorySchema.parse(body)
}

export async function updateCategory(id: string, input: CreateCategoryRequest): Promise<Category> {
  const body = await fetchJson<unknown>(`/api/catalog/categories/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input)
  })
  return categorySchema.parse(body)
}

export async function deleteCategory(id: string): Promise<void> {
  await fetchJson<null>(`/api/catalog/categories/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function createProduct(input: CreateProductRequest): Promise<Product> {
  const body = await fetchJson<unknown>('/api/catalog/products', {
    method: 'POST',
    body: JSON.stringify(input)
  })
  return productSchema.parse(body)
}

export async function updateProduct(id: string, input: CreateProductRequest): Promise<Product> {
  const body = await fetchJson<unknown>(`/api/catalog/products/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input)
  })
  return productSchema.parse(body)
}

export async function deleteProduct(id: string): Promise<void> {
  await fetchJson<null>(`/api/catalog/products/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function createModifierGroup(
  input: CreateModifierGroupRequest
): Promise<ModifierGroup> {
  const body = await fetchJson<unknown>('/api/catalog/modifier-groups', {
    method: 'POST',
    body: JSON.stringify(input)
  })
  return modifierGroupSchema.parse(body)
}

export async function updateModifierGroup(
  id: string,
  input: CreateModifierGroupRequest
): Promise<ModifierGroup> {
  const body = await fetchJson<unknown>(`/api/catalog/modifier-groups/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input)
  })
  return modifierGroupSchema.parse(body)
}

export async function deleteModifierGroup(id: string): Promise<void> {
  await fetchJson<null>(`/api/catalog/modifier-groups/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  })
}

export async function createAddOnOption(input: CreateAddOnOptionRequest): Promise<AddOnOption> {
  const body = await fetchJson<unknown>('/api/catalog/add-ons', {
    method: 'POST',
    body: JSON.stringify(input)
  })
  return addOnOptionSchema.parse(body)
}

export async function updateAddOnOption(
  id: string,
  input: CreateAddOnOptionRequest
): Promise<AddOnOption> {
  const body = await fetchJson<unknown>(`/api/catalog/add-ons/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input)
  })
  return addOnOptionSchema.parse(body)
}

export async function deleteAddOnOption(id: string): Promise<void> {
  await fetchJson<null>(`/api/catalog/add-ons/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
