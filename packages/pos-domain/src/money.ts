/**
 * 金額運算模組。全程以整數「分」（Minor，1 元 = 100 分）運算，
 * 僅在金額邊界一次四捨五入取整至元，避免浮點數累積誤差。
 */

/** 以「分」為單位的整數金額（1 元 = 100 分）。品牌型別避免與一般數字混用。 */
export type Minor = number & { readonly __brand: 'TWD_minor' }

/** 元轉換為分，四捨五入到最接近的分。 */
export function toMinor(dollars: number): Minor {
  return Math.round(dollars * 100) as Minor
}

/** 分轉換回元（浮點數，未取整）。 */
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

/** 四捨五入至元，回傳值仍為 Minor（恆為 100 的倍數）。 */
export function roundToDollar(minor: Minor): Minor {
  return (Math.round(minor / 100) * 100) as Minor
}

/** 以最大餘數法依權重比例分攤金額，確保分攤後各項總和恆等於 total。 */
export function allocate(total: Minor, weights: readonly number[]): Minor[] {
  if (weights.length === 0) return []
  const weightSum = weights.reduce((sum, w) => sum + w, 0)
  if (weightSum <= 0) {
    // 沒有任何權重時，全數分給第一項，其餘為 0——避免除以零。
    return weights.map((_, i) => (i === 0 ? total : 0) as Minor)
  }

  const raw = weights.map((w) => (total * w) / weightSum)
  const floored = raw.map((r) => Math.floor(r))
  let remainder = total - floored.reduce((sum, f) => sum + f, 0)

  // 依小數部分（餘數）由大到小排序，把差額逐一分給餘數最大的項目。
  const order = raw.map((r, i) => ({ i, frac: r - Math.floor(r) })).sort((a, b) => b.frac - a.frac)

  const result = [...floored]
  for (const { i } of order) {
    if (remainder <= 0) break
    result[i]! += 1
    remainder -= 1
  }
  return result as Minor[]
}
