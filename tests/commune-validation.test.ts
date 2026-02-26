import { describe, it, expect } from 'vitest'
import { isAlphaQuery, isValidCommuneQuery } from '@/utils/commune-validation'

describe('isAlphaQuery', () => {
  it('accepts alphabetic strings', () => {
    expect(isAlphaQuery('Paris')).toBe(true)
  })

  it('accepts strings with accents', () => {
    expect(isAlphaQuery('Île-de-France')).toBe(true)
  })

  it('accepts strings with spaces and hyphens', () => {
    expect(isAlphaQuery('Aix en Provence')).toBe(true)
    expect(isAlphaQuery('Saint-Étienne')).toBe(true)
  })

  it('rejects numeric strings', () => {
    expect(isAlphaQuery('75001')).toBe(false)
    expect(isAlphaQuery('123')).toBe(false)
  })

  it('rejects mixed alpha-numeric', () => {
    expect(isAlphaQuery('Paris 1er')).toBe(false)
  })
})

describe('isValidCommuneQuery', () => {
  it('accepts alpha queries', () => {
    expect(isValidCommuneQuery('Paris')).toBe(true)
  })

  it('accepts 2-digit codes', () => {
    expect(isValidCommuneQuery('75')).toBe(true)
  })

  it('accepts 5-digit codes', () => {
    expect(isValidCommuneQuery('75001')).toBe(true)
  })

  it('rejects single digit', () => {
    expect(isValidCommuneQuery('5')).toBe(false)
  })

  it('rejects 6+ digit codes', () => {
    expect(isValidCommuneQuery('123456')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidCommuneQuery('')).toBe(false)
  })
})
