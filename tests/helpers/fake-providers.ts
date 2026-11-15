import { vi } from 'vitest'

/**
 * In-memory stand-ins for the Razorpay and Stripe clients.
 *
 * tests/integration/setup.ts swaps the real provider modules for this one, so
 * integration specs import `razorpay` / `stripe` from here to stub responses
 * and assert on the payload each route sends upstream. Every method has a default that echoes its
 * input, and `mockReset` (see vitest.config.ts) restores those defaults before
 * each test, so a stub set in one test never leaks into the next.
 */

/** Razorpay's list envelope, with `count` kept in step with `items`. */
export function collection<T>(items: T[] = []) {
  return { entity: 'collection', count: items.length, items }
}

/** Echoes the create payload back with an id, like the real API does. */
function creates(id: string) {
  return vi.fn(async (params: object) => ({ id, ...params }))
}

const fetchesById = () => vi.fn(async (id: string) => ({ id }))
const lists = () => vi.fn(async () => collection())

export const razorpay = {
  accounts: {
    fetch: fetchesById(),
    create: creates('acc_test'),
  },
  customers: {
    all: lists(),
    create: creates('cust_test'),
    fetch: fetchesById(),
    fetchTokens: lists(),
    fetchToken: vi.fn(async (customerId: string, id: string) => ({
      id,
      customer_id: customerId,
    })),
  },
  fundAccount: {
    fetch: lists(),
    create: creates('fa_test'),
  },
  invoices: {
    all: lists(),
    fetch: fetchesById(),
    create: creates('inv_test'),
  },
  items: {
    all: lists(),
    fetch: fetchesById(),
    create: creates('item_test'),
    edit: vi.fn(async (id: string, params: object) => ({ id, ...params })),
    delete: vi.fn(async (_id: string) => []),
  },
  orders: {
    all: lists(),
    create: creates('order_test'),
    fetch: fetchesById(),
    fetchPayments: lists(),
  },
  payments: {
    all: lists(),
    fetch: fetchesById(),
    fetchCardDetails: vi.fn(async (_id: string) => ({ id: 'card_test' })),
    capture: vi.fn(async (id: string, amount: number, currency: string) => ({
      id,
      amount,
      currency,
      status: 'captured',
    })),
    otpGenerate: vi.fn(async (id: string) => ({ razorpay_payment_id: id })),
    otpSubmit: vi.fn(async (id: string, _params: { otp: string }) => ({
      razorpay_payment_id: id,
    })),
    otpResend: vi.fn(async (id: string) => ({ razorpay_payment_id: id })),
  },
  tokens: {
    fetch: vi.fn(async ({ id }: { id: string }) => ({ id })),
    delete: vi.fn(async (_params: { id: string }) => null),
  },
}

export const stripe = {
  checkout: {
    sessions: {
      create: vi.fn(async (_params: object) => ({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/c/pay/cs_test_123',
      })),
    },
  },
}

/**
 * What the Razorpay SDK actually rejects with: a plain object, not an `Error`
 * (see `normalizeError` in the SDK's api.js). `error` is omitted when the
 * upstream response carried no body.
 */
export function razorpayRejection(statusCode: number, description?: string) {
  return {
    statusCode,
    error: description
      ? { code: 'BAD_REQUEST_ERROR', description }
      : undefined,
  }
}
