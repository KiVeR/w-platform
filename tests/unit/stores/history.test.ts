import { createPinia, defineStore, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref, toRaw } from 'vue'

// Re-stub Nuxt auto-imports (unstubGlobals restores after each test)
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('defineStore', defineStore)

const { useHistoryStore } = await import('#editor/stores/history')

function makeDesign(overrides: Record<string, unknown> = {}) {
  return {
    version: '1.0',
    globalStyles: {
      palette: 'turquoise',
      backgroundColor: '#ffffff',
      textColor: '#1e293b',
      primaryColor: '#14b8a6',
      secondaryColor: '#0d9488',
      fontFamily: 'Inter, system-ui, sans-serif',
      headingFontFamily: 'Inter, system-ui, sans-serif',
      baseFontSize: '16px',
      lineHeight: '1.6',
      contentPadding: '16px',
      widgetGap: '12px',
      borderRadius: '8px',
      pageTitle: '',
      metaDescription: '',
    },
    widgets: [],
    ...overrides,
  }
}

describe('useHistoryStore', () => {
  beforeEach(() => {
    vi.stubGlobal('ref', ref)
    vi.stubGlobal('computed', computed)
    vi.stubGlobal('defineStore', defineStore)
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('has empty past array', () => {
      const store = useHistoryStore()
      expect(store.past).toEqual([])
    })

    it('has empty future array', () => {
      const store = useHistoryStore()
      expect(store.future).toEqual([])
    })

    it('canUndo is false', () => {
      const store = useHistoryStore()
      expect(store.canUndo).toBe(false)
    })

    it('canRedo is false', () => {
      const store = useHistoryStore()
      expect(store.canRedo).toBe(false)
    })

    it('historyLength is 0', () => {
      const store = useHistoryStore()
      expect(store.historyLength).toBe(0)
    })
  })

  describe('pushState', () => {
    it('adds a snapshot to past', () => {
      const store = useHistoryStore()
      const design = makeDesign()
      store.pushState(design as any)
      expect(store.past).toHaveLength(1)
      expect(store.historyLength).toBe(1)
    })

    it('clones the design (no shared reference)', () => {
      const store = useHistoryStore()
      const design = makeDesign({ widgets: [{ id: '1' }] })
      store.pushState(design as any)
      // Mutate the original — should not affect the snapshot
      design.widgets.push({ id: '2' } as any)
      expect(store.past[0].widgets).toHaveLength(1)
    })

    it('clears the future array', () => {
      const store = useHistoryStore()
      const d1 = makeDesign({ version: '1.0' })
      const d2 = makeDesign({ version: '2.0' })
      store.pushState(d1 as any)
      store.pushToFuture(d2 as any)
      expect(store.future).toHaveLength(1)
      store.pushState(makeDesign({ version: '3.0' }) as any)
      expect(store.future).toHaveLength(0)
    })

    it('sets canUndo to true after push', () => {
      const store = useHistoryStore()
      store.pushState(makeDesign() as any)
      expect(store.canUndo).toBe(true)
    })

    it('enforces MAX_HISTORY of 50 by shifting oldest', () => {
      const store = useHistoryStore()
      for (let i = 0; i < 55; i++) {
        store.pushState(makeDesign({ version: `v${i}` }) as any)
      }
      expect(store.past).toHaveLength(50)
      // Oldest entries (v0–v4) should have been shifted out; first entry should be v5
      expect(store.past[0].version).toBe('v5')
      expect(store.past[49].version).toBe('v54')
    })

    it('accumulates multiple pushes up to limit', () => {
      const store = useHistoryStore()
      store.pushState(makeDesign({ version: 'a' }) as any)
      store.pushState(makeDesign({ version: 'b' }) as any)
      store.pushState(makeDesign({ version: 'c' }) as any)
      expect(store.past).toHaveLength(3)
      expect(store.historyLength).toBe(3)
    })
  })

  describe('undo', () => {
    it('returns the last snapshot from past', () => {
      const store = useHistoryStore()
      store.pushState(makeDesign({ version: 'v1' }) as any)
      store.pushState(makeDesign({ version: 'v2' }) as any)
      const result = store.undo()
      expect(result).not.toBeNull()
      expect(result!.version).toBe('v2')
    })

    it('removes the returned snapshot from past', () => {
      const store = useHistoryStore()
      store.pushState(makeDesign({ version: 'v1' }) as any)
      store.pushState(makeDesign({ version: 'v2' }) as any)
      store.undo()
      expect(store.past).toHaveLength(1)
      expect(store.past[0].version).toBe('v1')
    })

    it('returns null when past is empty', () => {
      const store = useHistoryStore()
      const result = store.undo()
      expect(result).toBeNull()
    })

    it('sets canUndo to false after undoing the only entry', () => {
      const store = useHistoryStore()
      store.pushState(makeDesign() as any)
      store.undo()
      expect(store.canUndo).toBe(false)
    })
  })

  describe('redo', () => {
    it('returns the last snapshot from future', () => {
      const store = useHistoryStore()
      store.pushToFuture(makeDesign({ version: 'f1' }) as any)
      const result = store.redo()
      expect(result).not.toBeNull()
      expect(result!.version).toBe('f1')
    })

    it('removes the returned snapshot from future', () => {
      const store = useHistoryStore()
      store.pushToFuture(makeDesign({ version: 'f1' }) as any)
      store.pushToFuture(makeDesign({ version: 'f2' }) as any)
      store.redo()
      expect(store.future).toHaveLength(1)
    })

    it('returns null when future is empty', () => {
      const store = useHistoryStore()
      const result = store.redo()
      expect(result).toBeNull()
    })

    it('sets canRedo to false after redoing the only entry', () => {
      const store = useHistoryStore()
      store.pushToFuture(makeDesign() as any)
      store.redo()
      expect(store.canRedo).toBe(false)
    })
  })

  describe('pushToFuture', () => {
    it('adds a snapshot to future', () => {
      const store = useHistoryStore()
      store.pushToFuture(makeDesign() as any)
      expect(store.future).toHaveLength(1)
      expect(store.canRedo).toBe(true)
    })

    it('clones the design (no shared reference)', () => {
      const store = useHistoryStore()
      const design = makeDesign({ widgets: [{ id: 'w1' }] })
      store.pushToFuture(design as any)
      design.widgets.push({ id: 'w2' } as any)
      expect(store.future[0].widgets).toHaveLength(1)
    })
  })

  describe('clear', () => {
    it('empties both past and future', () => {
      const store = useHistoryStore()
      store.pushState(makeDesign() as any)
      store.pushToFuture(makeDesign() as any)
      store.clear()
      expect(store.past).toEqual([])
      expect(store.future).toEqual([])
    })

    it('resets canUndo and canRedo to false', () => {
      const store = useHistoryStore()
      store.pushState(makeDesign() as any)
      store.pushToFuture(makeDesign() as any)
      store.clear()
      expect(store.canUndo).toBe(false)
      expect(store.canRedo).toBe(false)
    })

    it('resets historyLength to 0', () => {
      const store = useHistoryStore()
      store.pushState(makeDesign() as any)
      store.pushState(makeDesign() as any)
      store.clear()
      expect(store.historyLength).toBe(0)
    })
  })

  describe('full undo/redo scenario', () => {
    it('push -> push -> undo -> pushToFuture -> redo -> push clears future', () => {
      const store = useHistoryStore()

      // Push two states
      store.pushState(makeDesign({ version: 'v1' }) as any)
      store.pushState(makeDesign({ version: 'v2' }) as any)
      expect(store.historyLength).toBe(2)
      expect(store.canRedo).toBe(false)

      // Undo returns v2
      const undone = store.undo()
      expect(undone!.version).toBe('v2')
      expect(store.historyLength).toBe(1)

      // Push undone state to future (toRaw to strip Vue reactivity for structuredClone)
      store.pushToFuture(toRaw(undone) as any)
      expect(store.canRedo).toBe(true)

      // Redo returns it back
      const redone = store.redo()
      expect(redone!.version).toBe('v2')
      expect(store.canRedo).toBe(false)

      // New push clears any remaining future
      store.pushToFuture(makeDesign({ version: 'stale' }) as any)
      store.pushState(makeDesign({ version: 'v3' }) as any)
      expect(store.canRedo).toBe(false)
      expect(store.future).toHaveLength(0)
    })
  })
})
