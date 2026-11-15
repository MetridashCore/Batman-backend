import { describe, expect, it } from 'vitest'
import { createApp } from '../../../src/app.ts'
import { razorpay } from '../../helpers/fake-providers.ts'
import { invalidFields, useTestServer } from '../../helpers/server.ts'

const api = useTestServer(createApp)

const bank = {
  account_number: '765432123456789',
  name: 'Bruce Wayne',
  ifsc: 'HDFC0000053',
}

describe('GET /api/razorpay/orders', () => {
  it('returns the order collection', async () => {
    const res = await api.get('/api/razorpay/orders')

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('orders.items')
  })
})

describe('POST /api/razorpay/orders', () => {
  it('creates a full-payment INR order in paise', async () => {
    const res = await api.post('/api/razorpay/orders', { amount: 499.5 })

    expect(res.status).toBe(201)
    expect(razorpay.orders.create).toHaveBeenCalledWith({
      amount: 49950,
      currency: 'INR',
      partial_payment: false,
    })
    expect(res.body).toHaveProperty('order.id', 'order_test')
  })

  it('does not require bank details for a plain order', async () => {
    const res = await api.post('/api/razorpay/orders', { amount: 100 })
    expect(res.status).toBe(201)
  })

  it('ignores a client-supplied currency', async () => {
    await api.post('/api/razorpay/orders', { amount: 100, currency: 'USD' })

    expect(razorpay.orders.create).toHaveBeenCalledWith(
      expect.objectContaining({ currency: 'INR' })
    )
  })

  it.each([
    ['missing', undefined, 'Amount is required'],
    ['zero', 0, 'Amount must be greater than 0'],
    ['negative', -10, 'Amount must be greater than 0'],
    ['a string', '100', 'Amount is required'],
  ])('rejects an amount that is %s', async (_label, amount, message) => {
    const res = await api.post('/api/razorpay/orders', { amount })

    expect(res.status).toBe(400)
    expect(res.body.error.issues).toEqual([{ field: 'amount', message }])
    expect(razorpay.orders.create).not.toHaveBeenCalled()
  })
})

describe('POST /api/razorpay/orders/banking/upi', () => {
  it('attaches the bank account to the order', async () => {
    const res = await api.post('/api/razorpay/orders/banking/upi', {
      amount: 100,
      ...bank,
    })

    expect(res.status).toBe(201)
    expect(razorpay.orders.create).toHaveBeenCalledWith({
      amount: 10000,
      currency: 'INR',
      partial_payment: false,
      bank_account: bank,
    })
  })

  it('requires the bank details', async () => {
    const res = await api.post('/api/razorpay/orders/banking/upi', {
      amount: 100,
    })

    expect(res.status).toBe(400)
    expect(invalidFields(res.body)).toEqual(['account_number', 'name', 'ifsc'])
    expect(razorpay.orders.create).not.toHaveBeenCalled()
  })

  it('still requires a valid amount', async () => {
    const res = await api.post('/api/razorpay/orders/banking/upi', bank)

    expect(res.status).toBe(400)
    expect(invalidFields(res.body)).toEqual(['amount'])
  })
})

describe('GET /api/razorpay/orders/:orderId', () => {
  it('fetches the order by id', async () => {
    const res = await api.get('/api/razorpay/orders/order_1')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ order: { id: 'order_1' } })
    expect(razorpay.orders.fetch).toHaveBeenCalledWith('order_1')
  })
})

describe('GET /api/razorpay/orders/:orderId/payments', () => {
  it('lists payments made against the order', async () => {
    const res = await api.get('/api/razorpay/orders/order_1/payments')

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('payments.items')
    expect(razorpay.orders.fetchPayments).toHaveBeenCalledWith('order_1')
  })
})
