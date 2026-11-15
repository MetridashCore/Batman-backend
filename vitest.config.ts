import { defineConfig } from 'vitest/config'

/**
 * Loads dummy credentials so importing the provider clients does not trip the
 * env validation in `src/config/env.ts`. Every project needs it first.
 */
const envSetup = './tests/setup.ts'

export default defineConfig({
  test: {
    // Before every test: drop recorded calls and queued `*Once` stubs, and put
    // each `vi.fn(impl)` back to `impl`. Keeps the shared fakes in
    // tests/helpers/fake-providers.ts independent between tests.
    mockReset: true,
    // Undo every `vi.stubEnv` after each test.
    unstubEnvs: true,

    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.spec.ts'],
          setupFiles: [envSetup],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.spec.ts'],
          // Replaces both provider clients with in-memory fakes.
          setupFiles: [envSetup, './tests/integration/setup.ts'],
        },
      },
      {
        extends: true,
        test: {
          // Real Razorpay API; skipped unless RUN_LIVE_TESTS=1.
          name: 'live',
          include: ['tests/live/**/*.spec.ts'],
          setupFiles: [envSetup],
        },
      },
    ],
  },
})
