import { describe, expect, it } from 'vitest'
import {
  generateSecureToken,
  hashSecret,
  hashToken,
  sha256Hex,
  timingSafeEqual,
  verifySecret,
  verifyToken
} from '../../src/auth/hash'

describe('hashSecret / verifySecret', () => {
  it('用正確的密鑰驗證會成功', async () => {
    const { hash, salt } = await hashSecret('1234')
    expect(await verifySecret('1234', hash, salt)).toBe(true)
  })

  it('用錯誤的密鑰驗證會失敗', async () => {
    const { hash, salt } = await hashSecret('1234')
    expect(await verifySecret('9999', hash, salt)).toBe(false)
  })

  it('同一個密鑰每次雜湊出來的鹽都不同（因此雜湊值也不同）', async () => {
    const a = await hashSecret('1234')
    const b = await hashSecret('1234')
    expect(a.salt).not.toBe(b.salt)
    expect(a.hash).not.toBe(b.hash)
    // 但各自都還是驗證得過。
    expect(await verifySecret('1234', a.hash, a.salt)).toBe(true)
    expect(await verifySecret('1234', b.hash, b.salt)).toBe(true)
  })

  it('雜湊值與鹽都是 hex 字串（方便直接存進 TEXT 欄位）', async () => {
    const { hash, salt } = await hashSecret('1234')
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    expect(salt).toMatch(/^[0-9a-f]{32}$/)
  })
})

describe('hashToken / verifyToken', () => {
  it('用正確的 token 驗證會成功', async () => {
    const { hash, salt } = await hashToken('some-random-token')
    expect(await verifyToken('some-random-token', hash, salt)).toBe(true)
  })

  it('用錯誤的 token 驗證會失敗', async () => {
    const { hash, salt } = await hashToken('some-random-token')
    expect(await verifyToken('other-token', hash, salt)).toBe(false)
  })

  it('同一個 token 每次雜湊出來的鹽都不同（因此雜湊值也不同）', async () => {
    const a = await hashToken('some-random-token')
    const b = await hashToken('some-random-token')
    expect(a.salt).not.toBe(b.salt)
    expect(a.hash).not.toBe(b.hash)
  })
})

describe('generateSecureToken', () => {
  it('產生 64 碼 hex 字串（32 bytes），每次呼叫都不同', () => {
    const a = generateSecureToken()
    const b = generateSecureToken()
    expect(a).toMatch(/^[0-9a-f]{64}$/)
    expect(a).not.toBe(b)
  })
})

describe('timingSafeEqual', () => {
  it('相同字串回傳 true', () => {
    expect(timingSafeEqual('secret-value', 'secret-value')).toBe(true)
  })

  it('不同字串（含長度不同）回傳 false', () => {
    expect(timingSafeEqual('secret-value', 'secret-valuf')).toBe(false)
    expect(timingSafeEqual('short', 'much-longer-value')).toBe(false)
  })
})

describe('sha256Hex', () => {
  it('同輸入永遠得到同一組 64 碼 hex 雜湊（可用來做索引查找）', async () => {
    const a = await sha256Hex('token-abc')
    const b = await sha256Hex('token-abc')
    expect(a).toBe(b)
    expect(a).toMatch(/^[0-9a-f]{64}$/)
  })

  it('不同輸入得到不同雜湊', async () => {
    expect(await sha256Hex('token-abc')).not.toBe(await sha256Hex('token-xyz'))
  })
})
