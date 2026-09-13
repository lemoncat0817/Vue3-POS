export function digitsOnly(raw: string): string {
  return raw.replace(/[^0-9]/g, '')
}

export function parseOptionalInt(raw: string): number | null {
  const digits = digitsOnly(raw)
  return digits === '' ? null : Number(digits)
}

export function parseRequiredInt(raw: string, options?: { max?: number }): number {
  const digits = digitsOnly(raw)
  const value = digits === '' ? 0 : Number(digits)
  return options?.max !== undefined ? Math.min(value, options.max) : value
}
