declare global {
  namespace NodeJS {
    interface ProcessEnv {
      RAZORPAY_KEY_ID?: string
      RAZORPAY_KEY_SECRET?: string
      SENTRY_DSN?: string
      STRIPE_SECRET?: string
      BASE_URL?: string
      OAUTH_TOKEN?: string
    }
  }
}

export {}
