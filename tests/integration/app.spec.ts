import { describe, expect, it, vi } from 'vitest'
import { createApp } from '../../src/app.ts'
import {
  collection,
  razorpay,
  razorpayRejection,
} from '../helpers/fake-providers.ts'
import { useTestServer } from '../helpers/server.ts'

const api = useTestServer(createApp)

describe('health probe', () => {
  it('reports ok with the process uptime', async () => {
    const res = await api.get('/health')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok', uptime: expect.any(Number) })
  })
})

describe('unknown routes', () => {
  it('answers an unknown path with a JSON 404 naming the route', async () => {
    const res = await api.get('/api/razorpay/nope')

    expect(res.status).toBe(404)
    expect(res.headers.get('content-type')).toMatch(/application\/json/)
    expect(res.body).toEqual({
      error: { message: 'Cannot GET /api/razorpay/nope' },
    })
  })

  it('answers an unsupported method on a known path with 404', async () => {
    const res = await api.request('PATCH', '/api/razorpay/orders')

    expect(res.status).toBe(404)
    expect(res.body.error.message).toBe('Cannot PATCH /api/razorpay/orders')
  })

  it('does not serve anything outside /api and /health', async () => {
    const res = await api.get('/razorpay/orders')
    expect(res.status).toBe(404)
  })
})

describe('request parsing', () => {
  it('rejects malformed JSON with a 400, not a 500', async () => {
    const res = await api.request('POST', '/api/razorpay/orders', {
      raw: '{"amount": 1',
      headers: { 'content-type': 'application/json' },
    })

    expect(res.status).toBe(400)
    // Not the raw JSON.parse message ("Expected ',' or '}' ... at position
    // 12"), which describes the parser rather than the request.
    expect(res.body).toEqual({
      error: { message: 'Request body could not be parsed' },
    })
    expect(razorpay.orders.create).not.toHaveBeenCalled()
  })

  it('rejects an unsupported content encoding with 415', async () => {
    const res = await api.request('POST', '/api/razorpay/orders', {
      raw: '{"amount": 1}',
      headers: {
        'content-type': 'application/json',
        'content-encoding': 'x-unknown',
      },
    })

    expect(res.status).toBe(415)
    expect(res.body).toEqual({ error: { message: 'Unsupported Media Type' } })
  })

  it('accepts form-encoded bodies', async () => {
    const res = await api.request('POST', '/api/razorpay/customers', {
      raw: 'name=Bruce+Wayne&email=bruce%40wayne.example&contact=9876543210',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    })

    expect(res.status).toBe(201)
    expect(razorpay.customers.create).toHaveBeenCalledWith({
      name: 'Bruce Wayne',
      email: 'bruce@wayne.example',
      contact: '9876543210',
    })
  })

  it('treats a request with no body as an empty one', async () => {
    const res = await api.post('/api/razorpay/orders')

    expect(res.status).toBe(400)
    expect(res.body.error.message).toBe('Validation failed')
  })

  it('rejects a body over the parser limit with 413', async () => {
    const res = await api.post('/api/razorpay/customers', {
      name: 'x'.repeat(200_000),
    })

    expect(res.status).toBe(413)
    expect(res.body).toEqual({
      error: { message: 'Request body is too large' },
    })
    expect(razorpay.customers.create).not.toHaveBeenCalled()
  })
})

describe('error envelope', () => {
  it('reports every invalid field at once', async () => {
    const res = await api.post('/api/razorpay/customers', {})

    expect(res.status).toBe(400)
    expect(res.body).toEqual({
      error: {
        message: 'Validation failed',
        issues: [
          { field: 'name', message: 'Name is required' },
          { field: 'email', message: 'A valid email is required' },
          { field: 'contact', message: 'Contact is required' },
        ],
      },
    })
  })

  it('forwards an upstream 4xx with its description', async () => {
    razorpay.payments.fetch.mockRejectedValueOnce(
      razorpayRejection(400, 'The id provided does not exist')
    )

    const res = await api.get('/api/razorpay/payments/pay_missing')

    expect(res.status).toBe(400)
    expect(res.body).toEqual({
      error: { message: 'The id provided does not exist' },
    })
  })

  it('maps an upstream 5xx to a 500 instead of forwarding its status', async () => {
    // Outside production the body also carries `detail` for debugging; that
    // it is withheld in production is covered in production.spec.ts.
    vi.spyOn(console, 'error').mockImplementation(() => {})
    razorpay.orders.all.mockRejectedValueOnce(
      razorpayRejection(503, 'razorpay internal detail')
    )

    const res = await api.get('/api/razorpay/orders')

    expect(res.status).toBe(500)
    expect(res.body.error.message).toBe('Internal Server Error')
  })

  it('maps a network failure in the SDK to a 500', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    razorpay.orders.all.mockRejectedValueOnce(new TypeError('fetch failed'))

    const res = await api.get('/api/razorpay/orders')

    expect(res.status).toBe(500)
    expect(res.body.error.message).toBe('Internal Server Error')
  })
})

describe('transport and security middleware', () => {
  it('sets helmet security headers and hides the framework', async () => {
    const res = await api.get('/health')

    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect(res.headers.get('x-frame-options')).toBe('SAMEORIGIN')
    expect(res.headers.get('strict-transport-security')).toBeTruthy()
    expect(res.headers.get('x-powered-by')).toBeNull()
  })

  it('allows cross-origin requests', async () => {
    const res = await api.get('/health', {
      headers: { origin: 'https://app.example' },
    })
    expect(res.headers.get('access-control-allow-origin')).toBe('*')
  })

  it('answers CORS preflight requests', async () => {
    const res = await api.request('OPTIONS', '/api/razorpay/orders', {
      headers: {
        origin: 'https://app.example',
        'access-control-request-method': 'POST',
      },
    })

    expect(res.status).toBe(204)
    expect(res.headers.get('access-control-allow-methods')).toContain('POST')
  })

  it('compresses large responses when the client accepts it', async () => {
    const items = Array.from({ length: 200 }, (_, i) => ({ id: `cust_${i}` }))
    razorpay.customers.all.mockResolvedValueOnce(collection(items))

    const res = await api.get('/api/razorpay/customers', {
      headers: { 'accept-encoding': 'gzip' },
    })

    expect(res.status).toBe(200)
    expect(res.headers.get('content-encoding')).toBe('gzip')
    // fetch decompresses transparently; the payload must survive the trip.
    expect(res.body.customers.items).toHaveLength(200)
  })
})
