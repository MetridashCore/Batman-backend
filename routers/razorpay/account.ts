import { z } from 'zod'
import { router, razorpay } from '../../startup'

const schema = z.object({
  email: z.string().email(),
  phone: z.number({
    required_error:
      'Phone number should be at least 8 digits, including country code',
    invalid_type_error: 'Only Number is allowed',
  }),
  legal_business_name: z
    .string()
    .min(1, { message: 'Legal Business Name is required' }),
  customer_facing_business_name: z
    .string()
    .min(1, { message: 'Customer Facing Business Name is required' }),
  business_type: z.string().min(1, { message: 'Business Name is required' }),
  contact_name: z.string().min(1, { message: 'Contact Name is required' }),
  category: z.string().min(1, { message: 'Category is required' }),
  subcategory: z.string(),
  description: z.string(),
  street1: z.string().min(1, { message: 'Street is required' }),
  street2: z.string(),
  city: z.string().min(1, { message: 'City is required' }),
  state: z.string().min(1, { message: 'State is required' }),
  postal_code: z.string().min(1, { message: 'Postal code is required' }),
  country: z.string().min(1, { message: 'Country is required' }),
  pan: z.string(),
  gst: z.string(),
  business_model: z.string(),
})

router.get('/:id', async (req, res) => {
  try {
    const account = await razorpay.accounts.fetch(req.params.id)
    return res.json({ account })
  } catch (error) {
    return res.json({ error })
  }
})

router.post('/', async (req, res) => {
  const {
    email,
    phone,
    legal_business_name,
    customer_facing_business_name,
    business_type,
    contact_name,
    category,
    subcategory,
    description,
    street1,
    street2,
    city,
    state,
    postal_code,
    country,
    business_model,
    pan,
    gst,
  } = schema.parse(req.body)
  try {
    const account = await razorpay.accounts.create({
      email,
      phone,
      legal_business_name,
      customer_facing_business_name,
      business_type,
      contact_name,
      profile: {
        category,
        subcategory,
        description,
        addresses: {
          operation: {
            street1,
            street2,
            city,
            state,
            postal_code,
            country,
          },
        },
        business_model,
      },
      legal_info: {
        pan,
        gst,
      },
    })
    return res.json({ account })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.json({ message: error.issues[0].message })
    }
    return res.json({ error })
  }
})

export default router
