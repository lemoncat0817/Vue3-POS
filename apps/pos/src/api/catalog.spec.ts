import { describe, expect, it } from 'vitest'
import type { CatalogResponse } from '@pos/contract'
import { toDrinkAddOnOptions, toDrinkTypeGroups } from './catalog'

/**
 * P3：驗證伺服端菜單資料轉成現行前端元件既有形狀時的轉換規則，尤其是
 * `priceL`／`priceBottle` 從 `number | null`（伺服端的乾淨型別）轉成
 * `FormNumeric | 'none'`（前端既有慣例，見 types/drink.ts 的 D-19 說明）
 * 這一步——這是兩邊型別對不上、最容易轉錯的地方。
 */
const sampleCatalog: CatalogResponse = {
  groups: [
    {
      id: 'group-1',
      name: '原味茶',
      type: 'drinkOriginal',
      items: [
        { id: 'item-1', name: '翡翠綠茶', priceL: 30, priceBottle: 45, customized: 'both' },
        { id: 'item-2', name: '錫蘭紅茶', priceL: 30, priceBottle: null, customized: 'none' },
      ],
    },
  ],
  addOns: [{ id: 'addon-1', name: '珍珠', price: 10 }],
}

describe('toDrinkTypeGroups', () => {
  it('保留 groups／items 的 id、name 等欄位', () => {
    const groups = toDrinkTypeGroups(sampleCatalog)
    expect(groups).toHaveLength(1)
    expect(groups[0]).toMatchObject({ id: 'group-1', name: '原味茶', type: 'drinkOriginal' })
  })

  it('priceBottle 為 null（不支援瓶裝）時轉成字面值 \'none\'', () => {
    const groups = toDrinkTypeGroups(sampleCatalog)
    const [teaWithBottle, teaWithoutBottle] = groups[0]!.drinkList
    expect(teaWithBottle).toMatchObject({ priceL: 30, priceBottle: 45 })
    expect(teaWithoutBottle).toMatchObject({ priceL: 30, priceBottle: 'none' })
  })
})

describe('toDrinkAddOnOptions', () => {
  it('轉成前端加料選項形狀', () => {
    expect(toDrinkAddOnOptions(sampleCatalog)).toEqual([{ id: 'addon-1', name: '珍珠', price: 10 }])
  })
})
