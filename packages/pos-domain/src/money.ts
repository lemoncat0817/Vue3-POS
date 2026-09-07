/**
 * 金額運算（重構規劃書 §7）。
 *
 * 新台幣流通面額為整數元，但折數運算會產生分位。全程以整數「分」
 * （Minor，1 元 = 100）運算，只在應收金額的邊界一次取整，避免浮點數
 * 誤差與逐行 `Math.round` 導致「各行小計加總 ≠ 訂單總額」。
 */

/** 以「分」為單位的整數金額（1 元 = 100 分）。品牌型別避免與一般數字混用。 */
export type Minor = number & { readonly __brand: 'TWD_minor' }

/** 元（可能含小數，例如折數運算的中間結果）轉換為分，四捨五入到最接近的分。 */
export function toMinor(dollars: number): Minor {
  return Math.round(dollars * 100) as Minor
}

/** 分轉換回元（浮點數，未取整——取整交給 {@link roundToDollar}）。 */
export function fromMinor(minor: Minor): number {
  return minor / 100
}

/** 兩個 Minor 相加。 */
export function addMinor(a: Minor, b: Minor): Minor {
  return (a + b) as Minor
}

/** 兩個 Minor 相減。 */
export function subtractMinor(a: Minor, b: Minor): Minor {
  return (a - b) as Minor
}

/** Minor 乘以一個純量（例如數量、折數），四捨五入到最接近的分。 */
export function scaleMinor(minor: Minor, factor: number): Minor {
  return Math.round(minor * factor) as Minor
}

/**
 * 取整策略：四捨五入至元，僅施加於金額的最終邊界（例如訂單應收總額、
 * 或單一品項的最終小計）。回傳值仍是 Minor（分），但恆為 100 的倍數。
 */
export function roundToDollar(minor: Minor): Minor {
  return (Math.round(minor / 100) * 100) as Minor
}

/**
 * 把 `total` 依照 `weights` 的比例分攤成多筆金額，總和恆等於 `total`
 * （最大餘數法）。用於退款、發票折讓這類「總額已經取整，需要逐行對得
 * 起來」的情境——目前的六折扣函式與 `priceLine` 走的是逐行各自取整
 * （見 pricing.ts），尚未用到這個函式；保留給 P6 退款／折讓時使用。
 */
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
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac)

  const result = [...floored]
  for (const { i } of order) {
    if (remainder <= 0) break
    result[i]! += 1
    remainder -= 1
  }
  return result as Minor[]
}
