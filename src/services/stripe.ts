import process from 'node:process'
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET!, {
  apiVersion: "2026-08-26.dahlia" ,
})
