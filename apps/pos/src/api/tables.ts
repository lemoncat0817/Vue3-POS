import {
  diningTableSchema,
  type CreateTableRequest,
  type DiningTable,
  type UpdateTableRequest,
  type UpdateTableStatusRequest
} from '@pos/contract'
import { fetchJson } from './http'

export async function fetchTables(): Promise<DiningTable[]> {
  const body = await fetchJson<unknown>('/api/tables')
  return diningTableSchema.array().parse(body)
}

export async function createTable(input: CreateTableRequest): Promise<DiningTable> {
  const body = await fetchJson<unknown>('/api/tables', {
    method: 'POST',
    body: JSON.stringify(input)
  })
  return diningTableSchema.parse(body)
}

export async function updateTable(id: string, input: UpdateTableRequest): Promise<DiningTable> {
  const body = await fetchJson<unknown>(`/api/tables/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input)
  })
  return diningTableSchema.parse(body)
}

export async function updateTableStatus(
  id: string,
  input: UpdateTableStatusRequest
): Promise<DiningTable> {
  const body = await fetchJson<unknown>(`/api/tables/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify(input)
  })
  return diningTableSchema.parse(body)
}

export async function deleteTable(id: string): Promise<void> {
  await fetchJson<null>(`/api/tables/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
