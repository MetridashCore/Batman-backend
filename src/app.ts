import process from 'node:process'
import express, { type Express } from 'express'
import { applySecurity } from './middleware/security.ts'
import { requestLogger } from './middleware/observability.ts'
import { errorHandler } from './middleware/error-handler.ts'
import { notFound } from './middleware/not-found.ts'
import { apiRouter } from './routes/index.ts'

/**
 * Builds the Express app without binding a port, so tests can drive it
 * in-process. Starting the server is `index.ts`'s job.
 *
 * Middleware order is load-bearing: security -> parsers -> routes ->
 * 404 -> error handler.
 */
export function createApp(): Express {
  const app = express()

  applySecurity(app)
  app.use(requestLogger)

  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  /** Liveness probe for Docker and any upstream load balancer. */
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() })
  })

  app.use('/api', apiRouter)

  app.use(notFound)
  app.use(errorHandler)

  return app
}
