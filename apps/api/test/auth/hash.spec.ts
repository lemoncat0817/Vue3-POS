import { describe, expect, it } from 'vitest'
import { generateDeviceToken, hashSecret, verifySecret } from '../../src/auth/hash'

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

describe('generateDeviceToken', () => {
  it('產生 64 碼 hex 字串（32 bytes），每次呼叫都不同', () => {
    const a = generateDeviceToken()
    const b = generateDeviceToken()
    expect(a).toMatch(/^[0-9a-f]{64}$/)
    expect(a).not.toBe(b)
  })
})
