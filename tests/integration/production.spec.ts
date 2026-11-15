import { describe, expect, it, vi } from 'vitest'
import { razorpay, stripe } from '../helpers/fake-providers.ts'
import { useTestServer } from '../helpers/server.ts'

// `isProduction` is read once, when src/config/env.ts loads, so it must be set
// before the app is imported. Hoisted above the imports for that reason; the
// stub is undone after the first test, by which point the module is cached.
vi.hoisted(() => {
  vi.stubEnv('NODE_ENV', 'production')
})

const { createApp } = await import('../../src/app.ts')
const { isProduction } = await import('../../src/config/env.ts')

const api = useTestServer(createApp)

describe('in production', () => {
  it('runs with the production flag set', () => {
    // Guards the premise of every test below.
    expect(isProduction).toBe(true)
  })

  it("withholds an upstream 5xx error's message", async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    // Stripe SDK errors are Error instances, so `String(err)` would carry the
    // message straight into the response if `detail` were not withheld.
    stripe.checkout.sessions.create.mockRejectedValueOnce(
      Object.assign(new Error('stripe internal detail'), { statusCode: 503 })
    )

    const res = await api.post('/api/stripe/checkout', {
      products: { prices: 10, tokens: 1, words: 1 },
    })

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: { message: 'Internal Server Error' } })
  })

  it("withholds an unexpected error's message", async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    razorpay.orders.all.mockRejectedValueOnce(
      new TypeError("Cannot read properties of undefined (reading 'items')")
    )

    const res = await api.get('/api/razorpay/orders')

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: { message: 'Internal Server Error' } })
  })

  it('still explains client errors', async () => {
    const res = await api.post('/api/razorpay/orders', { amount: 0 })

    expect(res.status).toBe(400)
    expect(res.body.error.issues).toEqual([
      { field: 'amount', message: 'Amount must be greater than 0' },
    ])
  })
})
