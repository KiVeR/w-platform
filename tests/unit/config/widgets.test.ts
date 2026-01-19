import type { WidgetType } from '@/types/widget'
import { describe, expect, it } from 'vitest'
import { canAcceptChild, getAllowedChildrenFor, getWidgetConfig } from '@/config/widgets'

describe('canAcceptChild', () => {
  describe('row widget', () => {
    it('accepts only column as child', () => {
      expect(canAcceptChild('row', 'column')).toBe(true)
    })

    it('rejects non-column widgets', () => {
      const nonColumnTypes: WidgetType[] = [
        'text',
        'button',
        'image',
        'title',
        'form',
        'row',
        'video',
        'separator',
        'spacer',
      ]
      for (const type of nonColumnTypes) {
        expect(canAcceptChild('row', type)).toBe(false)
      }
    })
  })

  describe('column widget', () => {
    it('accepts most widgets', () => {
      expect(canAcceptChild('column', 'text')).toBe(true)
      expect(canAcceptChild('column', 'button')).toBe(true)
      expect(canAcceptChild('column', 'image')).toBe(true)
      expect(canAcceptChild('column', 'title')).toBe(true)
      expect(canAcceptChild('column', 'form')).toBe(true)
      expect(canAcceptChild('column', 'video')).toBe(true)
    })

    it('rejects row and column to prevent infinite nesting', () => {
      expect(canAcceptChild('column', 'row')).toBe(false)
      expect(canAcceptChild('column', 'column')).toBe(false)
    })
  })

  describe('form widget', () => {
    it('rejects nested forms', () => {
      expect(canAcceptChild('form', 'form')).toBe(false)
    })

    it('accepts form-field', () => {
      expect(canAcceptChild('form', 'form-field')).toBe(true)
    })

    it('accepts other widgets inside form', () => {
      expect(canAcceptChild('form', 'text')).toBe(true)
      expect(canAcceptChild('form', 'button')).toBe(true)
      expect(canAcceptChild('form', 'title')).toBe(true)
    })
  })

  describe('non-container widgets', () => {
    const nonContainers: WidgetType[] = [
      'title',
      'text',
      'button',
      'image',
      'video',
      'separator',
      'spacer',
      'click-to-call',
      'map',
      'barcode',
      'form-field',
    ]

    for (const type of nonContainers) {
      it(`${type} cannot have children`, () => {
        expect(canAcceptChild(type, 'text')).toBe(false)
        expect(canAcceptChild(type, 'button')).toBe(false)
      })
    }
  })
})

describe('getWidgetConfig', () => {
  it('returns config for valid widget type', () => {
    const config = getWidgetConfig('button')
    expect(config).toBeDefined()
    expect(config?.type).toBe('button')
    expect(config?.category).toBe('actions')
  })

  it('returns undefined for invalid widget type', () => {
    const config = getWidgetConfig('invalid-type')
    expect(config).toBeUndefined()
  })

  it('returns correct canHaveChildren for containers', () => {
    expect(getWidgetConfig('row')?.canHaveChildren).toBe(true)
    expect(getWidgetConfig('column')?.canHaveChildren).toBe(true)
    expect(getWidgetConfig('form')?.canHaveChildren).toBe(true)
  })

  it('returns undefined canHaveChildren for non-containers', () => {
    expect(getWidgetConfig('button')?.canHaveChildren).toBeUndefined()
    expect(getWidgetConfig('text')?.canHaveChildren).toBeUndefined()
  })
})

describe('getAllowedChildrenFor', () => {
  it('returns only column for row', () => {
    const allowed = getAllowedChildrenFor('row')
    expect(allowed).toEqual(['column'])
  })

  it('returns empty array for non-container widgets', () => {
    expect(getAllowedChildrenFor('text')).toEqual([])
    expect(getAllowedChildrenFor('button')).toEqual([])
    expect(getAllowedChildrenFor('image')).toEqual([])
  })

  it('returns all types except row and column for column widget', () => {
    const allowed = getAllowedChildrenFor('column')
    expect(allowed).not.toContain('row')
    expect(allowed).not.toContain('column')
    expect(allowed).toContain('text')
    expect(allowed).toContain('button')
    expect(allowed).toContain('form')
  })

  it('returns all types except form for form widget', () => {
    const allowed = getAllowedChildrenFor('form')
    expect(allowed).not.toContain('form')
    expect(allowed).toContain('form-field')
    expect(allowed).toContain('text')
    expect(allowed).toContain('button')
  })
})
