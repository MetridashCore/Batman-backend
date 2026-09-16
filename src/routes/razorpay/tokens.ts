import { Router } from 'express'
import { razorpay } from '../../providers/razorpay.ts'

/**
 * Standalone token operations. Customer-scoped token lookups live under
 * `/api/razorpay/customers/:customerId/tokens`.
 */
const router = Router()

/** GET /api/razorpay/tokens/:tokenId - fetch a token. */
router.get('/:tokenId', async (req, res) => {
  const token = await razorpay.tokens.fetch({ id: req.params.tokenId })
  res.json({ token })
})

/** DELETE /api/razorpay/tokens/:tokenId - delete a token. */
router.delete('/:tokenId', async (req, res) => {
  await razorpay.tokens.delete({ id: req.params.tokenId })
  res.status(204).send()
})

export default router
