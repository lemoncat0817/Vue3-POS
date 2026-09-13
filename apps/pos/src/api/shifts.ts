import {
  shiftSchema,
  type CloseShiftRequest,
  type OpenShiftRequest,
  type AddCashMovementRequest,
  type Shift
} from '@pos/contract'
import { ApiError, fetchJson } from './http'

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
    body: JSON.stringify(input)
  })
  return shiftSchema.parse(body)
}

export async function addCashMovement(
  shiftId: string,
  input: AddCashMovementRequest
): Promise<Shift> {
  const body = await fetchJson<unknown>(
    `/api/shifts/${encodeURIComponent(shiftId)}/cash-movements`,
    {
      method: 'POST',
      body: JSON.stringify(input)
    }
  )
  return shiftSchema.parse(body)
}

export async function closeShift(shiftId: string, input: CloseShiftRequest): Promise<Shift> {
  const body = await fetchJson<unknown>(`/api/shifts/${encodeURIComponent(shiftId)}/close`, {
    method: 'POST',
    body: JSON.stringify(input)
  })
  return shiftSchema.parse(body)
}
