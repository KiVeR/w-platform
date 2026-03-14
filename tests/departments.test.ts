import { describe, it, expect } from 'vitest'
import { deptCodeFromPostcode } from '#targeting/utils/departments'

describe('deptCodeFromPostcode', () => {
  it('extracts 2-digit code for mainland France', () => {
    expect(deptCodeFromPostcode('75001')).toBe('75')
    expect(deptCodeFromPostcode('13001')).toBe('13')
  })

  it('returns 2A for Corse-du-Sud (< 20200)', () => {
    expect(deptCodeFromPostcode('20000')).toBe('2A')
    expect(deptCodeFromPostcode('20100')).toBe('2A')
  })

  it('returns 2B for Haute-Corse (>= 20200)', () => {
    expect(deptCodeFromPostcode('20200')).toBe('2B')
    expect(deptCodeFromPostcode('20600')).toBe('2B')
  })

  it('extracts 3-digit code for DOM (97xxx)', () => {
    expect(deptCodeFromPostcode('97100')).toBe('971')
    expect(deptCodeFromPostcode('97400')).toBe('974')
  })

  it('extracts 3-digit code for TOM (98xxx)', () => {
    expect(deptCodeFromPostcode('98000')).toBe('980')
    expect(deptCodeFromPostcode('98800')).toBe('988')
  })
})
