import { describe, expect, it } from 'vitest'
import { createApp } from '../../../src/app.ts'
import { razorpay, razorpayRejection } from '../../helpers/fake-providers.ts'
import { useTestServer } from '../../helpers/server.ts'

const api = useTestServer(createApp)

describe('GET /api/razorpay/tokens/:tokenId', () => {
  it('fetches the token by id', async () => {
    const res = await api.get('/api/razorpay/tokens/token_1')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ token: { id: 'token_1' } })
    expect(razorpay.tokens.fetch).toHaveBeenCalledWith({ id: 'token_1' })
  })
})

describe('DELETE /api/razorpay/tokens/:tokenId', () => {
  it('deletes the token and responds 204', async () => {
    const res = await api.delete('/api/razorpay/tokens/token_1')

    expect(res.status).toBe(204)
    expect(res.body).toBeNull()
    expect(razorpay.tokens.delete).toHaveBeenCalledWith({ id: 'token_1' })
  })

  it('forwards an upstream rejection', async () => {
    razorpay.tokens.delete.mockRejectedValueOnce(
      razorpayRejection(400, 'Token not found')
    )

    const res = await api.delete('/api/razorpay/tokens/token_missing')

    expect(res.status).toBe(400)
    expect(res.body.error.message).toBe('Token not found')
  })
})
