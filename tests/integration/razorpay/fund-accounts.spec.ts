import { describe, expect, it } from 'vitest'
import { createApp } from '../../../src/app.ts'
import { razorpay } from '../../helpers/fake-providers.ts'
import { invalidFields, useTestServer } from '../../helpers/server.ts'

const api = useTestServer(createApp)

const bankAccount = {
  name: 'Bruce Wayne',
  account_number: '11214311215411',
  ifsc: 'HDFC0000053',
}

describe('GET /api/razorpay/fund-accounts/:customerId', () => {
  it("lists the customer's fund accounts", async () => {
    const res = await api.get('/api/razorpay/fund-accounts/cust_1')

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('fundAccounts.items')
    expect(razorpay.fundAccount.fetch).toHaveBeenCalledWith('cust_1')
  })
})

describe('POST /api/razorpay/fund-accounts/:customerId', () => {
  it('attaches a bank account to the customer from the URL', async () => {
    const res = await api.post('/api/razorpay/fund-accounts/cust_1', bankAccount)

    expect(res.status).toBe(201)
    expect(razorpay.fundAccount.create).toHaveBeenCalledWith({
      customer_id: 'cust_1',
      account_type: 'bank_account',
      bank_account: bankAccount,
    })
    expect(res.body).toHaveProperty('fundAccount.id', 'fa_test')
  })

  it('takes the customer id from the path, not the body', async () => {
    await api.post('/api/razorpay/fund-accounts/cust_1', {
      ...bankAccount,
      customer_id: 'cust_someone_else',
    })

    expect(razorpay.fundAccount.create).toHaveBeenCalledWith(
      expect.objectContaining({ customer_id: 'cust_1' })
    )
  })

  it('requires every bank field', async () => {
    const res = await api.post('/api/razorpay/fund-accounts/cust_1', {})

    expect(res.status).toBe(400)
    expect(invalidFields(res.body)).toEqual(['name', 'account_number', 'ifsc'])
    expect(razorpay.fundAccount.create).not.toHaveBeenCalled()
  })

  it('rejects a numeric account number', async () => {
    // Account numbers can have leading zeros that a number would drop.
    const res = await api.post('/api/razorpay/fund-accounts/cust_1', {
      ...bankAccount,
      account_number: 11214311215411,
    })

    expect(res.status).toBe(400)
    expect(invalidFields(res.body)).toEqual(['account_number'])
  })
})
