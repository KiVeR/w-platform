import { describe, expect, test } from 'vitest'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
} from '@/utils/format'

describe('formatNumber', () => {
  test('formate avec espace insecable', () => {
    expect(formatNumber(12450)).toBe('12\u202f450')
    expect(formatNumber(0)).toBe('0')
    expect(formatNumber(999)).toBe('999')
  })
})

describe('formatCurrency', () => {
  test('formate en euros FR', () => {
    const result = formatCurrency(623.5)
    expect(result).toContain('623,50')
    expect(result).toContain('€')
  })
})

describe('formatDate', () => {
  test('formate une date ISO en DD/MM/YYYY', () => {
    expect(formatDate('2026-02-05T09:00:00Z')).toBe('05/02/2026')
  })
})

describe('formatDateTime', () => {
  test('formate une date ISO en DD/MM/YYYY a HH:MM', () => {
    const result = formatDateTime('2026-02-05T09:00:00Z')
    expect(result).toContain('05/02/2026')
    expect(result).toMatch(/\d{2}:\d{2}/)
  })
})
