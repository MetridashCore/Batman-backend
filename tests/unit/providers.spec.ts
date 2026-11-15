import { beforeEach, describe, expect, it, vi } from 'vitest'

const config = vi.hoisted(() => ({
  env: {
    RAZORPAY_KEY_ID: 'rzp_test_id',
    RAZORPAY_KEY_SECRET: 'rzp_test_secret',
    OAUTH_TOKEN: undefined as string | undefined,
    STRIPE_SECRET: 'sk_test_x',
  },
}))

vi.mock('../../src/config/env.ts', () => ({
  get env() {
    return config.env
  },
}))

// `function`, not an arrow: the provider modules call these with `new`.
vi.mock('razorpay', () => ({ default: vi.fn(function Razorpay() {}) }))
vi.mock('stripe', () => ({ default: vi.fn(function Stripe() {}) }))

const { default: Razorpay } = await import('razorpay')
const { default: Stripe } = await import('stripe')

/** Each provider builds its client at import time, so import fresh. */
async function load(path: string) {
  vi.resetModules()
  return import(path)
}

beforeEach(() => {
  config.env.OAUTH_TOKEN = undefined
})

describe('razorpay client', () => {
  it('authenticates with the key pair', async () => {
    await load('../../src/providers/razorpay.ts')

    expect(Razorpay).toHaveBeenCalledOnce()
    expect(Razorpay).toHaveBeenCalledWith({
      key_id: 'rzp_test_id',
      key_secret: 'rzp_test_secret',
    })
  })

  it('does not pass an oauthToken key at all when none is configured', async () => {
    // An explicit `oauthToken: undefined` makes the SDK drop the key pair.
    await load('../../src/providers/razorpay.ts')

    const options = vi.mocked(Razorpay).mock.calls[0]?.[0]
    expect(options).not.toHaveProperty('oauthToken')
  })

  it('forwards the OAuth token when one is configured', async () => {
    config.env.OAUTH_TOKEN = 'oauth_abc'

    await load('../../src/providers/razorpay.ts')

    expect(Razorpay).toHaveBeenCalledWith(
      expect.objectContaining({ oauthToken: 'oauth_abc' })
    )
  })

  it('exports a single shared instance', async () => {
    const { razorpay } = await load('../../src/providers/razorpay.ts')
    expect(razorpay).toBe(vi.mocked(Razorpay).mock.instances[0])
  })
})

describe('stripe client', () => {
  it('uses the secret and pins the API version', async () => {
    await load('../../src/providers/stripe.ts')

    expect(Stripe).toHaveBeenCalledOnce()
    expect(Stripe).toHaveBeenCalledWith('sk_test_x', {
      apiVersion: expect.stringMatching(/^\d{4}-\d{2}-\d{2}\.\w+$/),
    })
  })
})
