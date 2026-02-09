import { createPinia, defineStore, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'

// Re-stub Nuxt auto-imports (unstubGlobals restores after each test)
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('defineStore', defineStore)

const { useContentStore } = await import('#editor/stores/content')

describe('useContentStore', () => {
  beforeEach(() => {
    vi.stubGlobal('ref', ref)
    vi.stubGlobal('computed', computed)
    vi.stubGlobal('defineStore', defineStore)
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('has id null', () => {
      const store = useContentStore()
      expect(store.id).toBeNull()
    })

    it('has type null', () => {
      const store = useContentStore()
      expect(store.type).toBeNull()
    })

    it('has empty title', () => {
      const store = useContentStore()
      expect(store.title).toBe('')
    })

    it('has status DRAFT', () => {
      const store = useContentStore()
      expect(store.status).toBe('DRAFT')
    })

    it('isNew is true when id is null', () => {
      const store = useContentStore()
      expect(store.isNew).toBe(true)
    })

    it('isLoading is false', () => {
      const store = useContentStore()
      expect(store.isLoading).toBe(false)
    })

    it('error is null', () => {
      const store = useContentStore()
      expect(store.error).toBeNull()
    })
  })

  describe('setContent', () => {
    it('sets all fields from a Content object', () => {
      const store = useContentStore()
      const content = {
        id: 42,
        type: 'landing-page' as const,
        title: 'My Page',
        status: 'PUBLISHED' as const,
        isFavorite: false,
        createdAt: new Date('2026-01-15T10:00:00Z'),
        updatedAt: new Date('2026-01-20T14:30:00Z'),
      }
      store.setContent(content)
      expect(store.id).toBe(42)
      expect(store.type).toBe('landing-page')
      expect(store.title).toBe('My Page')
      expect(store.status).toBe('PUBLISHED')
      expect(store.createdAt).toBeInstanceOf(Date)
      expect(store.updatedAt).toBeInstanceOf(Date)
    })

    it('parses string dates into Date objects', () => {
      const store = useContentStore()
      const content = {
        id: 1,
        type: 'rcs' as const,
        title: 'Test',
        status: 'DRAFT' as const,
        isFavorite: false,
        createdAt: '2026-02-01T00:00:00Z' as any,
        updatedAt: '2026-02-05T00:00:00Z' as any,
      }
      store.setContent(content)
      expect(store.createdAt).toBeInstanceOf(Date)
      expect(store.updatedAt).toBeInstanceOf(Date)
    })

    it('clears error on setContent', () => {
      const store = useContentStore()
      store.setError('previous error')
      store.setContent({
        id: 1,
        type: 'landing-page' as const,
        title: 'Test',
        status: 'DRAFT' as const,
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      expect(store.error).toBeNull()
    })

    it('isNew becomes false after setContent', () => {
      const store = useContentStore()
      store.setContent({
        id: 10,
        type: 'sms' as const,
        title: 'SMS',
        status: 'DRAFT' as const,
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      expect(store.isNew).toBe(false)
    })
  })

  describe('setMetadata', () => {
    it('updates only provided fields', () => {
      const store = useContentStore()
      store.setMetadata({ title: 'Updated Title' })
      expect(store.title).toBe('Updated Title')
      expect(store.id).toBeNull() // untouched
      expect(store.type).toBeNull() // untouched
    })

    it('can update multiple fields at once', () => {
      const store = useContentStore()
      store.setMetadata({ id: 5, type: 'rcs', status: 'ARCHIVED' })
      expect(store.id).toBe(5)
      expect(store.type).toBe('rcs')
      expect(store.status).toBe('ARCHIVED')
    })
  })

  describe('updateTitle', () => {
    it('updates the title', () => {
      const store = useContentStore()
      store.updateTitle('New Title')
      expect(store.title).toBe('New Title')
    })
  })

  describe('updateStatus', () => {
    it('updates the status', () => {
      const store = useContentStore()
      store.updateStatus('PUBLISHED')
      expect(store.status).toBe('PUBLISHED')
    })
  })

  describe('type getters', () => {
    it('isLandingPage is true for landing-page type', () => {
      const store = useContentStore()
      store.setMetadata({ type: 'landing-page' })
      expect(store.isLandingPage).toBe(true)
      expect(store.isRCS).toBe(false)
      expect(store.isSMS).toBe(false)
    })

    it('isRCS is true for rcs type', () => {
      const store = useContentStore()
      store.setMetadata({ type: 'rcs' })
      expect(store.isRCS).toBe(true)
      expect(store.isLandingPage).toBe(false)
      expect(store.isSMS).toBe(false)
    })

    it('isSMS is true for sms type', () => {
      const store = useContentStore()
      store.setMetadata({ type: 'sms' })
      expect(store.isSMS).toBe(true)
      expect(store.isLandingPage).toBe(false)
      expect(store.isRCS).toBe(false)
    })
  })

  describe('hasEditor / isPlaceholder', () => {
    it('hasEditor is true for landing-page', () => {
      const store = useContentStore()
      store.setMetadata({ type: 'landing-page' })
      expect(store.hasEditor).toBe(true)
      expect(store.isPlaceholder).toBe(false)
    })

    it('hasEditor is false for rcs', () => {
      const store = useContentStore()
      store.setMetadata({ type: 'rcs' })
      expect(store.hasEditor).toBe(false)
      expect(store.isPlaceholder).toBe(true)
    })

    it('hasEditor is false for sms', () => {
      const store = useContentStore()
      store.setMetadata({ type: 'sms' })
      expect(store.hasEditor).toBe(false)
      expect(store.isPlaceholder).toBe(true)
    })

    it('both are false when type is null', () => {
      const store = useContentStore()
      expect(store.hasEditor).toBe(false)
      expect(store.isPlaceholder).toBe(false)
    })
  })

  describe('setLoading / setError', () => {
    it('setLoading sets isLoading', () => {
      const store = useContentStore()
      store.setLoading(true)
      expect(store.isLoading).toBe(true)
      store.setLoading(false)
      expect(store.isLoading).toBe(false)
    })

    it('setError sets error message', () => {
      const store = useContentStore()
      store.setError('Network error')
      expect(store.error).toBe('Network error')
    })

    it('setError clears error with null', () => {
      const store = useContentStore()
      store.setError('error')
      store.setError(null)
      expect(store.error).toBeNull()
    })
  })

  describe('reset', () => {
    it('restores all fields to defaults', () => {
      const store = useContentStore()
      store.setContent({
        id: 99,
        type: 'landing-page' as const,
        title: 'To Be Reset',
        status: 'PUBLISHED' as const,
        isFavorite: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      store.setLoading(true)
      store.setError('some error')

      store.reset()

      expect(store.id).toBeNull()
      expect(store.type).toBeNull()
      expect(store.title).toBe('')
      expect(store.status).toBe('DRAFT')
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
      expect(store.createdAt).toBeNull()
      expect(store.updatedAt).toBeNull()
      expect(store.isNew).toBe(true)
    })
  })
})
