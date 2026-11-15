import { describe, expect, it } from 'vitest'
import { createApp } from '../../../src/app.ts'
import { razorpay, razorpayRejection } from '../../helpers/fake-providers.ts'
import { invalidFields, useTestServer } from '../../helpers/server.ts'

const api = useTestServer(createApp)

/** A complete onboarding form, as the client sends it. */
const form = {
  email: 'bruce@wayne.example',
  phone: '9876543210',
  legal_business_name: 'Wayne Enterprises Pvt Ltd',
  customer_facing_business_name: 'Wayne Enterprises',
  business_type: 'private_limited',
  contact_name: 'Bruce Wayne',
  category: 'ecommerce',
  subcategory: 'arts_and_collectibles',
  description: 'Gadgets',
  business_model: 'B2C',
  pan: 'AAACL1234C',
  gst: '18AABCU9603R1ZM',
  street1: '1007 Mountain Drive',
  street2: 'Wayne Manor',
  city: 'Bengaluru',
  state: 'KARNATAKA',
  postal_code: '560001',
  country: 'IN',
}

describe('GET /api/razorpay/accounts/:accountId', () => {
  it('fetches the account by id', async () => {
    const res = await api.get('/api/razorpay/accounts/acc_123')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ account: { id: 'acc_123' } })
    expect(razorpay.accounts.fetch).toHaveBeenCalledWith('acc_123')
  })

  it('forwards an upstream 404', async () => {
    razorpay.accounts.fetch.mockRejectedValueOnce(razorpayRejection(404))

    const res = await api.get('/api/razorpay/accounts/acc_missing')

    expect(res.status).toBe(404)
    expect(res.body.error.message).toBe('Not Found')
  })
})

describe('POST /api/razorpay/accounts', () => {
  it("reshapes the flat form into Razorpay's nested payload", async () => {
    const res = await api.post('/api/razorpay/accounts', form)

    expect(res.status).toBe(201)
    expect(razorpay.accounts.create).toHaveBeenCalledOnce()
    expect(razorpay.accounts.create).toHaveBeenCalledWith({
      email: 'bruce@wayne.example',
      phone: '9876543210',
      legal_business_name: 'Wayne Enterprises Pvt Ltd',
      customer_facing_business_name: 'Wayne Enterprises',
      business_type: 'private_limited',
      contact_name: 'Bruce Wayne',
      profile: {
        category: 'ecommerce',
        subcategory: 'arts_and_collectibles',
        description: 'Gadgets',
        addresses: {
          operation: {
            street1: '1007 Mountain Drive',
            street2: 'Wayne Manor',
            city: 'Bengaluru',
            state: 'KARNATAKA',
            postal_code: '560001',
            country: 'IN',
          },
        },
        business_model: 'B2C',
      },
      legal_info: { pan: 'AAACL1234C', gst: '18AABCU9603R1ZM' },
    })
    expect(res.body.account).toMatchObject({ id: 'acc_test' })
  })

  it('sends street2 as an empty string when omitted', async () => {
    const { street2: _omitted, ...withoutStreet2 } = form

    const res = await api.post('/api/razorpay/accounts', withoutStreet2)

    expect(res.status).toBe(201)
    expect(razorpay.accounts.create).toHaveBeenCalledWith(
      expect.objectContaining({
        profile: expect.objectContaining({
          addresses: {
            operation: expect.objectContaining({ street2: '' }),
          },
        }),
      })
    )
  })

  it('accepts a numeric phone and sends it as a string', async () => {
    const res = await api.post('/api/razorpay/accounts', {
      ...form,
      phone: 9876543210,
    })

    expect(res.status).toBe(201)
    expect(razorpay.accounts.create).toHaveBeenCalledWith(
      expect.objectContaining({ phone: '9876543210' })
    )
  })

  it.each([
    ['too short', '1234567'],
    ['too long', '1234567890123456'],
  ])('rejects a phone that is %s', async (_label, phone) => {
    const res = await api.post('/api/razorpay/accounts', { ...form, phone })

    expect(res.status).toBe(400)
    expect(res.body.error.issues).toEqual([
      { field: 'phone', message: 'Phone must be between 8 and 15 characters' },
    ])
  })

  it.each(['12345678', '123456789012345'])(
    'accepts a phone at the %s boundary',
    async (phone) => {
      const res = await api.post('/api/razorpay/accounts', { ...form, phone })
      expect(res.status).toBe(201)
    }
  )

  it('lists every missing required field and calls nothing upstream', async () => {
    const res = await api.post('/api/razorpay/accounts', {})

    expect(res.status).toBe(400)
    expect(invalidFields(res.body).sort()).toEqual(
      [
        'email',
        'phone',
        'legal_business_name',
        'customer_facing_business_name',
        'business_type',
        'contact_name',
        'category',
        'street1',
        'city',
        'state',
        'postal_code',
        'country',
      ].sort()
    )
    expect(razorpay.accounts.create).not.toHaveBeenCalled()
  })

  it('rejects an invalid email', async () => {
    const res = await api.post('/api/razorpay/accounts', {
      ...form,
      email: 'bruce',
    })

    expect(res.status).toBe(400)
    expect(invalidFields(res.body)).toEqual(['email'])
  })

  it('forwards an upstream validation error', async () => {
    razorpay.accounts.create.mockRejectedValueOnce(
      razorpayRejection(400, 'Merchant email already exists for account')
    )

    const res = await api.post('/api/razorpay/accounts', form)

    expect(res.status).toBe(400)
    expect(res.body.error.message).toBe(
      'Merchant email already exists for account'
    )
  })
})
