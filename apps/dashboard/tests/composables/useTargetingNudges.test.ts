import { describe, it, expect, vi } from 'vitest'
import { computed, ref } from 'vue'
import { mockUseI18n } from '../helpers/stubs'

vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
mockUseI18n()

const { useTargetingNudges } = await import('@/composables/useTargetingNudges')

const baseTargeting = {
  method: 'address' as const,
  departments: [],
  postcodes: [],
  address: '1 rue test',
  lat: 48.8,
  lng: 2.3,
  radius: 50,
  gender: null,
  age_min: null,
  age_max: null,
}

describe('useTargetingNudges', () => {
  it('returns empty when activityType is null', () => {
    const { nudges } = useTargetingNudges(null, baseTargeting)
    expect(nudges.value).toEqual([])
  })

  it('returns nudges for known sector', () => {
    const { nudges } = useTargetingNudges('optique', {
      ...baseTargeting,
      radius: 50, // Too large for optique (recommended 5-10)
    })
    expect(nudges.value.length).toBeGreaterThan(0)
  })

  it('returns empty for unknown sector', () => {
    const { nudges } = useTargetingNudges('unknown_sector', baseTargeting)
    expect(nudges.value).toEqual([])
  })

  it('returns radius nudge when radius exceeds recommendation', () => {
    const { nudges } = useTargetingNudges('proximite', {
      ...baseTargeting,
      radius: 20, // Recommended 2-3
    })
    const radiusNudge = nudges.value.find(n => n.type === 'radius')
    expect(radiusNudge).toBeTruthy()
    expect(radiusNudge!.messageKey).toContain('radiusTooLarge')
  })
})
