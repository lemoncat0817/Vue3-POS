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

/** 對應 GET /api/catalog，回傳前用 Zod 驗證，避免伺服端契約悄悄漂移而不自知。 */
export async function fetchCatalog(): Promise<CatalogResponse> {
  const body = await fetchJson<unknown>('/api/catalog')
  return catalogResponseSchema.parse(body)
}

/**
 * 把伺服端的乾淨型別（price 是 `number | null`）轉成現行前端元件既有的
 * 形狀（不支援時是字面值 `'none'`，見 apps/pos/src/types/drink.ts 的
 * D-19 說明）。轉換只在這個邊界做一次，元件層不需要知道伺服端資料原本
 * 長怎樣。
 */
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
    })),
  }))
}

export function toDrinkAddOnOptions(catalog: CatalogResponse): DrinkAddOnOption[] {
  return catalog.addOns.map((addOn) => ({
    id: addOn.id,
    name: addOn.name,
    price: addOn.price,
  }))
}

// ---------- 後台管理（backgroundSetting/productManagement，見該元件的說明） ----------
//
// P18（規劃書 §10 P18「菜單與權限管理接上伺服端」）：這個頁面原本的
// 新增／編輯／刪除只改本機 drinkStore 狀態，從來沒有呼叫過任何 API。
// 下面這幾個函式補上對應的伺服端呼叫，跟 promotions.ts 對 offerSetting
// 頁面的做法一致。

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
