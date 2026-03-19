import { defineStore } from 'pinia'
import { beforeEach, vi } from 'vitest'
import { computed, nextTick, ref, shallowRef, toRaw, watch, watchEffect } from 'vue'

// Stub Nuxt auto-imported Vue APIs
vi.stubGlobal('ref', ref)
vi.stubGlobal('shallowRef', shallowRef)
vi.stubGlobal('computed', computed)
vi.stubGlobal('watch', watch)
vi.stubGlobal('watchEffect', watchEffect)
vi.stubGlobal('nextTick', nextTick)
vi.stubGlobal('toRaw', toRaw)

// Stub Pinia defineStore (auto-imported by Nuxt)
vi.stubGlobal('defineStore', defineStore)

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
