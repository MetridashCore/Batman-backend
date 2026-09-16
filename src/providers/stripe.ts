import Stripe from 'stripe'
import { env } from '../config/env.ts'

/** Shared Stripe client, pinned to a known API version. */
export const stripe = new Stripe(env.STRIPE_SECRET, {
  apiVersion: '2026-08-26.dahlia',
})
