import { describe, expect, it } from 'vitest'
import { createApp } from '../../../src/app.ts'
import {
  collection,
  razorpay,
  razorpayRejection,
} from '../../helpers/fake-providers.ts'
import { invalidFields, useTestServer } from '../../helpers/server.ts'

const api = useTestServer(createApp)

const customer = {
  name: 'Bruce Wayne',
  email: 'bruce@wayne.example',
  contact: '9876543210',
}

describe('GET /api/razorpay/customers', () => {
  it('returns the customer collection', async () => {
    const customers = collection([{ id: 'cust_1', ...customer }])
    razorpay.customers.all.mockResolvedValueOnce(customers)

    const res = await api.get('/api/razorpay/customers')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ customers })
  })
})

describe('POST /api/razorpay/customers', () => {
  it('creates a customer and responds 201', async () => {
    const res = await api.post('/api/razorpay/customers', customer)

    expect(res.status).toBe(201)
    expect(res.body).toEqual({ customer: { id: 'cust_test', ...customer } })
    expect(razorpay.customers.create).toHaveBeenCalledWith(customer)
  })

  it('accepts a numeric contact', async () => {
    const res = await api.post('/api/razorpay/customers', {
      ...customer,
      contact: 9876543210,
    })

    expect(res.status).toBe(201)
    expect(razorpay.customers.create).toHaveBeenCalledWith(
      expect.objectContaining({ contact: 9876543210 })
    )
  })

  it('does not forward fields outside the schema', async () => {
    await api.post('/api/razorpay/customers', {
      ...customer,
      fail_existing: '0',
      notes: { admin: true },
    })

    expect(razorpay.customers.create).toHaveBeenCalledWith(customer)
  })

  it.each([
    ['missing', undefined],
    // Same message as missing, per the convention in src/http/schema.ts.
    ['blank', ''],
    ['null', null],
    ['an object', { phone: 1 }],
  ])('rejects a contact that is %s', async (_label, contact) => {
    const res = await api.post('/api/razorpay/customers', {
      ...customer,
      contact,
    })

    expect(res.status).toBe(400)
    expect(res.body.error.issues).toEqual([
      { field: 'contact', message: 'Contact is required' },
    ])
    expect(razorpay.customers.create).not.toHaveBeenCalled()
  })

  it('rejects an invalid email', async () => {
    const res = await api.post('/api/razorpay/customers', {
      ...customer,
      email: 'not-an-email',
    })

    expect(res.status).toBe(400)
    expect(invalidFields(res.body)).toEqual(['email'])
  })

  it('forwards a duplicate-customer rejection from Razorpay', async () => {
    razorpay.customers.create.mockRejectedValueOnce(
      razorpayRejection(400, 'Customer already exists for the merchant')
    )

    const res = await api.post('/api/razorpay/customers', customer)

    expect(res.status).toBe(400)
    expect(res.body.error.message).toBe(
      'Customer already exists for the merchant'
    )
  })
})

describe('GET /api/razorpay/customers/:customerId', () => {
  it('fetches the customer by id', async () => {
    const res = await api.get('/api/razorpay/customers/cust_1')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ customer: { id: 'cust_1' } })
    expect(razorpay.customers.fetch).toHaveBeenCalledWith('cust_1')
  })
})

describe('GET /api/razorpay/customers/:customerId/tokens', () => {
  it("lists the customer's saved tokens", async () => {
    const res = await api.get('/api/razorpay/customers/cust_1/tokens')

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('tokens.items')
    expect(razorpay.customers.fetchTokens).toHaveBeenCalledWith('cust_1')
  })
})

describe('GET /api/razorpay/customers/:customerId/tokens/:tokenId', () => {
  it('fetches one token scoped to the customer', async () => {
    const res = await api.get('/api/razorpay/customers/cust_1/tokens/token_9')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      token: { id: 'token_9', customer_id: 'cust_1' },
    })
    expect(razorpay.customers.fetchToken).toHaveBeenCalledWith(
      'cust_1',
      'token_9'
    )
  })
})
