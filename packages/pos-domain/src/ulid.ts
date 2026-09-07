/**
 * ULID 產生器（P3：離線佇列的冪等鍵，見規劃書 §7、apps/pos 的
 * outbox 說明）。
 *
 * 前 48 bit 是毫秒時間戳、後 80 bit 是亂數，一起編碼成 26 碼 Crockford
 * Base32——字典序排序等於時間排序，跟 @pos/contract 的 ulidSchema
 * （`^[0-9A-HJKMNP-TV-Z]{26}$`）驗證的格式一致。放在這裡而不是
 * apps/pos，是因為離線佇列需要在完全連不上伺服端的情況下，於用戶端
 * 就先產生一個保證唯一且可排序的鍵，這是純運算邏輯，不依賴任何框架。
 */
const CROCKFORD_BASE32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const TIME_LEN = 10
const RANDOM_LEN = 16

function encodeTime(time: number, length: number): string {
  let remaining = time
  let output = ''
  for (let i = 0; i < length; i++) {
    const mod = remaining % 32
    output = CROCKFORD_BASE32[mod] + output
    remaining = (remaining - mod) / 32
  }
  return output
}

function encodeRandom(length: number): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  let output = ''
  for (let i = 0; i < length; i++) {
    output += CROCKFORD_BASE32[bytes[i]! % 32]
  }
  return output
}

export function ulid(time: number = Date.now()): string {
  return encodeTime(time, TIME_LEN) + encodeRandom(RANDOM_LEN)
}
