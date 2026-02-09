import { formatRelativeTime } from '@@/layers/editor/utils/formatters'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('formatRelativeTime', () => {
  const NOW = new Date('2025-06-15T12:00:00Z')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "A l\'instant" for just now', () => {
    const result = formatRelativeTime(NOW)
    expect(result).toBe('À l\'instant')
  })

  it('returns relative minutes for a few minutes ago', () => {
    const fiveMinutesAgo = new Date('2025-06-15T11:55:00Z')
    const result = formatRelativeTime(fiveMinutesAgo)
    expect(result).toContain('5')
    expect(result).toContain('minute')
  })

  it('returns relative hours for a few hours ago', () => {
    const threeHoursAgo = new Date('2025-06-15T09:00:00Z')
    const result = formatRelativeTime(threeHoursAgo)
    expect(result).toContain('3')
    expect(result).toContain('heure')
  })

  it('returns relative days for yesterday', () => {
    const yesterday = new Date('2025-06-14T12:00:00Z')
    const result = formatRelativeTime(yesterday)
    expect(result).toContain('hier')
  })

  it('returns relative days for multiple days ago', () => {
    const threeDaysAgo = new Date('2025-06-12T12:00:00Z')
    const result = formatRelativeTime(threeDaysAgo)
    expect(result).toContain('3')
    expect(result).toContain('jour')
  })

  it('accepts string date input', () => {
    const result = formatRelativeTime('2025-06-15T11:30:00Z')
    expect(result).toContain('30')
    expect(result).toContain('minute')
  })

  it('returns "A l\'instant" for less than a minute ago', () => {
    const thirtySecondsAgo = new Date('2025-06-15T11:59:30Z')
    const result = formatRelativeTime(thirtySecondsAgo)
    expect(result).toBe('À l\'instant')
  })

  it('uses French locale for formatting', () => {
    const twoHoursAgo = new Date('2025-06-15T10:00:00Z')
    const result = formatRelativeTime(twoHoursAgo)
    // French uses "il y a" for past relative time
    expect(result).toContain('il y a')
  })
})
