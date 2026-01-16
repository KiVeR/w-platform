import { beforeEach, vi } from 'vitest'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
vi.stubGlobal('localStorage', localStorageMock)

// Mock $fetch for Nuxt
vi.stubGlobal('$fetch', vi.fn())

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
})
