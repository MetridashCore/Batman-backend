import { Router } from 'express'
import { z } from 'zod'
import { amount } from '../../http/schema.ts'
import { stripe } from '../../providers/stripe.ts'
import { env } from '../../config/env.ts'
import { toMinorUnits } from '../../http/money.ts'

const router = Router()

const checkoutSchema = z.object({
  products: z.object({
    // Singular in meaning; the plural name is what clients already send.
    prices: amount('Price'),
    tokens: z.union([z.string(), z.number()]),
    words: z.union([z.string(), z.number()]),
  }),
})

/** POST /api/stripe/checkout - open a Stripe Checkout session. */
router.post('/', async (req, res) => {
  const { products } = checkoutSchema.parse(req.body)

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: toMinorUnits(products.prices),
          product_data: {
            name: `${products.tokens} tokens/${products.words} words`,
          },
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${env.BASE_URL}/success`,
    cancel_url: `${env.BASE_URL}/cancel`,
  })

  res.json({ id: session.id, url: session.url })
})

export default router
