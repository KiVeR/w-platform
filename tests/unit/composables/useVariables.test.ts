/* eslint-disable no-template-curly-in-string */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'

vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)

const { useVariables, VARIABLE_PATTERN } = await import('#editor/composables/useVariables')

describe('useVariables', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('vARIABLE_PATTERN', () => {
    it('matches simple variable syntax', () => {
      const text = 'Hello ${firstName}'
      const matches = [...text.matchAll(VARIABLE_PATTERN)]
      expect(matches).toHaveLength(1)
      expect(matches[0][1]).toBe('firstName')
    })

    it('matches multiple variables', () => {
      const text = '${greeting} ${firstName} ${lastName}'
      const matches = [...text.matchAll(VARIABLE_PATTERN)]
      expect(matches).toHaveLength(3)
      expect(matches.map(m => m[1])).toEqual(['greeting', 'firstName', 'lastName'])
    })

    it('matches variables with underscores', () => {
      const text = '${nom_magasin}'
      const matches = [...text.matchAll(VARIABLE_PATTERN)]
      expect(matches).toHaveLength(1)
      expect(matches[0][1]).toBe('nom_magasin')
    })

    it('does not match empty braces', () => {
      const text = '${}'
      const matches = [...text.matchAll(VARIABLE_PATTERN)]
      expect(matches).toHaveLength(0)
    })

    it('does not match incomplete syntax', () => {
      expect([...'${ '.matchAll(VARIABLE_PATTERN)]).toHaveLength(0)
      expect([...'${'.matchAll(VARIABLE_PATTERN)]).toHaveLength(0)
      expect([...'$name}'.matchAll(VARIABLE_PATTERN)]).toHaveLength(0)
    })
  })

  describe('extractVariables', () => {
    const { extractVariables } = useVariables()

    it('extracts variable names from text', () => {
      const result = extractVariables('Bonjour ${firstName} ${lastName}')
      expect(result).toEqual(['firstName', 'lastName'])
    })

    it('returns empty array for text without variables', () => {
      expect(extractVariables('Hello world')).toEqual([])
    })

    it('returns empty array for empty string', () => {
      expect(extractVariables('')).toEqual([])
    })

    it('returns empty array for undefined/null', () => {
      expect(extractVariables(undefined as any)).toEqual([])
      expect(extractVariables(null as any)).toEqual([])
    })

    it('deduplicates variable names', () => {
      const result = extractVariables('${name} aime ${name}')
      expect(result).toEqual(['name'])
    })

    it('handles variables with underscores and mixed case', () => {
      const result = extractVariables('${nom_magasin} ${horairesOuverture}')
      expect(result).toEqual(['nom_magasin', 'horairesOuverture'])
    })
  })

  describe('hasVariables', () => {
    const { hasVariables } = useVariables()

    it('returns true if text contains variables', () => {
      expect(hasVariables('Hello ${name}')).toBe(true)
    })

    it('returns false if text has no variables', () => {
      expect(hasVariables('Hello world')).toBe(false)
    })

    it('returns false for empty or nullish input', () => {
      expect(hasVariables('')).toBe(false)
      expect(hasVariables(undefined as any)).toBe(false)
      expect(hasVariables(null as any)).toBe(false)
    })
  })

  describe('resolveVariables', () => {
    const { resolveVariables } = useVariables()

    it('replaces variables with provided data values', () => {
      const result = resolveVariables('Bonjour ${firstName}', { firstName: 'Marie' })
      expect(result).toBe('Bonjour Marie')
    })

    it('replaces multiple variables', () => {
      const result = resolveVariables(
        '${firstName} ${lastName}',
        { firstName: 'Marie', lastName: 'Dupont' },
      )
      expect(result).toBe('Marie Dupont')
    })

    it('leaves unresolved variables as-is', () => {
      const result = resolveVariables('Hello ${firstName} ${unknown}', { firstName: 'Marie' })
      expect(result).toBe('Hello Marie ${unknown}')
    })

    it('returns original text if no data provided', () => {
      const result = resolveVariables('Hello ${name}')
      expect(result).toBe('Hello ${name}')
    })

    it('returns original text if data is empty', () => {
      const result = resolveVariables('Hello ${name}', {})
      expect(result).toBe('Hello ${name}')
    })

    it('returns empty string for empty input', () => {
      expect(resolveVariables('')).toBe('')
    })

    it('handles nullish input gracefully', () => {
      expect(resolveVariables(undefined as any)).toBe('')
      expect(resolveVariables(null as any)).toBe('')
    })

    it('handles non-string data values (coerces to string)', () => {
      const result = resolveVariables('Count: ${count}', { count: 42 as any })
      expect(result).toBe('Count: 42')
    })
  })

  describe('findUndefinedVariables', () => {
    const { findUndefinedVariables } = useVariables()

    it('returns variables not present in known variable names', () => {
      const result = findUndefinedVariables(
        'Hello ${firstName} ${unknownVar}',
        ['firstName', 'lastName'],
      )
      expect(result).toEqual(['unknownVar'])
    })

    it('returns empty array when all variables are known', () => {
      const result = findUndefinedVariables(
        '${firstName} ${lastName}',
        ['firstName', 'lastName'],
      )
      expect(result).toEqual([])
    })

    it('returns empty array for text without variables', () => {
      expect(findUndefinedVariables('Hello', ['firstName'])).toEqual([])
    })

    it('returns all variables when known list is empty', () => {
      const result = findUndefinedVariables('${a} ${b}', [])
      expect(result).toEqual(['a', 'b'])
    })
  })

  describe('insertAtCursor', () => {
    const { insertAtCursor } = useVariables()

    it('inserts variable syntax at cursor position', () => {
      const mockElement = {
        value: 'Hello world',
        selectionStart: 6,
        selectionEnd: 6,
        focus: vi.fn(),
        setSelectionRange: vi.fn(),
        dispatchEvent: vi.fn(),
      }

      const result = insertAtCursor(mockElement as any, 'firstName')
      expect(result).toBe('Hello ${firstName}world')
    })

    it('replaces selected text with variable', () => {
      const mockElement = {
        value: 'Hello world',
        selectionStart: 6,
        selectionEnd: 11, // "world" selected
        focus: vi.fn(),
        setSelectionRange: vi.fn(),
        dispatchEvent: vi.fn(),
      }

      const result = insertAtCursor(mockElement as any, 'name')
      expect(result).toBe('Hello ${name}')
    })

    it('appends variable at end when no cursor position', () => {
      const mockElement = {
        value: 'Hello ',
        selectionStart: 6,
        selectionEnd: 6,
        focus: vi.fn(),
        setSelectionRange: vi.fn(),
        dispatchEvent: vi.fn(),
      }

      const result = insertAtCursor(mockElement as any, 'name')
      expect(result).toBe('Hello ${name}')
    })

    it('focuses and updates cursor position after insert', () => {
      const mockElement = {
        value: 'Hi',
        selectionStart: 2,
        selectionEnd: 2,
        focus: vi.fn(),
        setSelectionRange: vi.fn(),
        dispatchEvent: vi.fn(),
      }

      insertAtCursor(mockElement as any, 'name')
      expect(mockElement.focus).toHaveBeenCalled()
      // Cursor should be placed after the inserted variable
      const expectedPos = 2 + '${name}'.length
      expect(mockElement.setSelectionRange).toHaveBeenCalledWith(expectedPos, expectedPos)
    })
  })
})
