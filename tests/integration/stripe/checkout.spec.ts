import { describe, expect, it } from 'vitest'
import { createApp } from '../../../src/app.ts'
import { stripe } from '../../helpers/fake-providers.ts'
import { invalidFields, useTestServer } from '../../helpers/server.ts'

const api = useTestServer(createApp)

const order = { products: { prices: 19.99, tokens: 5000, words: '3750' } }

describe('POST /api/stripe/checkout', () => {
  it('opens a one-off card checkout session priced in cents', async () => {
    const res = await api.post('/api/stripe/checkout', order)

    expect(res.status).toBe(200)
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: 1999,
            product_data: { name: '5000 tokens/3750 words' },
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:8000/success',
      cancel_url: 'http://localhost:8000/cancel',
    })
  })

  it('returns only the session id and redirect URL', async () => {
    stripe.checkout.sessions.create.mockResolvedValueOnce({
      id: 'cs_test_abc',
      url: 'https://checkout.stripe.com/c/pay/cs_test_abc',
      // Fields the client has no business seeing.
      customer_details: { email: 'someone@example.com' },
      client_secret: 'secret',
    } as never)

    const res = await api.post('/api/stripe/checkout', order)

    expect(res.body).toEqual({
      id: 'cs_test_abc',
      url: 'https://checkout.stripe.com/c/pay/cs_test_abc',
    })
  })

  it('rejects an empty body instead of throwing a TypeError', async () => {
    const res = await api.post('/api/stripe/checkout', {})

    expect(res.status).toBe(400)
    expect(invalidFields(res.body)).toEqual(['products'])
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled()
  })

  it('reports nested fields by their full path', async () => {
    const res = await api.post('/api/stripe/checkout', { products: {} })

    expect(res.status).toBe(400)
    expect(invalidFields(res.body)).toEqual([
      'products.prices',
      'products.tokens',
      'products.words',
    ])
  })

  it.each([0, -1])('rejects a price of %d', async (prices) => {
    const res = await api.post('/api/stripe/checkout', {
      products: { ...order.products, prices },
    })

    expect(res.status).toBe(400)
    expect(res.body.error.issues).toEqual([
      { field: 'products.prices', message: 'Price must be greater than 0' },
    ])
  })

  it('forwards a Stripe client error', async () => {
    // Stripe SDK errors are Error subclasses that carry `statusCode`.
    stripe.checkout.sessions.create.mockRejectedValueOnce(
      Object.assign(new Error('Amount must be at least $0.50 usd'), {
        type: 'StripeInvalidRequestError',
        statusCode: 400,
      })
    )

    const res = await api.post('/api/stripe/checkout', {
      products: { ...order.products, prices: 0.1 },
    })

    expect(res.status).toBe(400)
    expect(res.body.error.message).toBe('Amount must be at least $0.50 usd')
  })
})
