import { STATUS_CODES } from 'node:http'
import type { NextFunction, Request, Response } from 'express'
import * as Sentry from '@sentry/node'
import { z } from 'zod'
import { ApiError } from '../http/api-error.ts'
import { isProduction } from '../config/env.ts'

/**
 * Client-facing messages for the body-parser failures a caller can trigger.
 * The parser's own message is deliberately not used: for malformed JSON it is
 * the raw `JSON.parse` error, which describes our internals, not the request.
 */
const PARSER_MESSAGES: Record<string, string> = {
  'entity.parse.failed': 'Request body could not be parsed',
  'entity.too.large': 'Request body is too large',
}

/**
 * Express' body parsers fail with `http-errors` instances: a `type` such as
 * `entity.parse.failed`, the HTTP `status`, and `expose`, which is true only
 * for 4xx. Provider SDK errors never set `expose`, which keeps the two apart.
 */
function requestParseError(
  error: unknown
): { status: number; message: string } | undefined {
  if (typeof error !== 'object' || error === null) return undefined

  const { type, status, expose } = error as {
    type?: unknown
    status?: unknown
    expose?: unknown
  }
  if (typeof type !== 'string' || typeof status !== 'number' || expose !== true)
    return undefined

  return {
    status,
    message: PARSER_MESSAGES[type] ?? STATUS_CODES[status] ?? 'Bad Request',
  }
}

/**
 * Shape of a normalised provider SDK error. Both the Razorpay and Stripe
 * clients attach the upstream HTTP status as `statusCode`.
 */
function providerStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined

  const { statusCode } = error as { statusCode?: unknown }
  if (typeof statusCode !== 'number') return undefined

  // Only trust upstream *client* errors. A provider 5xx is our problem to
  // report, not something to forward verbatim to the caller.
  return statusCode >= 400 && statusCode < 500 ? statusCode : undefined
}

/**
 * Razorpay rejects with a plain object - not an `Error` - shaped
 * `{ statusCode, error: { code, description } }`. The nested `error` is absent
 * on some responses (a 404 carries nothing at all), hence the status fallback.
 */
function providerMessage(error: unknown, status: number): string {
  const description = (
    error as { error?: { description?: unknown } } | null
  )?.error?.description

  if (typeof description === 'string' && description) return description
  if (error instanceof Error && error.message) return error.message

  return STATUS_CODES[status] ?? 'Request failed'
}

/**
 * The last middleware in the stack: every thrown or rejected error ends up here.
 *
 * Express 5 forwards rejected promises from async handlers automatically, which
 * is why route handlers no longer need their own try/catch.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  // If the response already started streaming, Express must close the socket.
  if (res.headersSent) {
    next(err)
    return
  }

  if (err instanceof z.ZodError) {
    res.status(400).json({
      error: {
        message: 'Validation failed',
        issues: err.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      },
    })
    return
  }

  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: { message: err.message, details: err.details },
    })
    return
  }

  // Checked before provider errors: parser errors also carry `statusCode`.
  const parseError = requestParseError(err)
  if (parseError) {
    res.status(parseError.status).json({
      error: { message: parseError.message },
    })
    return
  }

  const upstream = providerStatus(err)
  if (upstream !== undefined) {
    res.status(upstream).json({
      error: { message: providerMessage(err, upstream) },
    })
    return
  }

  Sentry.captureException(err)
  console.error('Unhandled error:', err)

  res.status(500).json({
    error: {
      message: 'Internal Server Error',
      // Leaking stack traces in production is a disclosure risk; in
      // development the detail is the whole point.
      ...(isProduction ? {} : { detail: String(err) }),
    },
  })
}
