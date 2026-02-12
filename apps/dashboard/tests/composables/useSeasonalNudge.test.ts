import { describe, it, expect, vi, beforeEach } from 'vitest'
import { computed, ref } from 'vue'
import { mockUseI18n } from '../helpers/stubs'

vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
mockUseI18n()

const sessionStore: Record<string, string> = {}
const sessionStorageMock = {
  getItem: (key: string) => sessionStore[key] ?? null,
  setItem: (key: string, value: string) => { sessionStore[key] = value },
  removeItem: (key: string) => { delete sessionStore[key] },
  clear: () => { Object.keys(sessionStore).forEach(k => delete sessionStore[k]) },
}
vi.stubGlobal('sessionStorage', sessionStorageMock)

const { useSeasonalNudge } = await import('@/composables/useSeasonalNudge')

describe('useSeasonalNudge', () => {
  beforeEach(() => {
    sessionStorageMock.clear()
  })

  it('returns christmas nudge for November 1st', () => {
    const { nudge } = useSeasonalNudge(new Date(2026, 10, 1)) // Nov 1
    expect(nudge.value).not.toBeNull()
    expect(nudge.value!.titleKey).toContain('christmas')
  })

  it('returns back-to-school nudge for August 20th', () => {
    const { nudge } = useSeasonalNudge(new Date(2026, 7, 20)) // Aug 20
    expect(nudge.value).not.toBeNull()
    expect(nudge.value!.titleKey).toContain('backToSchool')
  })

  it('returns null for date outside any season (May 25)', () => {
    const { nudge } = useSeasonalNudge(new Date(2026, 4, 25)) // May 25
    expect(nudge.value).toBeNull()
  })

  it('dismiss() sets isDismissed to true', () => {
    const { nudge, isDismissed, dismiss } = useSeasonalNudge(new Date(2026, 10, 1))
    expect(nudge.value).not.toBeNull()

    dismiss()
    expect(isDismissed.value).toBe(true)
    expect(nudge.value).toBeNull()
  })

  it('isDismissed reads from sessionStorage', () => {
    // Pre-set dismissed state for November (month 11)
    sessionStorageMock.setItem('seasonal-nudge-dismissed-11', 'true')

    const { isDismissed, nudge } = useSeasonalNudge(new Date(2026, 10, 1))
    expect(isDismissed.value).toBe(true)
    expect(nudge.value).toBeNull()
  })
})
