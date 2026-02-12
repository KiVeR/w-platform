import { describe, it, expect, vi } from 'vitest'
import { ref, computed } from 'vue'
import { mockUseI18n } from '../helpers/stubs'

vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
mockUseI18n()

const { useTargetingScore } = await import('@/composables/useTargetingScore')

describe('useTargetingScore', () => {
  it('returns "too_targeted" for volume < 500', () => {
    const score = useTargetingScore(200)
    expect(score.value.level).toBe('too_targeted')
    expect(score.value.color).toBe('text-destructive')
  })

  it('returns "targeted" for volume 500-2000', () => {
    const score = useTargetingScore(1000)
    expect(score.value.level).toBe('targeted')
    expect(score.value.color).toBe('text-warning')
  })

  it('returns "optimal" for volume 2000-15000', () => {
    const score = useTargetingScore(8000)
    expect(score.value.level).toBe('optimal')
    expect(score.value.color).toBe('text-success')
  })

  it('returns "broad" for volume 15000-50000', () => {
    const score = useTargetingScore(30000)
    expect(score.value.level).toBe('broad')
    expect(score.value.color).toBe('text-warning')
  })

  it('returns "too_broad" for volume > 50000', () => {
    const score = useTargetingScore(100000)
    expect(score.value.level).toBe('too_broad')
    expect(score.value.color).toBe('text-destructive')
  })
})
