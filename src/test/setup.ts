import React from 'react'
import { expect, afterEach, beforeAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import { createMockGPUDevice, resetAllMocks } from './test-utils'

// extends Vitest's expect method with methods from react-testing-library
expect.extend(matchers)

// Set up global test timeout to prevent hanging tests
beforeAll(() => {
  // Set a global timeout for all tests
  vi.setConfig({ testTimeout: 10000 })

  // Mock navigator.gpu for WebGPU context with simplified mocks
  Object.defineProperty(navigator, 'gpu', {
    value: {
      requestAdapter: async () => ({
        requestDevice: async () => createMockGPUDevice(),
      }),
    },
    configurable: true,
  })

  // Mock console methods to prevent test output pollution
  const originalConsole = global.console
  global.console = {
    ...originalConsole,
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }
})

// Clean up after each test
afterEach(() => {
  cleanup()
  resetAllMocks()
})

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection at:', promise, 'reason:', reason)
})
