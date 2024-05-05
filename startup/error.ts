import type { Express, NextFunction, Request, Response } from 'express'
import * as Sentry from '@sentry/node'

export default function error(app: Express) {
  app.use(Sentry.Handlers.errorHandler())
}
