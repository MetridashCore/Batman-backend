import { Router } from 'express'
import { z } from 'zod'
import { email, requiredString } from '../../http/schema.ts'
import { razorpay } from '../../providers/razorpay.ts'

const router = Router()

/** Razorpay documents the business phone as 8-15 characters. */
const phoneSchema = z
  .union([z.string(), z.number()])
  .transform((value) => String(value))
  .refine((value) => value.length >= 8 && value.length <= 15, {
    message: 'Phone must be between 8 and 15 characters',
  })

/**
 * The request body is flat because it comes straight from an onboarding form;
 * it is reshaped into Razorpay's nested payload below.
 */
const createAccountSchema = z.object({
  email: email(),
  phone: phoneSchema,
  legal_business_name: requiredString('Legal Business Name'),
  customer_facing_business_name: requiredString('Customer Facing Business Name'),
  business_type: requiredString('Business Type'),
  contact_name: requiredString('Contact Name'),
  category: requiredString('Category'),
  street1: requiredString('Street'),
  city: requiredString('City'),
  state: requiredString('State'),
  postal_code: requiredString('Postal code'),
  country: requiredString('Country'),

  subcategory: z.string().optional(),
  description: z.string().optional(),
  business_model: z.string().optional(),
  pan: z.string().optional(),
  gst: z.string().optional(),
  street2: z.string().optional(),
})

/** GET /api/razorpay/accounts/:accountId - fetch a sub-merchant account. */
router.get('/:accountId', async (req, res) => {
  const account = await razorpay.accounts.fetch(req.params.accountId)
  res.json({ account })
})

/** POST /api/razorpay/accounts - onboard a sub-merchant account. */
router.post('/', async (req, res) => {
  const body = createAccountSchema.parse(req.body)

  const account = await razorpay.accounts.create({
    email: body.email,
    phone: body.phone,
    legal_business_name: body.legal_business_name,
    customer_facing_business_name: body.customer_facing_business_name,
    business_type: body.business_type,
    contact_name: body.contact_name,
    profile: {
      category: body.category,
      subcategory: body.subcategory,
      description: body.description,
      addresses: {
        operation: {
          street1: body.street1,
          // The SDK types `street2` as required though the API treats it as
          // optional; the schema stays honest and the gap is filled here.
          street2: body.street2 ?? '',
          city: body.city,
          state: body.state,
          postal_code: body.postal_code,
          country: body.country,
        },
      },
      business_model: body.business_model,
    },
    legal_info: {
      pan: body.pan,
      gst: body.gst,
    },
  })
  res.status(201).json({ account })
})

export default router
