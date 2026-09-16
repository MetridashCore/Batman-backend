import process from 'node:process'
import type { NextFunction, Request, Response } from 'express'
import * as Sentry from '@sentry/node'
import { env, isProduction } from '../config/env.ts'

/**
 * Starts error reporting. Called before the app is built so that Sentry can
 * instrument modules as they load.
 */
export function initErrorReporting(): void {
  if (!env.SENTRY_DSN) {
    console.warn('SENTRY_DSN is not set - error reporting is disabled.')
    return
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: isProduction ? 0.1 : 1.0,
  })
}

/** Minimal structured access log: method, path, status, duration. */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startedAt = process.hrtime.bigint()

  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - startedAt) / 1_000_000
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(1)}ms`
    )
  })

  next()
}
