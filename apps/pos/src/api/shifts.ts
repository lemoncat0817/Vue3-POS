import { shiftSchema, type CloseShiftRequest, type OpenShiftRequest, type AddCashMovementRequest, type Shift } from '@pos/contract'
import { ApiError, fetchJson } from './http'

/**
 * 對應 apps/api/src/routes/shifts.ts（P6：規劃書 §10 P0「班別結帳」）。
 * 跟訂單一樣，開帳／現金異動／收班都是異動性端點，需要裝置憑證。
 */

/** 目前開帳中的班別；沒有開帳中的班別時回傳 null（對應伺服端的 404），不是拋例外——「還沒開帳」是點餐頁的正常狀態之一。 */
export async function fetchCurrentShift(): Promise<Shift | null> {
  try {
    const body = await fetchJson<unknown>('/api/shifts/current')
    return shiftSchema.parse(body)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null
    throw err
  }
}

export async function openShift(input: OpenShiftRequest): Promise<Shift> {
  const body = await fetchJson<unknown>('/api/shifts', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return shiftSchema.parse(body)
}

export async function addCashMovement(shiftId: string, input: AddCashMovementRequest): Promise<Shift> {
  const body = await fetchJson<unknown>(`/api/shifts/${encodeURIComponent(shiftId)}/cash-movements`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return shiftSchema.parse(body)
}

export async function closeShift(shiftId: string, input: CloseShiftRequest): Promise<Shift> {
  const body = await fetchJson<unknown>(`/api/shifts/${encodeURIComponent(shiftId)}/close`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return shiftSchema.parse(body)
}
