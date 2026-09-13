export type Minor = number & { readonly __brand: 'TWD_minor' }

export function toMinor(dollars: number): Minor {
  return Math.round(dollars * 100) as Minor
}

export function fromMinor(minor: Minor): number {
  return minor / 100
}

export function addMinor(a: Minor, b: Minor): Minor {
  return (a + b) as Minor
}

export function subtractMinor(a: Minor, b: Minor): Minor {
  return (a - b) as Minor
}

export function scaleMinor(minor: Minor, factor: number): Minor {
  return Math.round(minor * factor) as Minor
}

export function roundToDollar(minor: Minor): Minor {
  return (Math.round(minor / 100) * 100) as Minor
}

export function allocate(total: Minor, weights: readonly number[]): Minor[] {
  if (weights.length === 0) return []
  const weightSum = weights.reduce((sum, w) => sum + w, 0)
  if (weightSum <= 0) {
    // 權重總和為 0 時全數歸入首項，防除以零
    return weights.map((_, i) => (i === 0 ? total : 0) as Minor)
  }

  const raw = weights.map((w) => (total * w) / weightSum)
  const floored = raw.map((r) => Math.floor(r))
  let remainder = total - floored.reduce((sum, f) => sum + f, 0)

  const order = raw.map((r, i) => ({ i, frac: r - Math.floor(r) })).sort((a, b) => b.frac - a.frac)

  const result = [...floored]
  for (const { i } of order) {
    if (remainder <= 0) break
    result[i]! += 1
    remainder -= 1
  }
  return result as Minor[]
}
