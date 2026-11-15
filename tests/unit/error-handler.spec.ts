import type { NextFunction, Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

const config = vi.hoisted(() => ({ isProduction: false }))

vi.mock('../../src/config/env.ts', () => ({
  get isProduction() {
    return config.isProduction
  },
}))
vi.mock('@sentry/node', () => ({ captureException: vi.fn() }))

const Sentry = await import('@sentry/node')
const { errorHandler } = await import('../../src/middleware/error-handler.ts')
const { ApiError } = await import('../../src/http/api-error.ts')

/** A minimal `Response` double that records what the handler sent. */
function fakeResponse({ headersSent = false } = {}) {
  const res = {
    headersSent,
    statusCode: 200,
    body: undefined as any,
    status: vi.fn((code: number) => {
      res.statusCode = code
      return res
    }),
    json: vi.fn((body: unknown) => {
      res.body = body
      return res
    }),
  }
  return res
}

function handle(err: unknown, options?: { headersSent?: boolean }) {
  const res = fakeResponse(options)
  const next = vi.fn()
  errorHandler(
    err,
    {} as Request,
    res as unknown as Response,
    next as unknown as NextFunction
  )
  return { res, next }
}

beforeEach(() => {
  config.isProduction = false
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('errorHandler', () => {
  describe('validation errors', () => {
    it('responds 400 with one issue per failing field', () => {
      const schema = z.object({ name: z.string(), age: z.number() })
      const result = schema.safeParse({})

      const { res } = handle(result.error)

      expect(res.statusCode).toBe(400)
      expect(res.body.error.message).toBe('Validation failed')
      expect(res.body.error.issues.map((i: any) => i.field)).toEqual([
        'name',
        'age',
      ])
    })

    it('joins nested paths with dots', () => {
      const schema = z.object({
        products: z.object({ prices: z.number() }),
        items: z.array(z.object({ qty: z.number() })),
      })
      const result = schema.safeParse({ products: {}, items: [{}] })

      const { res } = handle(result.error)

      expect(res.body.error.issues.map((i: any) => i.field)).toEqual([
        'products.prices',
        'items.0.qty',
      ])
    })

    it('does not report validation failures to Sentry', () => {
      handle(z.string().safeParse(1).error)
      expect(Sentry.captureException).not.toHaveBeenCalled()
    })
  })

  describe('ApiError', () => {
    it('uses the status and message it carries', () => {
      const { res } = handle(new ApiError(409, 'Already captured', { id: 'x' }))

      expect(res.statusCode).toBe(409)
      expect(res.body).toEqual({
        error: { message: 'Already captured', details: { id: 'x' } },
      })
      expect(Sentry.captureException).not.toHaveBeenCalled()
    })
  })

  describe('request parse errors', () => {
    /** Shaped like the http-errors instances express' body parsers throw. */
    function parserError(type: string, status: number, message: string) {
      return Object.assign(new Error(message), {
        type,
        status,
        statusCode: status,
        expose: status < 500,
      })
    }

    it('replaces the JSON.parse message for malformed JSON', () => {
      const { res } = handle(
        parserError(
          'entity.parse.failed',
          400,
          "Expected ',' or '}' after property value in JSON at position 12"
        )
      )

      expect(res.statusCode).toBe(400)
      expect(res.body).toEqual({
        error: { message: 'Request body could not be parsed' },
      })
    })

    it('explains an oversized body', () => {
      const { res } = handle(
        parserError('entity.too.large', 413, 'request entity too large')
      )

      expect(res.statusCode).toBe(413)
      expect(res.body).toEqual({
        error: { message: 'Request body is too large' },
      })
    })

    it('falls back to the reason phrase for other parser failures', () => {
      const { res } = handle(
        parserError('encoding.unsupported', 415, 'unsupported content encoding "x"')
      )

      expect(res.statusCode).toBe(415)
      expect(res.body.error.message).toBe('Unsupported Media Type')
    })

    it('does not report client parse errors to Sentry', () => {
      handle(parserError('entity.parse.failed', 400, 'bad'))
      expect(Sentry.captureException).not.toHaveBeenCalled()
    })

    it('treats a non-exposed (5xx) parser error as unexpected', () => {
      const err = parserError('stream.not.readable', 500, 'stream is not readable')

      const { res } = handle(err)

      expect(res.statusCode).toBe(500)
      expect(Sentry.captureException).toHaveBeenCalledWith(err)
    })

    it('leaves a Stripe error, which has `type` but no `expose`, to the provider path', () => {
      const err = Object.assign(new Error('No such price'), {
        type: 'StripeInvalidRequestError',
        statusCode: 400,
      })

      const { res } = handle(err)

      expect(res.statusCode).toBe(400)
      expect(res.body.error.message).toBe('No such price')
    })
  })

  describe('provider errors', () => {
    it("forwards a Razorpay 4xx with the upstream description", () => {
      // The Razorpay SDK rejects with a plain object, not an Error.
      const { res } = handle({
        statusCode: 400,
        error: { code: 'BAD_REQUEST_ERROR', description: 'Invalid amount' },
      })

      expect(res.statusCode).toBe(400)
      expect(res.body).toEqual({ error: { message: 'Invalid amount' } })
    })

    it('falls back to the Error message when there is no description', () => {
      // Shape of a Stripe SDK error: an Error subclass with `statusCode`.
      const err = Object.assign(new Error('No such checkout session'), {
        statusCode: 404,
      })

      const { res } = handle(err)

      expect(res.statusCode).toBe(404)
      expect(res.body.error.message).toBe('No such checkout session')
    })

    it('falls back to the HTTP reason phrase when the upstream sent nothing', () => {
      const { res } = handle({ statusCode: 404 })

      expect(res.statusCode).toBe(404)
      expect(res.body.error.message).toBe('Not Found')
    })

    it('ignores a non-string description', () => {
      const { res } = handle({ statusCode: 401, error: { description: 123 } })
      expect(res.body.error.message).toBe('Unauthorized')
    })

    it('ignores an empty description', () => {
      const { res } = handle({ statusCode: 401, error: { description: '' } })
      expect(res.body.error.message).toBe('Unauthorized')
    })

    it.each([500, 502, 503])(
      'treats an upstream %d as our failure: 500 and reported',
      (statusCode) => {
        const err = { statusCode, error: { description: 'upstream detail' } }

        const { res } = handle(err)

        expect(res.statusCode).toBe(500)
        expect(res.body.error.message).toBe('Internal Server Error')
        expect(Sentry.captureException).toHaveBeenCalledWith(err)
      }
    )

    it.each([200, 302, 399, 600])('does not trust a statusCode of %d', (code) => {
      const { res } = handle({ statusCode: code })
      expect(res.statusCode).toBe(500)
    })

    it('does not trust a statusCode that is not a number', () => {
      const { res } = handle({ statusCode: '404' })
      expect(res.statusCode).toBe(500)
    })
  })

  describe('unexpected errors', () => {
    it.each([
      ['an Error', new TypeError('boom')],
      ['a string', 'boom'],
      ['null', null],
      ['undefined', undefined],
    ])('turns %s into a 500 and reports it', (_label, err) => {
      const { res } = handle(err)

      expect(res.statusCode).toBe(500)
      expect(res.body.error.message).toBe('Internal Server Error')
      expect(Sentry.captureException).toHaveBeenCalledWith(err)
      expect(console.error).toHaveBeenCalled()
    })

    it('includes the error detail outside production', () => {
      const { res } = handle(new TypeError('boom'))
      expect(res.body.error.detail).toBe('TypeError: boom')
    })

    it('hides the error detail in production', () => {
      config.isProduction = true

      const { res } = handle(new TypeError('secret internals'))

      expect(res.body).toEqual({ error: { message: 'Internal Server Error' } })
      expect(JSON.stringify(res.body)).not.toContain('secret internals')
    })
  })

  it('delegates to Express once headers have been sent', () => {
    const err = new ApiError(400, 'too late')

    const { res, next } = handle(err, { headersSent: true })

    expect(next).toHaveBeenCalledWith(err)
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })
})
