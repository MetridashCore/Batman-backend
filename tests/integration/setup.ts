import { vi } from 'vitest'

/**
 * Integration specs exercise routing, parsing and error mapping, not the
 * providers: both clients are swapped for the in-memory fakes so nothing
 * reaches the network. Registered here, for the `integration` project only
 * (see vitest.config.ts), so specs do not repeat it and cannot forget it.
 *
 * Specs import `razorpay` / `stripe` from tests/helpers/fake-providers.ts to
 * stub responses; that is the same instance the app receives.
 */
vi.mock('../../src/providers/razorpay.ts', () => import('../helpers/fake-providers.ts'))
vi.mock('../../src/providers/stripe.ts', () => import('../helpers/fake-providers.ts'))
