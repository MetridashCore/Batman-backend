import razorpay from '../../src/services/razorpay'

describe('/api/razorpay/customers', () => {
  describe('GET /', () => {
    it('should return all customers', async () => {
      const customers = await razorpay.customers.all()
      if (customers.items.length > 0) {
        for (const customer of customers.items) {
          expect(customer).toHaveProperty('id')
          expect(customer).toHaveProperty('name')
          expect(customer).toHaveProperty('email')
          expect(customer).toHaveProperty('contact')
        }
      }
    })
    it('should return single customer', async () => {
      const customer = await razorpay.customers.fetch('cust_MNZ5p8CBJ5DSbD')
      expect(customer).toBeTruthy()
      expect(customer).toHaveProperty('id')
      expect(customer).toHaveProperty('name')
      expect(customer).toHaveProperty('email')
      expect(customer).toHaveProperty('contact')
    })
  })
  describe('POST /', () => {
    it('should create single customer', async () => {
      try {
        const newCustomerData = {
          name: 'New Customer',
          email: 'new@example.com',
          contact: +9184938274,
        }
        const customer = await razorpay.customers.create(newCustomerData)
        expect(customer).toBeTruthy()
      } catch (error: any) {
        expect(error.statusCode).toBe(400)
      }
    })
  })
})
