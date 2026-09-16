import process from 'node:process'
import { describe, expect, it } from 'vitest'
import { razorpay } from '../../src/providers/razorpay.ts'

/**
 * These call the real Razorpay API, so they are opt-in: run them with
 * `RUN_LIVE_TESTS=1 pnpm test` and real credentials in the environment.
 */
const live = process.env.RUN_LIVE_TESTS === '1' ? describe : describe.skip

live('razorpay live API', () => {
  describe('customers', () => {
    it('lists customers with the expected shape', async () => {
      const customers = await razorpay.customers.all()

      for (const customer of customers.items) {
        expect(customer).toHaveProperty('id')
        expect(customer).toHaveProperty('name')
        expect(customer).toHaveProperty('email')
        expect(customer).toHaveProperty('contact')
      }
    })
  })

  describe('orders', () => {
    it('lists orders with the expected shape', async () => {
      const orders = await razorpay.orders.all()

      for (const order of orders.items) {
        expect(order).toHaveProperty('id')
        expect(order).toHaveProperty('entity')
        expect(order).toHaveProperty('amount')
        expect(order).toHaveProperty('currency')
      }
    })
  })
})
