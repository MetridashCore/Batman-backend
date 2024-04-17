import stripe from "stripe"

const stripePackage = stripe(process.env.STRIPE_SECRET)

export default stripePackage
