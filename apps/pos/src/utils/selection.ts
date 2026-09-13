import type { AuthorityKey } from '@/types'

export function fromSelection<T extends object>(value: T | undefined | []): T | undefined {
  return Array.isArray(value) ? undefined : value
}

export function hasCapability<T extends { authorityCheckList: AuthorityKey[] }>(
  value: T | undefined | [],
  key: AuthorityKey
): boolean {
  return fromSelection(value)?.authorityCheckList.includes(key) ?? false
}
