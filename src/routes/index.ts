import { Router } from 'express'
import accountsRouter from './razorpay/accounts.ts'
import customersRouter from './razorpay/customers.ts'
import fundAccountsRouter from './razorpay/fund-accounts.ts'
import invoicesRouter from './razorpay/invoices.ts'
import itemsRouter from './razorpay/items.ts'
import ordersRouter from './razorpay/orders.ts'
import paymentsRouter from './razorpay/payments.ts'
import tokensRouter from './razorpay/tokens.ts'
import stripeCheckoutRouter from './stripe/checkout.ts'

/**
 * The complete API surface, in one place.
 *
 * Resource segments are plural and every provider sits under `/api/<provider>`,
 * so a path can be predicted from the resource name rather than looked up.
 */
export const apiRouter = Router()

apiRouter.use('/razorpay/accounts', accountsRouter)
apiRouter.use('/razorpay/customers', customersRouter)
apiRouter.use('/razorpay/fund-accounts', fundAccountsRouter)
apiRouter.use('/razorpay/invoices', invoicesRouter)
apiRouter.use('/razorpay/items', itemsRouter)
apiRouter.use('/razorpay/orders', ordersRouter)
apiRouter.use('/razorpay/payments', paymentsRouter)
apiRouter.use('/razorpay/tokens', tokensRouter)

apiRouter.use('/stripe/checkout', stripeCheckoutRouter)
