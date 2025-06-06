import { z } from 'zod'
import { router, razorpay } from '../../startup'

const schema = z.object({
  amount: z
    .number({
      invalid_type_error: 'Only Number is allowed',
      required_error: 'The amount must be at least INR 1.00',
    })
    .min(1, { message: 'Amount must be less than or equal to 1.00 INR' }),
  account_number: z.string().min(1, { message: 'Account Number is required' }),
  name: z.string().min(1, { message: 'Name is required' }),
  ifsc: z.string().min(1, { message: 'IFSC is required' }),
})

router.get('/', async (req, res) => {
  try {
    const orders = await razorpay.orders.all()
    res.json({ orders })
  } catch (error) {
    res.json({ error })
  }
})

router.post('/', async (req, res) => {
  try {
    const { amount } = schema.parse(req.body)
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: 'INR',
      partial_payment: false,
    })
    res.json({ order })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.json({ message: error.issues[0].message })
      return
    }
    res.json({ error })
  }
})

router.post('/banking/upi', async (req, res) => {
  try {
    const { amount, account_number, name, ifsc } = schema.parse(req.body)
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: 'INR',
      partial_payment: false,
      bank_account: {
        account_number,
        name,
        ifsc,
      },
    })
    res.json({ order })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.json({ message: error.issues[0].message })
      return
    }
    res.json({ error })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const order = await razorpay.orders.fetch(req.params.id)
    res.json({ order })
  } catch (error) {
    res.json({ error })
  }
})

export default router
