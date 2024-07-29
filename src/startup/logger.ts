import type { Express } from 'express'
import * as Sentry from '@sentry/node'

export function logger(app: Express) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      new Sentry.Integrations.Http({
        tracing: true,
      }),
      new Sentry.Integrations.Express({
        app,
      }),
    ],
    tracesSampleRate: 1.0,
  })
}
