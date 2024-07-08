import Stripe from 'stripe'

const stripePackage = new Stripe(process.env.STRIPE_SECRET!, {
  apiVersion: '2023-08-16',
})

export default stripePackage
