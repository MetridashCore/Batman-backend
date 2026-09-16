import { Router } from 'express'
import { z } from 'zod'
import { email, requiredString } from '../../http/schema.ts'
import { razorpay } from '../../providers/razorpay.ts'

const router = Router()

const createCustomerSchema = z.object({
  name: requiredString('Name'),
  email: email(),
  // Razorpay accepts a contact number as either a string or a number.
  contact: z.union([z.string().min(1), z.number()], {
    error: 'Contact is required',
  }),
})

/** GET /api/razorpay/customers - list every customer. */
router.get('/', async (_req, res) => {
  const customers = await razorpay.customers.all()
  res.json({ customers })
})

/** POST /api/razorpay/customers - create a customer. */
router.post('/', async (req, res) => {
  const { name, email, contact } = createCustomerSchema.parse(req.body)

  const customer = await razorpay.customers.create({ name, email, contact })
  res.status(201).json({ customer })
})

/** GET /api/razorpay/customers/:customerId - fetch one customer. */
router.get('/:customerId', async (req, res) => {
  const customer = await razorpay.customers.fetch(req.params.customerId)
  res.json({ customer })
})

/** GET /api/razorpay/customers/:customerId/tokens - tokens saved by a customer. */
router.get('/:customerId/tokens', async (req, res) => {
  const tokens = await razorpay.customers.fetchTokens(req.params.customerId)
  res.json({ tokens })
})

/** GET /api/razorpay/customers/:customerId/tokens/:tokenId - one saved token. */
router.get('/:customerId/tokens/:tokenId', async (req, res) => {
  const token = await razorpay.customers.fetchToken(
    req.params.customerId,
    req.params.tokenId
  )
  res.json({ token })
})

export default router
