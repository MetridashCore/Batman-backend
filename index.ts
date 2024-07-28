import 'dotenv/config'
import express from 'express'
import 'express-async-errors'
import { config, logger, prod, routes, asyncErrors } from './startup'

export const app = express()

config()
logger(app)
prod(app)
routes(app)
asyncErrors(app)

const port = process.env.PORT || 8000

app.listen(port, () => console.log(`Server started on port ${port}`))
