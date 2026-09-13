import { describe, expect, it, vi } from 'vitest'
import * as httpModule from './http'
import {
  createMember,
  fetchMemberDetail,
  fetchMembers,
  findMemberByPhone
} from './members'

describe('members api client', () => {
  const dummyMember = {
    id: 'mem-1',
    name: '王大明',
    phone: '0912345678',
    points: 100,
    birthday: '1990-05-15',
    tags: ['常客'],
    notes: '愛喝無糖',
    createdAt: '2025-01-01T00:00:00Z',
    tierStatus: {
      tier: null,
      lifetimeSpend: 1000
    }
  }

  it('fetchMembers() 正確組合 query string 並解析分頁回應', async () => {
    const mockResponse = {
      items: [dummyMember],
      pagination: {
        page: 1,
        pageSize: 20,
        totalCount: 1,
        totalPages: 1
      }
    }

    const spy = vi.spyOn(httpModule, 'fetchJson').mockResolvedValue(mockResponse)
    const result = await fetchMembers({ q: '王', page: 1, pageSize: 20 })

    expect(spy).toHaveBeenCalledWith('/api/members?q=%E7%8E%8B&page=1&pageSize=20')
    expect(result.items).toHaveLength(1)
    expect(result.items[0]?.name).toBe('王大明')
  })

  it('findMemberByPhone() 查無會員時回傳 null', async () => {
    vi.spyOn(httpModule, 'fetchJson').mockResolvedValue({
      items: [],
      pagination: { page: 1, pageSize: 20, totalCount: 0, totalPages: 0 }
    })

    const member = await findMemberByPhone('0900000000')
    expect(member).toBeNull()
  })

  it('createMember() 發送 POST 請求並解析建立之會員', async () => {
    const createdMember = {
      id: 'mem-2',
      name: '李小華',
      phone: '0987654321',
      points: 0,
      birthday: null,
      tags: [],
      notes: null,
      createdAt: '2025-01-02T00:00:00Z'
    }

    const spy = vi.spyOn(httpModule, 'fetchJson').mockResolvedValue(createdMember)
    const res = await createMember({ name: '李小華', phone: '0987654321' })

    expect(spy).toHaveBeenCalledWith('/api/members', expect.objectContaining({ method: 'POST' }))
    expect(res.name).toBe('李小華')
  })

  it('fetchMemberDetail() 發送包含會員 ID 的請求', async () => {
    const mockDetail = {
      ...dummyMember,
      orders: {
        items: [],
        pagination: { page: 1, pageSize: 20, totalCount: 0, totalPages: 0 }
      },
      pointsLedger: []
    }

    const spy = vi.spyOn(httpModule, 'fetchJson').mockResolvedValue(mockDetail)
    const detail = await fetchMemberDetail('mem-1')

    expect(spy).toHaveBeenCalledWith('/api/members/mem-1')
    expect(detail.name).toBe('王大明')
  })
})
