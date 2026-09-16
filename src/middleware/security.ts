import type { Express } from 'express'
import compression from 'compression'
import cors from 'cors'
import helmet from 'helmet'

/** Baseline hardening and transport middleware, applied to every request. */
export function applySecurity(app: Express): void {
  app.use(helmet())
  app.use(cors())
  app.use(compression())
}
