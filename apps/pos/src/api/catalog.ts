import {
  addOnOptionSchema,
  catalogGroupSummarySchema,
  catalogItemSchema,
  catalogResponseSchema,
  type AddOnOption,
  type CatalogGroupSummary,
  type CatalogItem,
  type CatalogResponse,
  type CreateAddOnOptionRequest,
  type CreateCatalogGroupRequest,
  type CreateCatalogItemRequest,
} from '@pos/contract'
import { fetchJson } from './http'
import type { DrinkAddOnOption, DrinkTypeGroup } from '@/types/drink'

/** 查詢菜單目錄（GET /api/catalog）。 */
export async function fetchCatalog(): Promise<CatalogResponse> {
  const body = await fetchJson<unknown>('/api/catalog')
  return catalogResponseSchema.parse(body)
}

/** 將伺服端 catalog 資料轉為前端既有形狀（空價格映射為 'none'）。 */
export function toDrinkTypeGroups(catalog: CatalogResponse): DrinkTypeGroup[] {
  return catalog.groups.map((group) => ({
    id: group.id,
    name: group.name,
    type: group.type,
    drinkList: group.items.map((item) => ({
      id: item.id,
      name: item.name,
      priceL: item.priceL ?? 'none',
      priceBottle: item.priceBottle ?? 'none',
      customized: item.customized,
      stock: item.stock,
    })),
  }))
}

export function toDrinkAddOnOptions(catalog: CatalogResponse): DrinkAddOnOption[] {
  return catalog.addOns.map((addOn) => ({
    id: addOn.id,
    name: addOn.name,
    price: addOn.price,
    stock: addOn.stock,
  }))
}

// 後台菜單管理 API（類別、品項、配料之 CRUD）。

export async function createCatalogGroup(input: CreateCatalogGroupRequest): Promise<CatalogGroupSummary> {
  const body = await fetchJson<unknown>('/api/catalog/groups', { method: 'POST', body: JSON.stringify(input) })
  return catalogGroupSummarySchema.parse(body)
}

export async function updateCatalogGroup(id: string, input: CreateCatalogGroupRequest): Promise<CatalogGroupSummary> {
  const body = await fetchJson<unknown>(`/api/catalog/groups/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
  return catalogGroupSummarySchema.parse(body)
}

export async function deleteCatalogGroup(id: string): Promise<void> {
  await fetchJson<null>(`/api/catalog/groups/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function createCatalogItem(input: CreateCatalogItemRequest): Promise<CatalogItem> {
  const body = await fetchJson<unknown>('/api/catalog/items', { method: 'POST', body: JSON.stringify(input) })
  return catalogItemSchema.parse(body)
}

export async function updateCatalogItem(id: string, input: CreateCatalogItemRequest): Promise<CatalogItem> {
  const body = await fetchJson<unknown>(`/api/catalog/items/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
  return catalogItemSchema.parse(body)
}

export async function deleteCatalogItem(id: string): Promise<void> {
  await fetchJson<null>(`/api/catalog/items/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function createAddOnOption(input: CreateAddOnOptionRequest): Promise<AddOnOption> {
  const body = await fetchJson<unknown>('/api/catalog/add-ons', { method: 'POST', body: JSON.stringify(input) })
  return addOnOptionSchema.parse(body)
}

export async function updateAddOnOption(id: string, input: CreateAddOnOptionRequest): Promise<AddOnOption> {
  const body = await fetchJson<unknown>(`/api/catalog/add-ons/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
  return addOnOptionSchema.parse(body)
}

export async function deleteAddOnOption(id: string): Promise<void> {
  await fetchJson<null>(`/api/catalog/add-ons/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
