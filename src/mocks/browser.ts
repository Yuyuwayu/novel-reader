/**
 * MSW browser worker setup.
 * Import and call `startMockWorker()` in main.ts during development.
 */

import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

export async function startMockWorker(): Promise<void> {
  await worker.start({
    onUnhandledRequest: 'bypass', // don't warn for non-API requests (assets, etc.)
  })
}
