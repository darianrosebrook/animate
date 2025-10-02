import React from 'react'
import { expect, afterEach, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// extends Vitest's expect method with methods from react-testing-library
expect.extend(matchers)

// Mock WebGPU for testing
beforeAll(() => {
  // Mock navigator.gpu for WebGPU context
  Object.defineProperty(navigator, 'gpu', {
    value: {
      requestAdapter: async () => ({
        requestDevice: async () => ({
          createBuffer: () => ({ destroy: () => {} }),
          createTexture: () => ({ createView: () => ({}), destroy: () => {} }),
          createRenderPipeline: () => ({}),
          createCommandEncoder: () => ({
            beginRenderPass: () => ({
              setPipeline: () => {},
              setVertexBuffer: () => {},
              draw: () => {},
              end: () => {},
            }),
            finish: () => ({}),
          }),
          createShaderModule: () => ({}),
          queue: { submit: () => {}, writeBuffer: () => {} },
          destroy: () => {},
        }),
      }),
    },
    configurable: true,
  })
})

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup()
})
