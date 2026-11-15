import { describe, expect, it } from 'vitest'
import type { z } from 'zod'
import { amount, count, email, requiredString } from '../../src/http/schema.ts'

/** The messages a schema reports for `value`, or `[]` if it parses. */
function errorsFor(schema: z.ZodType, value: unknown): string[] {
  const result = schema.safeParse(value)
  return result.success ? [] : result.error.issues.map((i) => i.message)
}

describe('requiredString', () => {
  const schema = requiredString('Name')

  it('accepts a non-empty string', () => {
    expect(schema.parse('Bruce')).toBe('Bruce')
  })

  it('reports the same message for a missing and a blank value', () => {
    expect(errorsFor(schema, undefined)).toEqual(['Name is required'])
    expect(errorsFor(schema, '')).toEqual(['Name is required'])
  })

  it('rejects non-strings with the labelled message', () => {
    expect(errorsFor(schema, 42)).toEqual(['Name is required'])
    expect(errorsFor(schema, null)).toEqual(['Name is required'])
  })
})

describe('amount', () => {
  it('accepts positive integers and decimals', () => {
    expect(amount().parse(100)).toBe(100)
    expect(amount().parse(0.01)).toBe(0.01)
  })

  it('uses "Amount" as the default label', () => {
    expect(errorsFor(amount(), undefined)).toEqual(['Amount is required'])
  })

  it('uses a custom label when given one', () => {
    expect(errorsFor(amount('Price'), undefined)).toEqual(['Price is required'])
    expect(errorsFor(amount('Price'), 0)).toEqual([
      'Price must be greater than 0',
    ])
  })

  it.each([0, -1, -0.01])('rejects %d as not greater than 0', (value) => {
    expect(errorsFor(amount(), value)).toEqual(['Amount must be greater than 0'])
  })

  it('does not coerce numeric strings', () => {
    // A form field sent as "100" must be a client error, not silently accepted.
    expect(errorsFor(amount(), '100')).toEqual(['Amount is required'])
  })

  it.each([Number.NaN, Number.POSITIVE_INFINITY])('rejects %d', (value) => {
    expect(errorsFor(amount(), value)).not.toEqual([])
  })
})

describe('count', () => {
  const schema = count('Quantity')

  it('accepts positive integers', () => {
    expect(schema.parse(1)).toBe(1)
    expect(schema.parse(12)).toBe(12)
  })

  it.each([0, -3, 1.5, '2', undefined])('rejects %s', (value) => {
    expect(errorsFor(schema, value)).toEqual(['Quantity is required'])
  })
})

describe('email', () => {
  it('accepts a well-formed address', () => {
    expect(email().parse('bruce@wayne.example')).toBe('bruce@wayne.example')
  })

  it.each(['', 'not-an-email', 'bruce@', '@wayne.example', undefined, 7])(
    'rejects %s',
    (value) => {
      expect(errorsFor(email(), value)).toEqual(['A valid email is required'])
    }
  )
})
