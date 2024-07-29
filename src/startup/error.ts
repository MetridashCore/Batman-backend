import type { Express, NextFunction, Request, Response } from 'express'
import * as Sentry from '@sentry/node'

export function error(app: Express) {
  app.use(Sentry.Handlers.errorHandler())
}
