import { router, razorpay } from '../../startup'

router.get('/:paymentId', async (req, res) => {
  try {
    const token = await razorpay.payments.fetch(req.params.paymentId)
    return res.json({ token })
  } catch (error) {
    return res.json({ error })
  }
})

router.get('/:customerId', async (req, res) => {
  try {
    const token = await razorpay.customers.fetchTokens(req.params.customerId)
    return res.json({ token })
  } catch (error) {
    return res.json({ error })
  }
})

router.get('/:customerId/:tokenId', async (req, res) => {
  try {
    const token = await razorpay.customers.fetchToken(
      req.params.customerId,
      req.params.tokenId
    )
    return res.json({ token })
  } catch (error) {
    return res.json({ error })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const token = await razorpay.tokens.fetch({ id: req.params.id })
    return res.json({ token })
  } catch (error) {
    return res.json({ error })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await razorpay.tokens.delete({ id: req.params.id })
    return res.json({ message: true })
  } catch (error) {
    return res.json({ error })
  }
})

export default router
