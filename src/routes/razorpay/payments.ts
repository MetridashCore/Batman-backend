import { Router } from 'express'
import { z } from 'zod'
import { requiredString } from '../../http/schema.ts'
import { razorpay } from '../../providers/razorpay.ts'

const router = Router()

const captureSchema = z.object({
  /**
   * In the smallest currency unit (paise), and it must equal the authorised
   * amount exactly or Razorpay rejects the capture. Deliberately *not* run
   * through `toMinorUnits` - unlike order/item creation, this value is echoed
   * back from an existing authorisation rather than entered by a user.
   */
  amount: z.number().int().positive(),
  currency: z.string().length(3).default('INR'),
})

const otpSchema = z.object({
  otp: requiredString('OTP'),
})

/** GET /api/razorpay/payments - list every payment. */
router.get('/', async (_req, res) => {
  const payments = await razorpay.payments.all()
  res.json({ payments })
})

/** GET /api/razorpay/payments/:paymentId - fetch one payment. */
router.get('/:paymentId', async (req, res) => {
  const payment = await razorpay.payments.fetch(req.params.paymentId)
  res.json({ payment })
})

/** GET /api/razorpay/payments/:paymentId/card - card used for a payment. */
router.get('/:paymentId/card', async (req, res) => {
  const card = await razorpay.payments.fetchCardDetails(req.params.paymentId)
  res.json({ card })
})

/** POST /api/razorpay/payments/:paymentId/capture - capture an authorised payment. */
router.post('/:paymentId/capture', async (req, res) => {
  const { amount, currency } = captureSchema.parse(req.body)

  const payment = await razorpay.payments.capture(
    req.params.paymentId,
    amount,
    currency
  )
  res.json({ payment })
})

/** POST /api/razorpay/payments/:paymentId/otp/generate - send an OTP. */
router.post('/:paymentId/otp/generate', async (req, res) => {
  const otp = await razorpay.payments.otpGenerate(req.params.paymentId)
  res.json({ otp })
})

/** POST /api/razorpay/payments/:paymentId/otp/submit - verify an OTP. */
router.post('/:paymentId/otp/submit', async (req, res) => {
  const { otp } = otpSchema.parse(req.body)

  const result = await razorpay.payments.otpSubmit(req.params.paymentId, { otp })
  res.json({ otp: result })
})

/** POST /api/razorpay/payments/:paymentId/otp/resend - resend an OTP. */
router.post('/:paymentId/otp/resend', async (req, res) => {
  const otp = await razorpay.payments.otpResend(req.params.paymentId)
  res.json({ otp })
})

export default router
