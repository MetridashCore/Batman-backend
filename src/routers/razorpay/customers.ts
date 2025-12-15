import express from 'express'
import { z } from 'zod'
import { razorpay } from '../../services/razorpay'

const router = express.Router()

const schema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.email({ message: 'Email is required' }),
  contact: z.number().min(1, { message:'Number is required' }),
})

router.get('/', async (req, res) => {
  try {
    const customers = await razorpay.customers.all()
    res.json({ customers })
  } catch (error) {
    res.json({ error })
  }
})

router.post('/', async (req, res) => {
  try {
    const data = schema.parse(req.body)
    const { name, email, contact } = data
    const customer = await razorpay.customers.create({
      name,
      contact,
      email,
    })
    res.json({ customer })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.json({ message: error.issues[0].message })
      return
    }
    res.json({ error })
  }
})

router.get('/:customerId', async (req, res) => {
  try {
    const customer = await razorpay.customers.fetch(req.params.customerId)
    res.json({ customer })
  } catch (error) {
    res.json({ error })
  }
})

export default router
