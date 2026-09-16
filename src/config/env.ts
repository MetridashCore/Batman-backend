import process from 'node:process'
import { z } from 'zod'

/**
 * The single source of truth for every environment variable the app reads.
 *
 * Nothing outside this module should touch `process.env`: importing `env`
 * guarantees the value exists and has the right type, which is what lets the
 * rest of the codebase drop the `process.env.FOO!` non-null assertions.
 */
/**
 * Blank values are filtered out before parsing, so the type check is the only
 * thing that can fail for these.
 */
const required = z.string({ error: 'is required' })

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(8000),

  // Razorpay: either a key pair or an OAuth token is used to authenticate.
  RAZORPAY_KEY_ID: required,
  RAZORPAY_KEY_SECRET: required,
  OAUTH_TOKEN: z.string().optional(),

  STRIPE_SECRET: required,

  // Where Stripe sends the customer back after checkout.
  BASE_URL: z.url().default('http://localhost:8000'),

  // Optional: error reporting is skipped entirely when this is unset.
  SENTRY_DSN: z.url().optional(),
})

export type Env = z.infer<typeof envSchema>

function loadEnv(): Env {
  // `.env` files habitually carry `KEY=` placeholders (see .env.example). An
  // empty string is not a value, so drop those and let optional variables fall
  // back to their defaults instead of failing as "invalid URL".
  const provided = Object.fromEntries(
    Object.entries(process.env).filter(([, value]) => value !== '')
  )

  const parsed = envSchema.safeParse(provided)

  if (!parsed.success) {
    // Name every offender rather than failing with a bare exit code.
    const problems = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')

    console.error(
      `Invalid environment configuration:\n${problems}\n\n` +
        'See .env.example for the full list of required variables.'
    )
    process.exit(1)
  }

  return parsed.data
}

export const env = loadEnv()

export const isProduction = env.NODE_ENV === 'production'
