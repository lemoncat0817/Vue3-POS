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
  return toHex(derived) === hash
}

export function generateSecureToken(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(32)))
}
