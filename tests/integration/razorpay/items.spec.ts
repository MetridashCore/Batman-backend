import { describe, expect, it } from 'vitest'
import { createApp } from '../../../src/app.ts'
import { razorpay, razorpayRejection } from '../../helpers/fake-providers.ts'
import { invalidFields, useTestServer } from '../../helpers/server.ts'

const api = useTestServer(createApp)

const item = { name: 'Pro plan', description: 'Monthly', amount: 19.99 }

describe('GET /api/razorpay/items', () => {
  it('returns the item collection', async () => {
    const res = await api.get('/api/razorpay/items')

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('items.items')
  })
})

describe('GET /api/razorpay/items/:itemId', () => {
  it('fetches the item by id', async () => {
    const res = await api.get('/api/razorpay/items/item_1')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ item: { id: 'item_1' } })
    expect(razorpay.items.fetch).toHaveBeenCalledWith('item_1')
  })
})

describe('POST /api/razorpay/items', () => {
  it('creates an INR item with the amount converted to paise', async () => {
    const res = await api.post('/api/razorpay/items', item)

    expect(res.status).toBe(201)
    // 19.99 * 100 is 1998.9999999999998 in floating point; it must round.
    expect(razorpay.items.create).toHaveBeenCalledWith({
      name: 'Pro plan',
      description: 'Monthly',
      amount: 1999,
      currency: 'INR',
    })
    expect(res.body.item).toMatchObject({ id: 'item_test', amount: 1999 })
  })

  it('requires name, description and amount', async () => {
    const res = await api.post('/api/razorpay/items', {})

    expect(res.status).toBe(400)
    expect(invalidFields(res.body)).toEqual(['name', 'description', 'amount'])
    expect(razorpay.items.create).not.toHaveBeenCalled()
  })

  it('rejects an amount sent as a string', async () => {
    const res = await api.post('/api/razorpay/items', { ...item, amount: '19.99' })

    expect(res.status).toBe(400)
    expect(invalidFields(res.body)).toEqual(['amount'])
  })
})

describe('PUT /api/razorpay/items/:itemId', () => {
  it('converts the amount on update too, not just on create', async () => {
    const res = await api.put('/api/razorpay/items/item_1', { ...item, amount: 25 })

    expect(res.status).toBe(200)
    expect(razorpay.items.edit).toHaveBeenCalledWith('item_1', {
      name: 'Pro plan',
      description: 'Monthly',
      amount: 2500,
    })
    expect(res.body).toEqual({
      item: { id: 'item_1', name: 'Pro plan', description: 'Monthly', amount: 2500 },
    })
  })

  it('validates the body before calling Razorpay', async () => {
    const res = await api.put('/api/razorpay/items/item_1', { name: 'Pro plan' })

    expect(res.status).toBe(400)
    expect(razorpay.items.edit).not.toHaveBeenCalled()
  })
})

describe('DELETE /api/razorpay/items/:itemId', () => {
  it('deletes the item and responds 204 with no body', async () => {
    const res = await api.delete('/api/razorpay/items/item_1')

    expect(res.status).toBe(204)
    expect(res.body).toBeNull()
    expect(razorpay.items.delete).toHaveBeenCalledWith('item_1')
  })

  it('forwards an upstream 400 for an unknown item', async () => {
    razorpay.items.delete.mockRejectedValueOnce(
      razorpayRejection(400, 'The id provided does not exist')
    )

    const res = await api.delete('/api/razorpay/items/item_missing')

    expect(res.status).toBe(400)
    expect(res.body.error.message).toBe('The id provided does not exist')
  })
})
