import process from 'node:process'
import { env } from './config/env.ts'
import { initErrorReporting } from './middleware/observability.ts'
import { createApp } from './app.ts'

// Before the app is built, so instrumentation is in place as modules load.
initErrorReporting()

const app = createApp()

const server = app.listen(env.PORT, () => {
  console.log(`Server listening on port ${env.PORT} [${env.NODE_ENV}]`)
})

/**
 * Containers stop with SIGTERM. Without this the process is killed mid-request
 * and in-flight payments get no response.
 */
function shutdown(signal: string): void {
  console.log(`${signal} received, shutting down.`)
  server.close(() => process.exit(0))
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
