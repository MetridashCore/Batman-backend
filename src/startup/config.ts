export function config() {
  if (
    !process.env.RAZORPAY_KEY_ID ||
    !process.env.RAZORPAY_KEY_SECRET ||
    !process.env.STRIPE_SECRET
  ) {
    process.exit(1)
  }
}
