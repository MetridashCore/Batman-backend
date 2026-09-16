import Razorpay from 'razorpay'
import { env } from '../config/env.ts'

/**
 * Shared Razorpay client.
 *
 * `oauthToken` is only forwarded when it is actually configured - passing
 * `undefined` explicitly makes the SDK treat the request as OAuth-authenticated
 * and drop the key pair.
 */
export const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
  ...(env.OAUTH_TOKEN ? { oauthToken: env.OAUTH_TOKEN } : {}),
})
