import { Router } from 'express'
import { z } from 'zod'
import { amount, count, email, requiredString } from '../../http/schema.ts'
import { razorpay } from '../../providers/razorpay.ts'
import { toMinorUnits } from '../../http/money.ts'

const router = Router()

const createInvoiceSchema = z.object({
  name: requiredString('Name'),
  contact: requiredString('Contact'),
  email: email(),

  billing_address_line1: requiredString('Billing address'),
  billing_address_line2: z.string().optional(),
  billing_address_zipcode: requiredString('Billing zipcode'),
  billing_address_city: requiredString('Billing city'),
  billing_address_state: requiredString('Billing state'),
  billing_address_country: requiredString('Billing country'),

  shipping_address_line1: requiredString('Shipping address'),
  shipping_address_line2: z.string().optional(),
  shipping_address_zipcode: requiredString('Shipping zipcode'),
  shipping_address_city: requiredString('Shipping city'),
  shipping_address_state: requiredString('Shipping state'),
  shipping_address_country: requiredString('Shipping country'),

  line_items_name: requiredString('Item name'),
  line_items_description: requiredString('Item description'),
  amount: amount(),
  quantity: count('Quantity'),

  description: z.string().optional(),
})

/** GET /api/razorpay/invoices - list every invoice. */
router.get('/', async (_req, res) => {
  const invoices = await razorpay.invoices.all()
  res.json({ invoices })
})

/** GET /api/razorpay/invoices/:invoiceId - fetch one invoice. */
router.get('/:invoiceId', async (req, res) => {
  const invoice = await razorpay.invoices.fetch(req.params.invoiceId)
  res.json({ invoice })
})

/** POST /api/razorpay/invoices - raise an invoice. `amount` is in rupees. */
router.post('/', async (req, res) => {
  const body = createInvoiceSchema.parse(req.body)

  const invoice = await razorpay.invoices.create({
    type: 'invoice',
    description: body.description ?? 'an invoice',
    partial_payment: false,
    customer: {
      name: body.name,
      contact: body.contact,
      email: body.email,
      billing_address: {
        line1: body.billing_address_line1,
        line2: body.billing_address_line2,
        zipcode: body.billing_address_zipcode,
        city: body.billing_address_city,
        state: body.billing_address_state,
        country: body.billing_address_country,
      },
      shipping_address: {
        line1: body.shipping_address_line1,
        line2: body.shipping_address_line2,
        zipcode: body.shipping_address_zipcode,
        city: body.shipping_address_city,
        state: body.shipping_address_state,
        country: body.shipping_address_country,
      },
    },
    line_items: [
      {
        name: body.line_items_name,
        description: body.line_items_description,
        amount: toMinorUnits(body.amount),
        quantity: body.quantity,
      },
    ],
  })
  res.status(201).json({ invoice })
})

export default router
