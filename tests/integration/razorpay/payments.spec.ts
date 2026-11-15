import { describe, expect, it } from 'vitest'
import { createApp } from '../../../src/app.ts'
import { razorpay, razorpayRejection } from '../../helpers/fake-providers.ts'
import { invalidFields, useTestServer } from '../../helpers/server.ts'

const api = useTestServer(createApp)

describe('GET /api/razorpay/payments', () => {
  it('returns the payment collection', async () => {
    const res = await api.get('/api/razorpay/payments')

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('payments.items')
  })
})

describe('GET /api/razorpay/payments/:paymentId', () => {
  it('fetches the payment by id', async () => {
    const res = await api.get('/api/razorpay/payments/pay_1')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ payment: { id: 'pay_1' } })
    expect(razorpay.payments.fetch).toHaveBeenCalledWith('pay_1')
  })

  it('forwards an upstream 404 instead of reporting 200', async () => {
    razorpay.payments.fetch.mockRejectedValueOnce(
      razorpayRejection(404, 'The id provided does not exist')
    )

    const res = await api.get('/api/razorpay/payments/pay_missing')

    expect(res.status).toBe(404)
    expect(res.body).toEqual({
      error: { message: 'The id provided does not exist' },
    })
  })
})

describe('GET /api/razorpay/payments/:paymentId/card', () => {
  it('fetches the card used for the payment', async () => {
    const res = await api.get('/api/razorpay/payments/pay_1/card')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ card: { id: 'card_test' } })
    expect(razorpay.payments.fetchCardDetails).toHaveBeenCalledWith('pay_1')
  })
})

describe('POST /api/razorpay/payments/:paymentId/capture', () => {
  it('passes the amount through untouched: it is already in paise', async () => {
    // Unlike order creation, capture echoes an existing authorisation. Running
    // it through toMinorUnits would capture 100x the authorised amount.
    const res = await api.post('/api/razorpay/payments/pay_1/capture', {
      amount: 49950,
    })

    expect(res.status).toBe(200)
    expect(razorpay.payments.capture).toHaveBeenCalledWith('pay_1', 49950, 'INR')
    expect(res.body).toEqual({
      payment: { id: 'pay_1', amount: 49950, currency: 'INR', status: 'captured' },
    })
  })

  it('uses the currency given by the caller', async () => {
    await api.post('/api/razorpay/payments/pay_1/capture', {
      amount: 1000,
      currency: 'USD',
    })

    expect(razorpay.payments.capture).toHaveBeenCalledWith('pay_1', 1000, 'USD')
  })

  it.each([
    ['fractional', 499.5],
    ['zero', 0],
    ['negative', -100],
    ['a string', '1000'],
    ['missing', undefined],
  ])('rejects an amount that is %s', async (_label, amount) => {
    const res = await api.post('/api/razorpay/payments/pay_1/capture', {
      amount,
    })

    expect(res.status).toBe(400)
    expect(invalidFields(res.body)).toEqual(['amount'])
    expect(razorpay.payments.capture).not.toHaveBeenCalled()
  })

  it.each(['IN', 'RUPEE', ''])('rejects the currency %j', async (currency) => {
    const res = await api.post('/api/razorpay/payments/pay_1/capture', {
      amount: 1000,
      currency,
    })

    expect(res.status).toBe(400)
    expect(invalidFields(res.body)).toEqual(['currency'])
  })

  it('forwards a mismatched-amount rejection from Razorpay', async () => {
    razorpay.payments.capture.mockRejectedValueOnce(
      razorpayRejection(
        400,
        'Capture amount must be equal to the amount authorized'
      )
    )

    const res = await api.post('/api/razorpay/payments/pay_1/capture', {
      amount: 1,
    })

    expect(res.status).toBe(400)
    expect(res.body.error.message).toBe(
      'Capture amount must be equal to the amount authorized'
    )
  })
})

describe('OTP flow', () => {
  it('generates an OTP for the payment', async () => {
    const res = await api.post('/api/razorpay/payments/pay_1/otp/generate')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ otp: { razorpay_payment_id: 'pay_1' } })
    expect(razorpay.payments.otpGenerate).toHaveBeenCalledWith('pay_1')
  })

  it('submits the OTP the customer entered', async () => {
    const res = await api.post('/api/razorpay/payments/pay_1/otp/submit', {
      otp: '123456',
    })

    expect(res.status).toBe(200)
    expect(razorpay.payments.otpSubmit).toHaveBeenCalledWith('pay_1', {
      otp: '123456',
    })
    expect(res.body).toEqual({ otp: { razorpay_payment_id: 'pay_1' } })
  })

  it.each([
    ['missing', {}],
    ['blank', { otp: '' }],
    ['a number', { otp: 123456 }],
  ])('rejects an OTP that is %s', async (_label, body) => {
    const res = await api.post('/api/razorpay/payments/pay_1/otp/submit', body)

    expect(res.status).toBe(400)
    expect(res.body.error.issues).toEqual([
      { field: 'otp', message: 'OTP is required' },
    ])
    expect(razorpay.payments.otpSubmit).not.toHaveBeenCalled()
  })

  it('forwards a wrong-OTP rejection from Razorpay', async () => {
    razorpay.payments.otpSubmit.mockRejectedValueOnce(
      razorpayRejection(400, 'Payment failed due to incorrect OTP')
    )

    const res = await api.post('/api/razorpay/payments/pay_1/otp/submit', {
      otp: '000000',
    })

    expect(res.status).toBe(400)
    expect(res.body.error.message).toBe('Payment failed due to incorrect OTP')
  })

  it('resends the OTP', async () => {
    const res = await api.post('/api/razorpay/payments/pay_1/otp/resend')

    expect(res.status).toBe(200)
    expect(razorpay.payments.otpResend).toHaveBeenCalledWith('pay_1')
  })
})
