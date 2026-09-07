import {
  moneyCouponSchema,
  oftenUseRateSchema,
  percentCouponSchema,
  promotionsResponseSchema,
  type MoneyCoupon,
  type OftenUseRateEntry,
  type PercentCoupon,
  type PromotionsResponse,
} from '@pos/contract'
import { fetchJson } from './http'
import type { MoneyDiscount, OftenUseDiscountList, PercentDiscount } from '@/types/discount'

/** 對應 GET /api/promotions（P5：促銷引擎）。 */
export async function fetchPromotions(): Promise<PromotionsResponse> {
  const body = await fetchJson<unknown>('/api/promotions')
  return promotionsResponseSchema.parse(body)
}

// ---------- 後台管理（backgroundSetting/offerSetting，見該元件的說明） ----------

export async function createMoneyCoupon(input: { name: string; discountMoney: number }): Promise<MoneyCoupon> {
  const body = await fetchJson<unknown>('/api/promotions/money-coupons', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return moneyCouponSchema.parse(body)
}

export async function updateMoneyCoupon(
  id: string,
  input: { name: string; discountMoney: number },
): Promise<MoneyCoupon> {
  const body = await fetchJson<unknown>(`/api/promotions/money-coupons/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
  return moneyCouponSchema.parse(body)
}

export async function deleteMoneyCoupon(id: string): Promise<void> {
  await fetchJson<null>(`/api/promotions/money-coupons/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function createPercentCoupon(input: { name: string; discountPercent: number }): Promise<PercentCoupon> {
  const body = await fetchJson<unknown>('/api/promotions/percent-coupons', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return percentCouponSchema.parse(body)
}

export async function updatePercentCoupon(
  id: string,
  input: { name: string; discountPercent: number },
): Promise<PercentCoupon> {
  const body = await fetchJson<unknown>(`/api/promotions/percent-coupons/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
  return percentCouponSchema.parse(body)
}

export async function deletePercentCoupon(id: string): Promise<void> {
  await fetchJson<null>(`/api/promotions/percent-coupons/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function updateOftenUseRate(
  slot: number,
  input: { name: string; discountMoney: number; discountPercent: number },
): Promise<OftenUseRateEntry> {
  const body = await fetchJson<unknown>(`/api/promotions/often-use-rates/${slot}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
  return oftenUseRateSchema.parse(body)
}

export function toMoneyDiscounts(promotions: PromotionsResponse): MoneyDiscount[] {
  return promotions.moneyCoupons.map((coupon) => ({
    id: coupon.id,
    name: coupon.name,
    discountMoney: coupon.discountMoney,
  }))
}

/**
 * PercentDiscount.discountMoney 其實存的是折數（例如 0.95），跟欄位
 * 名稱字面意義不一致——這是既有前端型別的命名方式（P0 如實保留，不
 * 重新命名，見 types/discount.ts 的說明），伺服端用誠實的
 * `discountPercent` 命名，這裡是唯一需要轉換欄位名稱的地方。
 */
export function toPercentDiscounts(promotions: PromotionsResponse): PercentDiscount[] {
  return promotions.percentCoupons.map((coupon) => ({
    id: coupon.id,
    name: coupon.name,
    discountMoney: coupon.discountPercent,
  }))
}

export function toOftenUseDiscountList(promotions: PromotionsResponse): OftenUseDiscountList {
  const [r0, r1, r2, r3, r4] = promotions.oftenUseRates
  const toEntry = (rate: PromotionsResponse['oftenUseRates'][number]) => ({
    id: rate.slot,
    name: rate.name,
    discountMoney: rate.discountMoney,
    discountPercent: rate.discountPercent,
  })
  return [toEntry(r0), toEntry(r1), toEntry(r2), toEntry(r3), toEntry(r4)]
}
