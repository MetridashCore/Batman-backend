import { z } from 'zod'
import { router, razorpay } from '../../startup'

const schema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  contact: z.string().min(1, { message: 'Contact is required' }),
  email: z.string().email(),
  billing_address_line1: z
    .string()
    .min(1, { message: 'Billing address is required' }),
  billing_address_line2: z.string(),
  billing_address_zipcode: z
    .string()
    .min(1, { message: 'Zipcode is required' }),
  billing_address_city: z.string().min(1, { message: 'City is required' }),
  billing_address_state: z.string().min(1, { message: 'State is required' }),
  billing_address_country: z
    .string()
    .min(1, { message: 'Country is required' }),
  shipping_address_line1: z
    .string()
    .min(1, { message: 'Shipping address is required' }),
  shipping_address_line2: z.string(),
  shipping_address_zipcode: z
    .string()
    .min(1, { message: 'Zipcode is required' }),
  shipping_address_city: z.string().min(1, { message: 'State is required' }),
  shipping_address_state: z.string().min(1, { message: 'State is required' }),
  shipping_address_country: z
    .string()
    .min(1, { message: 'Country is required' }),
  line_items_name: z.string().min(1, { message: 'Name is required' }),
  line_items_description: z
    .string()
    .min(1, { message: 'Description is required' }),
  amount: z.number({
    required_error: 'Amount is required',
    invalid_type_error: 'Only Number is allowed',
  }),
  quantity: z.number({
    required_error: 'Quantity is required',
    invalid_type_error: 'Only Number is allowed',
  }),
})

router.get('/', async (req, res) => {
  try {
    const invoices = await razorpay.invoices.all()
    return res.json({ invoices })
  } catch (error) {
    return res.json({ error })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const invoice = await razorpay.invoices.fetch(req.params.id)
    return res.json({ invoice })
  } catch (error) {
    return res.json({ error })
  }
})

router.post('/', async (req, res) => {
  const {
    name,
    contact,
    email,
    billing_address_line1,
    billing_address_line2,
    billing_address_zipcode,
    billing_address_city,
    billing_address_state,
    billing_address_country,
    shipping_address_line1,
    shipping_address_line2,
    shipping_address_zipcode,
    shipping_address_city,
    shipping_address_state,
    shipping_address_country,
    quantity,
    amount,
    line_items_name,
    line_items_description,
  } = schema.parse(req.body)
  try {
    const invoice = await razorpay.invoices.create({
      type: 'invoice',
      description: 'an invoice',
      partial_payment: false,
      customer: {
        name,
        contact,
        email,
        billing_address: {
          line1: billing_address_line1,
          line2: billing_address_line2,
          zipcode: billing_address_zipcode,
          city: billing_address_city,
          state: billing_address_state,
          country: billing_address_country,
        },
        shipping_address: {
          line1: shipping_address_line1,
          line2: shipping_address_line2,
          zipcode: shipping_address_zipcode,
          city: shipping_address_city,
          state: shipping_address_state,
          country: shipping_address_country,
        },
      },
      line_items: [
        {
          name: line_items_name,
          description: line_items_description,
          amount,
          quantity,
        },
      ],
    })
    return res.json({ invoice })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.json({ message: error.issues[0].message })
    }
    return res.json({ error })
  }
})

export default router
