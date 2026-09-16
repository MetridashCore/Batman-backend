import process from 'node:process'
import 'dotenv/config'
import express from 'express'
import { config } from "./startup/config.ts"
import { logger } from "./startup/logger.ts"
import { prod } from "./startup/prod.ts"
import { routes } from './startup/routes.ts'
import { asyncErrors } from "./startup/asyncErrors.ts"

export const app = express()

config()
logger(app)
prod(app)
routes(app)
asyncErrors(app)

const port = process.env.PORT || 8000

app.listen(port, () => console.log(`Server started on port ${port}`))
