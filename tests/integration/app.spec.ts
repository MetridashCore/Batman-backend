import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

// The provider clients are replaced wholesale: these tests cover routing,
// validation and error mapping, none of which should reach the network.
vi.mock('../../src/providers/razorpay.ts', () => ({
  razorpay: {
    customers: {
      all: vi.fn(async () => ({ entity: 'collection', count: 0, items: [] })),
      create: vi.fn(async (params: unknown) => ({ id: 'cust_test', ...(params as object) })),
      fetch: vi.fn(async (id: string) => ({ id })),
      fetchTokens: vi.fn(async () => ({ entity: 'collection', count: 0, items: [] })),
      fetchToken: vi.fn(async (_c: string, id: string) => ({ id })),
    },
    orders: {
      all: vi.fn(async () => ({ entity: 'collection', count: 0, items: [] })),
      create: vi.fn(async (params: unknown) => ({ id: 'order_test', ...(params as object) })),
      fetch: vi.fn(async (id: string) => ({ id })),
      fetchPayments: vi.fn(async () => ({ entity: 'collection', count: 0, items: [] })),
    },
    items: {
      create: vi.fn(async (params: unknown) => ({ id: 'item_test', ...(params as object) })),
      edit: vi.fn(async (_id: string, params: unknown) => ({ id: 'item_test', ...(params as object) })),
    },
    payments: {
      // Mirrors a Razorpay SDK rejection: the upstream status rides on the error.
      fetch: vi.fn(async () => {
        throw Object.assign(new Error('not found'), {
          statusCode: 404,
          error: { description: 'The id provided does not exist' },
        })
      }),
    },
  },
}))

vi.mock('../../src/providers/stripe.ts', () => ({ stripe: {} }))

const { createApp } = await import('../../src/app.ts')
const { startTestServer } = await import('../helpers/server.ts')

let server: Awaited<ReturnType<typeof startTestServer>>
let request: typeof server.request

beforeAll(async () => {
  server = await startTestServer(createApp())
  request = server.request
})
afterAll(async () => {
  await server.close()
})

describe('infrastructure', () => {
  it('exposes a health probe', async () => {
    const res = await request('GET', '/health')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ status: 'ok' })
  })

  it('answers unknown paths with JSON 404', async () => {
    const res = await request('GET', '/api/razorpay/nope')
    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error.message')
  })
})

describe('validation', () => {
  it('rejects an invalid body with 400 and field details', async () => {
    const res = await request('POST', '/api/razorpay/customers', { name: '' })

    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({ error: { message: 'Validation failed' } })

    const { issues } = (res.body as { error: { issues: { field: string }[] } }).error
    expect(issues.map((i) => i.field)).toContain('name')
  })

  it('rejects an empty body on a route that used to throw a TypeError', async () => {
    const res = await request('POST', '/api/stripe/checkout', {})
    expect(res.status).toBe(400)
  })

  it('does not require bank details for a plain order', async () => {
    const res = await request('POST', '/api/razorpay/orders', { amount: 100 })
    expect(res.status).toBe(201)
  })

  it('still requires bank details for the UPI variant', async () => {
    const res = await request('POST', '/api/razorpay/orders/banking/upi', {
      amount: 100,
    })
    expect(res.status).toBe(400)
  })
})

describe('error mapping', () => {
  it('forwards an upstream 404 instead of reporting 200', async () => {
    const res = await request('GET', '/api/razorpay/payments/pay_missing')
    expect(res.status).toBe(404)
    expect(res.body).toMatchObject({
      error: { message: 'The id provided does not exist' },
    })
  })
})

describe('nested resource routes', () => {
  it('resolves customer tokens', async () => {
    const res = await request('GET', '/api/razorpay/customers/cust_1/tokens')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('tokens')
  })

  it('resolves a single customer token', async () => {
    const res = await request('GET', '/api/razorpay/customers/cust_1/tokens/tok_1')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ token: { id: 'tok_1' } })
  })

  it('resolves payments for an order', async () => {
    const res = await request('GET', '/api/razorpay/orders/order_1/payments')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('payments')
  })
})

describe('currency handling', () => {
  it('converts rupees to paise when creating an item', async () => {
    const res = await request('POST', '/api/razorpay/items', {
      name: 'Pro plan',
      description: 'Monthly',
      amount: 19.99,
    })

    expect(res.status).toBe(201)
    // 19.99 * 100 is 1998.9999999999998 in floating point; it must round.
    expect(res.body).toMatchObject({ item: { amount: 1999 } })
  })

  it('converts on update too, not just on create', async () => {
    const res = await request('PUT', '/api/razorpay/items/item_1', {
      name: 'Pro plan',
      description: 'Monthly',
      amount: 25,
    })

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ item: { amount: 2500 } })
  })
})
