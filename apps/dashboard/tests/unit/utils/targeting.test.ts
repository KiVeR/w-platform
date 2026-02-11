import { describe, expect, test } from 'vitest'
import { canonicalToUi } from '@/utils/targeting'
import type { CampaignTargeting } from '@/types/campaign'

describe('canonicalToUi', () => {
  test('converts canonical department targeting to UI format', () => {
    const canonical = {
      method: 'department' as const,
      input: { method: 'department', departments: ['75', '69'], postcodes: [] },
      zones: [
        { code: '75', type: 'department', label: 'Paris', volume: 500 },
        { code: '69', type: 'department', label: 'Rhône', volume: 300 },
      ],
      origin: null,
      demographics: { gender: 'M' as const, age_min: 25, age_max: 50 },
    }

    const ui = canonicalToUi(canonical)

    expect(ui.method).toBe('department')
    expect(ui.departments).toEqual(['75', '69'])
    expect(ui.gender).toBe('M')
    expect(ui.age_min).toBe(25)
    expect(ui.age_max).toBe(50)
  })

  test('converts canonical postcode targeting to UI format', () => {
    const canonical = {
      method: 'postcode' as const,
      input: { method: 'postcode', departments: [], postcodes: ['75001', '75002'] },
      zones: [
        { code: '75001', type: 'postcode', label: '75001', volume: 0 },
        { code: '75002', type: 'postcode', label: '75002', volume: 0 },
      ],
      origin: null,
      demographics: null,
    }

    const ui = canonicalToUi(canonical)

    expect(ui.method).toBe('postcode')
    expect(ui.postcodes).toEqual(['75001', '75002'])
    expect(ui.departments).toEqual([])
  })

  test('converts canonical address targeting to UI format', () => {
    const canonical = {
      method: 'address' as const,
      input: {
        method: 'address',
        departments: [],
        postcodes: [],
        address: '1 rue de Rivoli',
        lat: 48.86,
        lng: 2.34,
        radius: 5000,
      },
      zones: [{ code: '751010101', type: 'iris', label: 'Paris 1er', volume: 0 }],
      origin: { address: '1 rue de Rivoli', lat: 48.86, lng: 2.34, radius: 5000 },
      demographics: { gender: 'F' as const, age_min: 30, age_max: 60 },
    }

    const ui = canonicalToUi(canonical)

    expect(ui.method).toBe('address')
    expect(ui.address).toBe('1 rue de Rivoli')
    expect(ui.lat).toBe(48.86)
    expect(ui.lng).toBe(2.34)
    expect(ui.radius).toBe(5000)
    expect(ui.gender).toBe('F')
  })

  test('maps demographics from canonical to UI', () => {
    const canonical = {
      method: 'department' as const,
      input: { method: 'department', departments: ['75'], postcodes: [] },
      zones: [],
      origin: null,
      demographics: { gender: 'M' as const, age_min: 18, age_max: 100 },
    }

    const ui = canonicalToUi(canonical)

    expect(ui.gender).toBe('M')
    expect(ui.age_min).toBe(18)
    expect(ui.age_max).toBe(100)
  })

  test('handles null demographics', () => {
    const canonical = {
      method: 'department' as const,
      input: { method: 'department', departments: ['75'], postcodes: [] },
      zones: [],
      origin: null,
      demographics: null,
    }

    const ui = canonicalToUi(canonical)

    expect(ui.gender).toBeNull()
    expect(ui.age_min).toBeNull()
    expect(ui.age_max).toBeNull()
  })

  test('handles null origin', () => {
    const canonical = {
      method: 'department' as const,
      input: { method: 'department', departments: ['75'], postcodes: [] },
      zones: [],
      origin: null,
      demographics: null,
    }

    const ui = canonicalToUi(canonical)

    expect(ui.address).toBeNull()
    expect(ui.lat).toBeNull()
    expect(ui.lng).toBeNull()
    expect(ui.radius).toBeNull()
  })

  test('handles empty zones', () => {
    const canonical = {
      method: 'department' as const,
      input: { method: 'department', departments: [], postcodes: [] },
      zones: [],
      origin: null,
      demographics: null,
    }

    const ui = canonicalToUi(canonical)

    expect(ui.departments).toEqual([])
    expect(ui.postcodes).toEqual([])
  })
})
