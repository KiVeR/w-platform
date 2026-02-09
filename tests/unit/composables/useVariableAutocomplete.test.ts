/* eslint-disable no-template-curly-in-string */
import { createPinia, defineStore, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'

vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('defineStore', defineStore)

// Mock the variable schema store to provide variable names
const mockVariableNames = ref<string[]>([])

vi.mock('#editor/stores/variableSchema', () => ({
  useVariableSchemaStore: () => ({
    variableNames: mockVariableNames.value,
    allVariables: mockVariableNames.value.map(name => ({
      name,
      type: name.includes('_') ? 'global' : 'recipient',
    })),
  }),
}))

const { useVariableAutocomplete } = await import('#editor/composables/useVariableAutocomplete')

describe('useVariableAutocomplete', () => {
  beforeEach(() => {
    vi.stubGlobal('ref', ref)
    vi.stubGlobal('computed', computed)
    vi.stubGlobal('defineStore', defineStore)
    setActivePinia(createPinia())
    mockVariableNames.value = ['firstName', 'lastName', 'nom_magasin', 'horaires', 'email']
  })

  describe('handleInput', () => {
    it('activates autocomplete when cursor is after ${', () => {
      const autocomplete = useVariableAutocomplete()
      autocomplete.handleInput('Hello ${', 8)

      expect(autocomplete.isActive.value).toBe(true)
    })

    it('does not activate for text without ${', () => {
      const autocomplete = useVariableAutocomplete()
      autocomplete.handleInput('Hello world', 11)

      expect(autocomplete.isActive.value).toBe(false)
    })

    it('does not activate if cursor is before ${', () => {
      const autocomplete = useVariableAutocomplete()
      autocomplete.handleInput('Hello ${ world', 5) // cursor on "Hello"

      expect(autocomplete.isActive.value).toBe(false)
    })

    it('does not activate after a completed variable ${...}', () => {
      const autocomplete = useVariableAutocomplete()
      autocomplete.handleInput('Hello ${firstName} world', 23)

      expect(autocomplete.isActive.value).toBe(false)
    })

    it('activates with partial typing inside ${...', () => {
      const autocomplete = useVariableAutocomplete()
      autocomplete.handleInput('Hello ${fir', 11)

      expect(autocomplete.isActive.value).toBe(true)
    })
  })

  describe('suggestions', () => {
    it('returns all variables when query is empty after ${', () => {
      const autocomplete = useVariableAutocomplete()
      autocomplete.handleInput('Hello ${', 8)

      expect(autocomplete.suggestions.value).toHaveLength(5)
    })

    it('filters variables by partial name', () => {
      const autocomplete = useVariableAutocomplete()
      autocomplete.handleInput('Hello ${fir', 11)

      expect(autocomplete.suggestions.value.length).toBeGreaterThanOrEqual(1)
      expect(autocomplete.suggestions.value.some((s: any) => s.name === 'firstName')).toBe(true)
    })

    it('filters case-insensitively', () => {
      const autocomplete = useVariableAutocomplete()
      autocomplete.handleInput('${FIRST', 7)

      expect(autocomplete.suggestions.value.some((s: any) => s.name === 'firstName')).toBe(true)
    })

    it('returns empty array when no matches', () => {
      const autocomplete = useVariableAutocomplete()
      autocomplete.handleInput('${zzz', 5)

      expect(autocomplete.suggestions.value).toHaveLength(0)
    })

    it('returns empty array when no schema variables exist', () => {
      mockVariableNames.value = []
      const autocomplete = useVariableAutocomplete()
      autocomplete.handleInput('${', 2)

      expect(autocomplete.suggestions.value).toHaveLength(0)
    })
  })

  describe('selectedIndex', () => {
    it('starts at 0', () => {
      const autocomplete = useVariableAutocomplete()
      autocomplete.handleInput('${', 2)

      expect(autocomplete.selectedIndex.value).toBe(0)
    })

    it('resets to 0 when suggestions change', () => {
      const autocomplete = useVariableAutocomplete()
      autocomplete.handleInput('${', 2)
      autocomplete.selectedIndex.value = 3
      autocomplete.handleInput('${f', 3)

      expect(autocomplete.selectedIndex.value).toBe(0)
    })
  })

  describe('keyboard navigation', () => {
    it('moveDown increments selectedIndex', () => {
      const autocomplete = useVariableAutocomplete()
      autocomplete.handleInput('${', 2)
      autocomplete.moveDown()

      expect(autocomplete.selectedIndex.value).toBe(1)
    })

    it('moveDown wraps to 0 at end of list', () => {
      const autocomplete = useVariableAutocomplete()
      autocomplete.handleInput('${', 2)
      const count = autocomplete.suggestions.value.length
      for (let i = 0; i < count; i++)
        autocomplete.moveDown()

      expect(autocomplete.selectedIndex.value).toBe(0)
    })

    it('moveUp decrements selectedIndex', () => {
      const autocomplete = useVariableAutocomplete()
      autocomplete.handleInput('${', 2)
      autocomplete.moveDown()
      autocomplete.moveUp()

      expect(autocomplete.selectedIndex.value).toBe(0)
    })

    it('moveUp wraps to last item from 0', () => {
      const autocomplete = useVariableAutocomplete()
      autocomplete.handleInput('${', 2)
      autocomplete.moveUp()

      const count = autocomplete.suggestions.value.length
      expect(autocomplete.selectedIndex.value).toBe(count - 1)
    })
  })

  describe('selectCurrent', () => {
    it('returns the currently selected variable name', () => {
      const autocomplete = useVariableAutocomplete()
      autocomplete.handleInput('${', 2)

      const selected = autocomplete.selectCurrent()
      expect(selected).toBeTruthy()
      expect(typeof selected).toBe('string')
    })

    it('returns null when no suggestions', () => {
      const autocomplete = useVariableAutocomplete()
      autocomplete.handleInput('${zzz', 5)

      expect(autocomplete.selectCurrent()).toBeNull()
    })

    it('deactivates autocomplete after selection', () => {
      const autocomplete = useVariableAutocomplete()
      autocomplete.handleInput('${', 2)
      autocomplete.selectCurrent()

      expect(autocomplete.isActive.value).toBe(false)
    })
  })

  describe('dismiss', () => {
    it('deactivates autocomplete', () => {
      const autocomplete = useVariableAutocomplete()
      autocomplete.handleInput('${', 2)
      expect(autocomplete.isActive.value).toBe(true)

      autocomplete.dismiss()
      expect(autocomplete.isActive.value).toBe(false)
    })

    it('resets selectedIndex', () => {
      const autocomplete = useVariableAutocomplete()
      autocomplete.handleInput('${', 2)
      autocomplete.moveDown()
      autocomplete.moveDown()

      autocomplete.dismiss()
      expect(autocomplete.selectedIndex.value).toBe(0)
    })
  })
})
