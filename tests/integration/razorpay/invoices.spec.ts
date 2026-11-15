import { describe, expect, it } from 'vitest'
import { createApp } from '../../../src/app.ts'
import { razorpay } from '../../helpers/fake-providers.ts'
import { invalidFields, useTestServer } from '../../helpers/server.ts'

const api = useTestServer(createApp)

const form = {
  name: 'Bruce Wayne',
  contact: '9876543210',
  email: 'bruce@wayne.example',

  billing_address_line1: '1007 Mountain Drive',
  billing_address_line2: 'Wayne Manor',
  billing_address_zipcode: '560001',
  billing_address_city: 'Bengaluru',
  billing_address_state: 'Karnataka',
  billing_address_country: 'in',

  shipping_address_line1: '224 Park Drive',
  shipping_address_zipcode: '400001',
  shipping_address_city: 'Mumbai',
  shipping_address_state: 'Maharashtra',
  shipping_address_country: 'in',

  line_items_name: 'Grappling hook',
  line_items_description: 'Standard issue',
  amount: 19.99,
  quantity: 2,
}

describe('GET /api/razorpay/invoices', () => {
  it('returns the invoice collection', async () => {
    const res = await api.get('/api/razorpay/invoices')

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('invoices.items')
    expect(razorpay.invoices.all).toHaveBeenCalledOnce()
  })
})

describe('GET /api/razorpay/invoices/:invoiceId', () => {
  it('fetches the invoice by id', async () => {
    const res = await api.get('/api/razorpay/invoices/inv_1')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ invoice: { id: 'inv_1' } })
    expect(razorpay.invoices.fetch).toHaveBeenCalledWith('inv_1')
  })
})

describe('POST /api/razorpay/invoices', () => {
  it('builds the nested invoice payload with the amount in paise', async () => {
    const res = await api.post('/api/razorpay/invoices', form)

    expect(res.status).toBe(201)
    expect(razorpay.invoices.create).toHaveBeenCalledWith({
      type: 'invoice',
      description: 'an invoice',
      partial_payment: false,
      customer: {
        name: 'Bruce Wayne',
        contact: '9876543210',
        email: 'bruce@wayne.example',
        billing_address: {
          line1: '1007 Mountain Drive',
          line2: 'Wayne Manor',
          zipcode: '560001',
          city: 'Bengaluru',
          state: 'Karnataka',
          country: 'in',
        },
        shipping_address: {
          line1: '224 Park Drive',
          line2: undefined,
          zipcode: '400001',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'in',
        },
      },
      line_items: [
        {
          name: 'Grappling hook',
          description: 'Standard issue',
          amount: 1999,
          quantity: 2,
        },
      ],
    })
    expect(res.body).toHaveProperty('invoice.id', 'inv_test')
  })

  it('uses the caller-supplied description when given', async () => {
    await api.post('/api/razorpay/invoices', {
      ...form,
      description: 'Order #42',
    })

    expect(razorpay.invoices.create).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'Order #42' })
    )
  })

  it('requires both addresses in full', async () => {
    const res = await api.post('/api/razorpay/invoices', {
      name: form.name,
      contact: form.contact,
      email: form.email,
      line_items_name: form.line_items_name,
      line_items_description: form.line_items_description,
      amount: form.amount,
      quantity: form.quantity,
    })

    expect(res.status).toBe(400)
    expect(invalidFields(res.body).sort()).toEqual(
      [
        'billing_address_line1',
        'billing_address_zipcode',
        'billing_address_city',
        'billing_address_state',
        'billing_address_country',
        'shipping_address_line1',
        'shipping_address_zipcode',
        'shipping_address_city',
        'shipping_address_state',
        'shipping_address_country',
      ].sort()
    )
    expect(razorpay.invoices.create).not.toHaveBeenCalled()
  })

  it.each([0, -1, 1.5, '2'])('rejects a quantity of %s', async (quantity) => {
    const res = await api.post('/api/razorpay/invoices', { ...form, quantity })

    expect(res.status).toBe(400)
    expect(invalidFields(res.body)).toEqual(['quantity'])
  })

  it.each([0, -5])('rejects an amount of %d', async (amount) => {
    const res = await api.post('/api/razorpay/invoices', { ...form, amount })

    expect(res.status).toBe(400)
    expect(res.body.error.issues).toEqual([
      { field: 'amount', message: 'Amount must be greater than 0' },
    ])
  })
})
