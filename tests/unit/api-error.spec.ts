import { describe, expect, it } from 'vitest'
import { ApiError } from '../../src/http/api-error.ts'

describe('ApiError', () => {
  it('carries status, message and details', () => {
    const details = { field: 'amount' }
    const error = new ApiError(422, 'Unprocessable', details)

    expect(error.status).toBe(422)
    expect(error.message).toBe('Unprocessable')
    expect(error.details).toBe(details)
  })

  it('is a real Error, so stack traces and instanceof checks work', () => {
    const error = new ApiError(400, 'Bad')

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.name).toBe('ApiError')
    expect(error.stack).toContain('ApiError')
  })

  it('leaves details undefined when not given', () => {
    expect(new ApiError(400, 'Bad').details).toBeUndefined()
  })

  describe('notFound', () => {
    it('defaults to a 404 with a generic message', () => {
      const error = ApiError.notFound()
      expect(error.status).toBe(404)
      expect(error.message).toBe('Not Found')
    })

    it('accepts a custom message', () => {
      expect(ApiError.notFound('No such order').message).toBe('No such order')
    })
  })
})
