import process from 'node:process'

/**
 * `src/config/env.ts` validates on import and exits when a variable is missing,
 * so values must exist before any module under test is loaded.
 */

// Forced: Vitest inherits Vite's reserved BASE_URL, which arrives as "/" and is
// not a valid absolute URL.
process.env.BASE_URL = 'http://localhost:8000'

// Placeholders only - a real value in the environment wins, which is what lets
// the opt-in suite in tests/live reach the actual Razorpay API.
process.env.RAZORPAY_KEY_ID ||= 'rzp_test_key_id'
process.env.RAZORPAY_KEY_SECRET ||= 'rzp_test_key_secret'
process.env.STRIPE_SECRET ||= 'sk_test_secret'
