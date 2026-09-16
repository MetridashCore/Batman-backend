import { Router } from 'express'
import { z } from 'zod'
import { amount, requiredString } from '../../http/schema.ts'
import { razorpay } from '../../providers/razorpay.ts'
import { toMinorUnits } from '../../http/money.ts'

const router = Router()

const itemSchema = z.object({
  name: requiredString('Name'),
  description: requiredString('Description'),
  amount: amount(),
})

/** GET /api/razorpay/items - list every item. */
router.get('/', async (_req, res) => {
  const items = await razorpay.items.all()
  res.json({ items })
})

/** GET /api/razorpay/items/:itemId - fetch one item. */
router.get('/:itemId', async (req, res) => {
  const item = await razorpay.items.fetch(req.params.itemId)
  res.json({ item })
})

/** POST /api/razorpay/items - create an item. `amount` is in rupees. */
router.post('/', async (req, res) => {
  const { name, description, amount } = itemSchema.parse(req.body)

  const item = await razorpay.items.create({
    name,
    description,
    amount: toMinorUnits(amount),
    currency: 'INR',
  })
  res.status(201).json({ item })
})

/** PUT /api/razorpay/items/:itemId - update an item. */
router.put('/:itemId', async (req, res) => {
  const { name, description, amount } = itemSchema.parse(req.body)

  const item = await razorpay.items.edit(req.params.itemId, {
    name,
    description,
    amount: toMinorUnits(amount),
  })
  res.json({ item })
})

/** DELETE /api/razorpay/items/:itemId - delete an item. */
router.delete('/:itemId', async (req, res) => {
  await razorpay.items.delete(req.params.itemId)
  res.status(204).send()
})

export default router
