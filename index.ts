import 'dotenv/config'
import express from 'express'
import 'express-async-errors'
import prod from './startup/prod'
import config from './startup/config'
import routes from './startup/routes'
import logger from './startup/logger'
import asyncErrors from './startup/asyncErrors'

const app = express()

config()
logger(app)
prod(app)
routes(app)
asyncErrors(app)

const port = process.env.PORT || 8000

app.listen(port, () => console.log(`Server started on port ${port}`))
