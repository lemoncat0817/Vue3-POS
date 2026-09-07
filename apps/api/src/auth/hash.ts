/**
 * 密鑰雜湊工具（P4：裝置憑證＋操作員 PIN 授權包）。
 *
 * 用 Web Crypto 的 PBKDF2-SHA256（Workers runtime 原生支援，底層是
 * BoringSSL，不是 JS 直譯迴圈，即使跑 10 萬次疊代也遠低於 Workers 免費
 * 額度的 CPU 時間限制），取代 P0～P3 一路沿用至今、apps/pos 前端明碼
 * 儲存密碼＋明碼比對的做法（見 stores/authorityManagement.ts 的說明）。
 * 裝置憑證與操作員 PIN 都只存這裡算出來的雜湊值＋鹽，原始明碼只在
 * 驗證的當下經手，不落地。
 *
 * 疊代次數選 100,000（OWASP 對 PBKDF2-SHA256 的建議下限），如果之後
 * 量測到免費額度的 CPU 時間吃緊，這是唯一需要調整的常數。
 */
const PBKDF2_ITERATIONS = 100_000
const HASH_BYTE_LENGTH = 32
const SALT_BYTE_LENGTH = 16

function toHex(bytes: ArrayBuffer | Uint8Array): string {
  return Array.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

async function deriveBits(secret: string, salt: Uint8Array): Promise<ArrayBuffer> {
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), 'PBKDF2', false, [
    'deriveBits',
  ])
  return crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    HASH_BYTE_LENGTH * 8,
  )
}

/** 雜湊一個新的密鑰（設定 PIN／核發裝置憑證時使用），回傳雜湊值與鹽（都是 hex 字串，直接存進資料庫）。 */
export async function hashSecret(secret: string): Promise<{ hash: string; salt: string }> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(SALT_BYTE_LENGTH))
  const derived = await deriveBits(secret, saltBytes)
  return { hash: toHex(derived), salt: toHex(saltBytes) }
}

/** 驗證輸入的密鑰是否對應資料庫裡存的雜湊值＋鹽。 */
export async function verifySecret(secret: string, hash: string, salt: string): Promise<boolean> {
  const derived = await deriveBits(secret, fromHex(salt))
  return toHex(derived) === hash
}

/** 產生裝置憑證明碼（核發當下回傳一次，之後只存雜湊值，見 routes/devices.ts）。 */
export function generateDeviceToken(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(32)))
}
