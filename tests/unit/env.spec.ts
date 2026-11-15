import process from 'node:process'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * `src/config/env.ts` parses `process.env` at import time, so every test stubs
 * the environment and then imports a fresh copy of the module.
 */
async function loadEnvModule() {
  vi.resetModules()
  return import('../../src/config/env.ts')
}

/** `process.exit` is turned into a throw so a failed load can be asserted on. */
class ExitCalled extends Error {
  constructor(readonly code: unknown) {
    super(`process.exit(${code})`)
  }
}

beforeEach(() => {
  vi.spyOn(process, 'exit').mockImplementation((code) => {
    throw new ExitCalled(code)
  })
  vi.spyOn(console, 'error').mockImplementation(() => {})

  // A known-good baseline; tests override single variables from here.
  vi.stubEnv('RAZORPAY_KEY_ID', 'rzp_test_id')
  vi.stubEnv('RAZORPAY_KEY_SECRET', 'rzp_test_secret')
  vi.stubEnv('STRIPE_SECRET', 'sk_test_x')
  vi.stubEnv('NODE_ENV', 'test')
  vi.stubEnv('PORT', undefined)
  vi.stubEnv('BASE_URL', undefined)
  vi.stubEnv('SENTRY_DSN', undefined)
  vi.stubEnv('OAUTH_TOKEN', undefined)
})

describe('env', () => {
  it('loads a valid configuration', async () => {
    const { env } = await loadEnvModule()

    expect(env).toMatchObject({
      RAZORPAY_KEY_ID: 'rzp_test_id',
      RAZORPAY_KEY_SECRET: 'rzp_test_secret',
      STRIPE_SECRET: 'sk_test_x',
    })
  })

  it('applies defaults for optional variables', async () => {
    vi.stubEnv('NODE_ENV', undefined)

    const { env } = await loadEnvModule()

    expect(env.NODE_ENV).toBe('development')
    expect(env.PORT).toBe(8000)
    expect(env.BASE_URL).toBe('http://localhost:8000')
    expect(env.SENTRY_DSN).toBeUndefined()
    expect(env.OAUTH_TOKEN).toBeUndefined()
  })

  it('coerces PORT to a number', async () => {
    vi.stubEnv('PORT', '3000')
    const { env } = await loadEnvModule()
    expect(env.PORT).toBe(3000)
  })

  it('treats empty values as unset, as .env.example placeholders are', async () => {
    // Without this, `SENTRY_DSN=` would fail as an invalid URL and `BASE_URL=`
    // would not fall back to its default.
    vi.stubEnv('SENTRY_DSN', '')
    vi.stubEnv('BASE_URL', '')
    vi.stubEnv('PORT', '')

    const { env } = await loadEnvModule()

    expect(env.SENTRY_DSN).toBeUndefined()
    expect(env.BASE_URL).toBe('http://localhost:8000')
    expect(env.PORT).toBe(8000)
  })

  it('accepts a valid SENTRY_DSN', async () => {
    vi.stubEnv('SENTRY_DSN', 'https://key@o0.ingest.sentry.io/1')
    const { env } = await loadEnvModule()
    expect(env.SENTRY_DSN).toBe('https://key@o0.ingest.sentry.io/1')
  })

  describe('isProduction', () => {
    it.each([
      ['production', true],
      ['development', false],
      ['test', false],
    ])('is %s -> %s', async (nodeEnv, expected) => {
      vi.stubEnv('NODE_ENV', nodeEnv)
      const { isProduction } = await loadEnvModule()
      expect(isProduction).toBe(expected)
    })
  })

  describe('invalid configuration', () => {
    it.each(['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'STRIPE_SECRET'])(
      'exits with code 1 when %s is missing',
      async (name) => {
        vi.stubEnv(name, undefined)

        await expect(loadEnvModule()).rejects.toEqual(new ExitCalled(1))
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining(`${name}: is required`)
        )
      }
    )

    it('treats a blank required variable as missing', async () => {
      vi.stubEnv('STRIPE_SECRET', '')

      await expect(loadEnvModule()).rejects.toBeInstanceOf(ExitCalled)
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('STRIPE_SECRET: is required')
      )
    })

    it('names every offender in one message, not just the first', async () => {
      vi.stubEnv('RAZORPAY_KEY_ID', undefined)
      vi.stubEnv('STRIPE_SECRET', undefined)
      vi.stubEnv('PORT', 'not-a-port')

      await expect(loadEnvModule()).rejects.toBeInstanceOf(ExitCalled)

      const message = vi.mocked(console.error).mock.calls[0]?.[0] as string
      expect(message).toContain('RAZORPAY_KEY_ID')
      expect(message).toContain('STRIPE_SECRET')
      expect(message).toContain('PORT')
      expect(message).toContain('.env.example')
    })

    it.each([
      ['NODE_ENV', 'staging'],
      ['PORT', '-1'],
      ['PORT', '80.5'],
      ['BASE_URL', 'not a url'],
      ['SENTRY_DSN', 'not a url'],
    ])('rejects %s=%s', async (name, value) => {
      vi.stubEnv(name, value)

      await expect(loadEnvModule()).rejects.toBeInstanceOf(ExitCalled)
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining(name))
    })
  })
})
