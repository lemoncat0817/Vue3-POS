import {
  moneyCouponSchema,
  percentCouponSchema,
  promotionsResponseSchema,
  quickDiscountSchema,
  type MoneyCoupon,
  type PercentCoupon,
  type PromotionsResponse,
  type QuickDiscount as ApiQuickDiscount,
} from '@pos/contract'
import { fetchJson } from './http'
import type { MoneyDiscount, PercentDiscount, QuickDiscount } from '@/types/discount'

/** 查詢促銷設定（GET /api/promotions）。 */
export async function fetchPromotions(): Promise<PromotionsResponse> {
  const body = await fetchJson<unknown>('/api/promotions')
  return promotionsResponseSchema.parse(body)
}

// 後台優惠設定 API（現金券、折數券、快速折扣之 CRUD）。

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

export async function createQuickDiscount(input: { name: string; kind: 'amount' | 'percent'; value: number }): Promise<ApiQuickDiscount> {
  const body = await fetchJson<unknown>('/api/promotions/quick-discounts', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return quickDiscountSchema.parse(body)
}

export async function updateQuickDiscount(
  id: string,
  input: { name: string; kind: 'amount' | 'percent'; value: number },
): Promise<ApiQuickDiscount> {
  const body = await fetchJson<unknown>(`/api/promotions/quick-discounts/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
  return quickDiscountSchema.parse(body)
}

export async function deleteQuickDiscount(id: string): Promise<void> {
  await fetchJson<null>(`/api/promotions/quick-discounts/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function toMoneyDiscounts(promotions: PromotionsResponse): MoneyDiscount[] {
  return promotions.moneyCoupons.map((coupon) => ({
    id: coupon.id,
    name: coupon.name,
    discountMoney: coupon.discountMoney,
  }))
}

/** 前端型別 PercentDiscount.discountMoney 實為折數，於此轉換伺服端 discountPercent。 */
export function toPercentDiscounts(promotions: PromotionsResponse): PercentDiscount[] {
  return promotions.percentCoupons.map((coupon) => ({
    id: coupon.id,
    name: coupon.name,
    discountMoney: coupon.discountPercent,
  }))
}

export function toQuickDiscounts(promotions: PromotionsResponse): QuickDiscount[] {
  return promotions.quickDiscounts.map((discount) => ({
    id: discount.id,
    name: discount.name,
    kind: discount.kind,
    value: discount.value,
  }))
}
