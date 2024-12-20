import type { Express } from 'express'
import helmet from 'helmet'
import compression from 'compression'
import cors from 'cors'

export function prod(app: Express) {
  app.use(cors())
  app.use(helmet())
  app.use(compression())
}
