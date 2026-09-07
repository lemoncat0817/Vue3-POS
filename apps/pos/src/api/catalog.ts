import { catalogResponseSchema, type CatalogResponse } from '@pos/contract'
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
