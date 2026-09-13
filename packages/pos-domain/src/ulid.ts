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
