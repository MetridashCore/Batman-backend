import { EventEmitter } from 'node:events'
import type { NextFunction, Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const config = vi.hoisted(() => ({
  env: { NODE_ENV: 'development', SENTRY_DSN: undefined as string | undefined },
  isProduction: false,
}))

vi.mock('../../src/config/env.ts', () => ({
  get env() {
    return config.env
  },
  get isProduction() {
    return config.isProduction
  },
}))
vi.mock('@sentry/node', () => ({ init: vi.fn() }))

const Sentry = await import('@sentry/node')
const { initErrorReporting, requestLogger } = await import(
  '../../src/middleware/observability.ts'
)

beforeEach(() => {
  config.env = { NODE_ENV: 'development', SENTRY_DSN: undefined }
  config.isProduction = false
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

describe('initErrorReporting', () => {
  it('skips Sentry and warns when no DSN is configured', () => {
    initErrorReporting()

    expect(Sentry.init).not.toHaveBeenCalled()
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('SENTRY_DSN')
    )
  })

  it('initialises Sentry with the DSN and environment', () => {
    config.env = { NODE_ENV: 'development', SENTRY_DSN: 'https://k@sentry.io/1' }

    initErrorReporting()

    expect(Sentry.init).toHaveBeenCalledWith({
      dsn: 'https://k@sentry.io/1',
      environment: 'development',
      tracesSampleRate: 1.0,
    })
    expect(console.warn).not.toHaveBeenCalled()
  })

  it('samples 10% of traces in production', () => {
    config.env = { NODE_ENV: 'production', SENTRY_DSN: 'https://k@sentry.io/1' }
    config.isProduction = true

    initErrorReporting()

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({ environment: 'production', tracesSampleRate: 0.1 })
    )
  })
})

describe('requestLogger', () => {
  function run() {
    const req = { method: 'POST', originalUrl: '/api/razorpay/orders?x=1' }
    const res = Object.assign(new EventEmitter(), { statusCode: 201 })
    const next = vi.fn()

    requestLogger(
      req as Request,
      res as unknown as Response,
      next as unknown as NextFunction
    )
    return { res, next }
  }

  it('passes control on immediately', () => {
    const { next } = run()
    expect(next).toHaveBeenCalledOnce()
    expect(next).toHaveBeenCalledWith()
  })

  it('logs nothing until the response finishes', () => {
    run()
    expect(console.log).not.toHaveBeenCalled()
  })

  it('logs method, full URL, status and duration on finish', () => {
    const { res } = run()

    res.emit('finish')

    expect(console.log).toHaveBeenCalledOnce()
    expect(console.log).toHaveBeenCalledWith(
      expect.stringMatching(/^POST \/api\/razorpay\/orders\?x=1 201 \d+\.\dms$/)
    )
  })
})
