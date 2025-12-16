import process from 'node:process'
import 'dotenv/config'
import express from 'express'
import 'express-async-errors'
import { config } from "./startup/config"
import { logger } from "./startup/logger"
import { prod } from "./startup/prod"
import { routes } from './startup/routes'
import { asyncErrors } from "./startup/asyncErrors"

export const app = express()

config()
logger(app)
prod(app)
routes(app)
asyncErrors(app)

const port = process.env.PORT || 8000

app.listen(port, () => console.log(`Server started on port ${port}`))
