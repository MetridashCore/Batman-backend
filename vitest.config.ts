import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Loads dummy credentials so importing the provider clients does not trip
    // the env validation in `src/config/env.ts`.
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.spec.ts'],
  },
})
