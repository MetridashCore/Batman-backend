import { router, razorpay } from '../../startup'

router.get('/:paymentId', async (req, res) => {
  try {
    const token = await razorpay.payments.fetch(req.params.paymentId)
    res.json({ token })
  } catch (error) {
    res.json({ error })
  }
})

router.get('/:customerId', async (req, res) => {
  try {
    const token = await razorpay.customers.fetchTokens(req.params.customerId)
    res.json({ token })
  } catch (error) {
    res.json({ error })
  }
})

router.get('/:customerId/:tokenId', async (req, res) => {
  try {
    const token = await razorpay.customers.fetchToken(
      req.params.customerId,
      req.params.tokenId
    )
    res.json({ token })
  } catch (error) {
    res.json({ error })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const token = await razorpay.tokens.fetch({ id: req.params.id })
    res.json({ token })
  } catch (error) {
    res.json({ error })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await razorpay.tokens.delete({ id: req.params.id })
    res.json({ message: true })
  } catch (error) {
    res.json({ error })
  }
})

export default router
