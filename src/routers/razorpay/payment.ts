import express from 'express'
import { razorpay } from '../../services/razorpay'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const payments = await razorpay.payments.all()
    res.json({ payments })
  } catch (error) {
    res.json({ error })
  }
})

router.get('/:paymentId', async (req, res) => {
  try {
    const payment = await razorpay.payments.capture(
      req.params.paymentId,
      req.body.amount,
      'INR'
    )
    res.json({ payment })
  } catch (error) {
    res.json({ error })
  }
})

router.get('/:paymentId', async (req, res) => {
  const payment = await razorpay.payments.fetch(req.params.paymentId)
  res.json({ payment })
})

router.get('/:orderId', async (req, res) => {
  const payment = await razorpay.orders.fetchPayments(req.params.orderId)
  res.json({ payment })
})

router.get('/:paymentId', async (req, res) => {
  const cardDetails = await razorpay.payments.fetchCardDetails(
    req.params.paymentId
  )
  res.json({ cardDetails })
})

router.post('/:paymentId', async (req, res) => {
  try {
    const otp = razorpay.payments.otpGenerate(req.params.paymentId)
    res.json({ otp })
  } catch (ex) {
    res.json({ error: 'Error' })
  }
})

router.post('/:paymentId', async (req, res) => {
  try {
    const otp = await razorpay.payments.otpSubmit(req.params.paymentId, {
      otp: req.body.otp,
    })
    res.json({ otp })
  } catch (ex) {
    res.json({ error: 'Error' })
  }
})

router.post('/:paymentId', async (req, res) => {
  try {
    const otp = await razorpay.payments.otpResend(req.params.paymentId)
    res.json({ otp })
  } catch (ex) {
    res.json({ error: 'Error' })
  }
})

export default router
