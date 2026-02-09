import { beforeEach, describe, expect, it } from 'vitest'

const { useToast } = await import('#editor/composables/useToast')

describe('useToast', () => {
  beforeEach(() => {
    const { clearAll } = useToast()
    clearAll()
  })

  describe('toast creation', () => {
    it('creates a success toast with correct type', () => {
      const { success, toasts } = useToast()
      success('Operation completed')
      expect(toasts.value).toHaveLength(1)
      expect(toasts.value[0].type).toBe('success')
      expect(toasts.value[0].message).toBe('Operation completed')
    })

    it('creates an error toast with correct type', () => {
      const { error, toasts } = useToast()
      error('Something went wrong')
      expect(toasts.value).toHaveLength(1)
      expect(toasts.value[0].type).toBe('error')
      expect(toasts.value[0].message).toBe('Something went wrong')
    })

    it('creates a warning toast with correct type', () => {
      const { warning, toasts } = useToast()
      warning('Be careful')
      expect(toasts.value).toHaveLength(1)
      expect(toasts.value[0].type).toBe('warning')
      expect(toasts.value[0].message).toBe('Be careful')
    })

    it('creates an info toast with correct type', () => {
      const { info, toasts } = useToast()
      info('FYI')
      expect(toasts.value).toHaveLength(1)
      expect(toasts.value[0].type).toBe('info')
      expect(toasts.value[0].message).toBe('FYI')
    })
  })

  describe('duration', () => {
    it('uses 4000ms default duration without actions', () => {
      const { success, toasts } = useToast()
      success('Done')
      expect(toasts.value[0].duration).toBe(4000)
    })

    it('uses 8000ms default duration when actions are provided', () => {
      const { info, toasts } = useToast()
      info('Undo?', {
        actions: [{ label: 'Undo', onClick: () => {} }],
      })
      expect(toasts.value[0].duration).toBe(8000)
    })

    it('uses custom duration when provided via options', () => {
      const { warning, toasts } = useToast()
      warning('Slow warning', { duration: 10000 })
      expect(toasts.value[0].duration).toBe(10000)
    })
  })

  describe('options', () => {
    it('sets title from options', () => {
      const { success, toasts } = useToast()
      success('Saved successfully', { title: 'Save' })
      expect(toasts.value[0].title).toBe('Save')
      expect(toasts.value[0].message).toBe('Saved successfully')
    })
  })

  describe('remove', () => {
    it('removes a specific toast by id', () => {
      const { success, error, remove, toasts } = useToast()
      const id1 = success('First')
      success('Second')
      error('Third')

      expect(toasts.value).toHaveLength(3)

      remove(id1)

      expect(toasts.value).toHaveLength(2)
      expect(toasts.value.find(t => t.id === id1)).toBeUndefined()
      expect(toasts.value[0].message).toBe('Second')
      expect(toasts.value[1].message).toBe('Third')
    })
  })

  describe('clearAll', () => {
    it('empties all toasts', () => {
      const { success, error, clearAll, toasts } = useToast()
      success('A')
      error('B')
      success('C')
      expect(toasts.value).toHaveLength(3)

      clearAll()
      expect(toasts.value).toHaveLength(0)
    })
  })

  describe('unique ids', () => {
    it('assigns unique incrementing ids to each toast', () => {
      const { success, info, toasts } = useToast()
      success('First')
      info('Second')
      success('Third')

      const ids = toasts.value.map(t => t.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(3)

      // IDs should be incrementing
      expect(ids[1]).toBeGreaterThan(ids[0])
      expect(ids[2]).toBeGreaterThan(ids[1])
    })
  })

  describe('singleton behavior', () => {
    it('shares the same toasts array across multiple useToast calls', () => {
      const toast1 = useToast()
      const toast2 = useToast()

      toast1.success('From first')
      expect(toast2.toasts.value).toHaveLength(1)
      expect(toast2.toasts.value[0].message).toBe('From first')

      toast2.error('From second')
      expect(toast1.toasts.value).toHaveLength(2)
      expect(toast1.toasts.value[1].message).toBe('From second')
    })
  })
})
