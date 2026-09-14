// 採用 Web Crypto PBKDF2-SHA256 雜湊處理憑證與 PIN
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

// 固定時間比較，避免逐位元比對時的執行時間差被拿來反推正確值
export function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a)
  const bBytes = new TextEncoder().encode(b)
  let diff = aBytes.length ^ bBytes.length
  const length = Math.max(aBytes.length, bBytes.length)
  for (let i = 0; i < length; i++) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0)
  }
  return diff === 0
}

// 未加鹽的快速雜湊，僅供資料庫索引查找用；不能取代下面的加鹽 PBKDF2 驗證
export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return toHex(digest)
}

async function deriveBits(secret: string, salt: Uint8Array): Promise<ArrayBuffer> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  return crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    HASH_BYTE_LENGTH * 8
  )
}

export async function hashSecret(secret: string): Promise<{ hash: string; salt: string }> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(SALT_BYTE_LENGTH))
  const derived = await deriveBits(secret, saltBytes)
  return { hash: toHex(derived), salt: toHex(saltBytes) }
}

export async function verifySecret(secret: string, hash: string, salt: string): Promise<boolean> {
  const derived = await deriveBits(secret, fromHex(salt))
  return timingSafeEqual(toHex(derived), hash)
}

export function generateSecureToken(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(32)))
}

// device/session token 是伺服器產生的高熵亂數，不像 PIN 需要 PBKDF2 防暴力猜測；
// 用 PBKDF2 驗證這類 token 在 Workers CPU 時間限制下容易觸發 503，改用加鹽 SHA-256 即可
export async function hashToken(secret: string): Promise<{ hash: string; salt: string }> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(SALT_BYTE_LENGTH))
  const salt = toHex(saltBytes)
  const hash = await sha256Hex(salt + secret)
  return { hash, salt }
}

export async function verifyToken(secret: string, hash: string, salt: string): Promise<boolean> {
  const computed = await sha256Hex(salt + secret)
  return timingSafeEqual(computed, hash)
}
