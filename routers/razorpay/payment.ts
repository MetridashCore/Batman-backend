import { Router } from 'express'
import razorpay from '../../services/razorpay'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const payments = await razorpay.payments.all()
    return res.json({ payments })
  } catch (error) {
    return res.json({ error })
  }
})

router.get('/:paymentId', async (req, res) => {
  try {
    const payment = await razorpay.payments.capture(
      req.params.paymentId,
      req.body.amount,
      'INR'
    )
    return res.json({ payment })
  } catch (error) {
    return res.json({ error })
  }
})

router.get('/:paymentId', async (req, res) => {
  const payment = await razorpay.payments.fetch(req.params.paymentId)
  return res.json({ payment })
})

router.get('/:orderId', async (req, res) => {
  const payment = await razorpay.orders.fetchPayments(req.params.orderId)
  return res.json({ payment })
})

router.get('/:paymentId', async (req, res) => {
  const cardDetails = await razorpay.payments.fetchCardDetails(
    req.params.paymentId
  )
  return res.json({ cardDetails })
})

router.post('/:paymentId', async (req, res) => {
  try {
    const otp = razorpay.payments.otpGenerate(req.params.paymentId)
    return res.json({ otp })
  } catch (ex) {
    return res.json({ error: 'Error' })
  }
})

router.post('/:paymentId', async (req, res) => {
  try {
    const otp = await razorpay.payments.otpSubmit(req.params.paymentId, {
      otp: req.body.otp,
    })
    return res.json({ otp })
  } catch (ex) {
    return res.json({ error: 'Error' })
  }
})

router.post('/:paymentId', async (req, res) => {
  try {
    const otp = await razorpay.payments.otpResend(req.params.paymentId)
    return res.json({ otp })
  } catch (ex) {
    return res.json({ error: 'Error' })
  }
})

export default router
