import { z } from 'zod'
import { router, razorpay } from '../../startup'

const schema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.string().email({ message: 'Email is required' }),
  contact: z.number({
    required_error:
      'Contact number should be at least 8 digits, including country code',
    invalid_type_error: 'Only Number is allowed',
  }),
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
    return res.json({ customer })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.json({ message: error.issues[0].message })
    }
    return res.json({ error })
  }
})

router.get('/:customerId', async (req, res) => {
  try {
    const customer = await razorpay.customers.fetch(req.params.customerId)
    return res.json({ customer })
  } catch (error) {
    return res.json({ error })
  }
})

export default router
