export const DEFAULT_BUSINESS_DAY_START_HOUR = 4

export function getBusinessDate(
  at: Date,
  startHour: number = DEFAULT_BUSINESS_DAY_START_HOUR
): string {
  const shifted = new Date(at.getFullYear(), at.getMonth(), at.getDate())
  if (at.getHours() < startHour) {
    shifted.setDate(shifted.getDate() - 1)
  }
  const year = shifted.getFullYear()
  const month = String(shifted.getMonth() + 1).padStart(2, '0')
  const day = String(shifted.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}
