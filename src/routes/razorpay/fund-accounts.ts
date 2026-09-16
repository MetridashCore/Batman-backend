import { Router } from 'express'
import { z } from 'zod'
import { requiredString } from '../../http/schema.ts'
import { razorpay } from '../../providers/razorpay.ts'

const router = Router()

const createFundAccountSchema = z.object({
  name: requiredString('Name'),
  account_number: requiredString('Account Number'),
  ifsc: requiredString('IFSC'),
})

/** GET /api/razorpay/fund-accounts/:customerId - fund accounts for a customer. */
router.get('/:customerId', async (req, res) => {
  const fundAccounts = await razorpay.fundAccount.fetch(req.params.customerId)
  res.json({ fundAccounts })
})

/** POST /api/razorpay/fund-accounts/:customerId - attach a bank account. */
router.post('/:customerId', async (req, res) => {
  const { name, account_number, ifsc } = createFundAccountSchema.parse(req.body)

  const fundAccount = await razorpay.fundAccount.create({
    customer_id: req.params.customerId,
    account_type: 'bank_account',
    bank_account: { name, account_number, ifsc },
  })
  res.status(201).json({ fundAccount })
})

export default router
