import { Router } from 'express'
import { z } from 'zod'
import { amount, requiredString } from '../../http/schema.ts'
import { razorpay } from '../../providers/razorpay.ts'
import { toMinorUnits } from '../../http/money.ts'

const router = Router()

const createOrderSchema = z.object({
  amount: amount(),
})

/** The bank fields are only needed for the UPI/bank-transfer variant. */
const createBankOrderSchema = createOrderSchema.extend({
  account_number: requiredString('Account Number'),
  name: requiredString('Name'),
  ifsc: requiredString('IFSC'),
})

/** GET /api/razorpay/orders - list every order. */
router.get('/', async (_req, res) => {
  const orders = await razorpay.orders.all()
  res.json({ orders })
})

/** POST /api/razorpay/orders - create an order. `amount` is in rupees. */
router.post('/', async (req, res) => {
  const { amount } = createOrderSchema.parse(req.body)

  const order = await razorpay.orders.create({
    amount: toMinorUnits(amount),
    currency: 'INR',
    partial_payment: false,
  })
  res.status(201).json({ order })
})

/** POST /api/razorpay/orders/banking/upi - create a bank-transfer order. */
router.post('/banking/upi', async (req, res) => {
  const { amount, account_number, name, ifsc } = createBankOrderSchema.parse(
    req.body
  )

  const order = await razorpay.orders.create({
    amount: toMinorUnits(amount),
    currency: 'INR',
    partial_payment: false,
    bank_account: { account_number, name, ifsc },
  })
  res.status(201).json({ order })
})

/** GET /api/razorpay/orders/:orderId - fetch one order. */
router.get('/:orderId', async (req, res) => {
  const order = await razorpay.orders.fetch(req.params.orderId)
  res.json({ order })
})

/** GET /api/razorpay/orders/:orderId/payments - payments against an order. */
router.get('/:orderId/payments', async (req, res) => {
  const payments = await razorpay.orders.fetchPayments(req.params.orderId)
  res.json({ payments })
})

export default router
