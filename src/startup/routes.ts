import type { Express } from 'express'
import express from 'express'
import customerRouter from '../routers/razorpay/customers.ts'
import OrderRouter from '../routers/razorpay/order.ts'
import accountRouter from '../routers/razorpay/account.ts'
import invoiceRouter from '../routers/razorpay/invoice.ts'
import itemsRouter from '../routers/razorpay/items.ts'
import tokenRouter from '../routers/razorpay/token.ts'
import fundRouter from '../routers/razorpay/fund.ts'
import paymentRouter from '../routers/razorpay/payment.ts'
import stripePayment from '../routers/stripe/payment.ts'

export function routes(app: Express) {
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use('/api/razorpay/customers', customerRouter)
  app.use('/api/razorpay/orders', OrderRouter)
  app.use('/api/razorpay/account', accountRouter)
  app.use('/api/razorpay/invoice', invoiceRouter)
  app.use('/api/razorpay/items', itemsRouter)
  app.use('/api/razorpay/token', tokenRouter)
  app.use('/api/razorpay/fund', fundRouter)
  app.use('/api/razorpay/payment', paymentRouter)
  app.use('/stripe-payment', stripePayment)
}
