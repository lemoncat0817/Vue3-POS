import {
  orderCouponSchema,
  promotionsResponseSchema,
  quickDiscountSchema,
  type OrderCoupon as ApiOrderCoupon,
  type PromotionsResponse,
  type QuickDiscount as ApiQuickDiscount
} from '@pos/contract'
import { fetchJson } from './http'
import type { OrderCoupon, QuickDiscount } from '@/types/discount'

export async function fetchPromotions(): Promise<PromotionsResponse> {
  const body = await fetchJson<unknown>('/api/promotions')
  return promotionsResponseSchema.parse(body)
}

export async function createOrderCoupon(input: {
  name: string
  kind: 'amount' | 'percent'
  value: number
}): Promise<ApiOrderCoupon> {
  const body = await fetchJson<unknown>('/api/promotions/order-coupons', {
    method: 'POST',
    body: JSON.stringify(input)
  })
  return orderCouponSchema.parse(body)
}

export async function updateOrderCoupon(
  id: string,
  input: { name: string; kind: 'amount' | 'percent'; value: number }
): Promise<ApiOrderCoupon> {
  const body = await fetchJson<unknown>(`/api/promotions/order-coupons/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input)
  })
  return orderCouponSchema.parse(body)
}

export async function deleteOrderCoupon(id: string): Promise<void> {
  await fetchJson<null>(`/api/promotions/order-coupons/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  })
}

export async function createQuickDiscount(input: {
  name: string
  kind: 'amount' | 'percent'
  value: number
}): Promise<ApiQuickDiscount> {
  const body = await fetchJson<unknown>('/api/promotions/quick-discounts', {
    method: 'POST',
    body: JSON.stringify(input)
  })
  return quickDiscountSchema.parse(body)
}

export async function updateQuickDiscount(
  id: string,
  input: { name: string; kind: 'amount' | 'percent'; value: number }
): Promise<ApiQuickDiscount> {
  const body = await fetchJson<unknown>(
    `/api/promotions/quick-discounts/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      body: JSON.stringify(input)
    }
  )
  return quickDiscountSchema.parse(body)
}

export async function deleteQuickDiscount(id: string): Promise<void> {
  await fetchJson<null>(`/api/promotions/quick-discounts/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  })
}

export function toOrderCoupons(promotions: PromotionsResponse): OrderCoupon[] {
  return promotions.orderCoupons.map((coupon) => ({
    id: coupon.id,
    name: coupon.name,
    kind: coupon.kind,
    value: coupon.value
  }))
}

export function toQuickDiscounts(promotions: PromotionsResponse): QuickDiscount[] {
  return promotions.quickDiscounts.map((discount) => ({
    id: discount.id,
    name: discount.name,
    kind: discount.kind,
    value: discount.value
  }))
}
