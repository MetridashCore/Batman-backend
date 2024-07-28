import { router, stripe } from '../../startup'

// checkout api
router.post('/', async (req, res) => {
  const { products } = req.body

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: products.prices * 100,
          product_data: {
            name: `${products.tokens} tokens/${products.words} words`,
          },
        },

        quantity: 1, // Add this line to specify the quantity
      },
    ],
    mode: 'payment',
    success_url: `${process.env.BASE_URL!}/success`,
    cancel_url: `${process.env.BASE_URL}/cancel`,
  })
  res.json({ id: session.id })
})

export default router
