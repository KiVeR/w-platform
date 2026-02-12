import { computed, type MaybeRef, toValue } from 'vue'

export type TargetingLevel = 'too_targeted' | 'targeted' | 'optimal' | 'broad' | 'too_broad'

export interface TargetingScore {
  level: TargetingLevel
  label: string
  color: string
  position: number
}

const THRESHOLDS = [
  { max: 500, level: 'too_targeted' as const, labelKey: 'wizard.estimate.score.tooTargeted', color: 'text-destructive' },
  { max: 2000, level: 'targeted' as const, labelKey: 'wizard.estimate.score.targeted', color: 'text-warning' },
  { max: 15000, level: 'optimal' as const, labelKey: 'wizard.estimate.score.optimal', color: 'text-success' },
  { max: 50000, level: 'broad' as const, labelKey: 'wizard.estimate.score.broad', color: 'text-warning' },
  { max: Infinity, level: 'too_broad' as const, labelKey: 'wizard.estimate.score.tooBroad', color: 'text-destructive' },
]

const BAND_WIDTH = 100 / THRESHOLDS.length

function computePosition(volume: number): number {
  for (let i = 0; i < THRESHOLDS.length; i++) {
    const threshold = THRESHOLDS[i]
    const prevMax = THRESHOLDS[i - 1]?.max ?? 0
    if (volume <= threshold.max) {
      const localRatio = threshold.max === Infinity
        ? Math.min((volume - prevMax) / (prevMax * 2 || 100000), 1)
        : (volume - prevMax) / (threshold.max - prevMax)
      return i * BAND_WIDTH + localRatio * BAND_WIDTH
    }
  }
  return 100
}

export function useTargetingScore(volume: MaybeRef<number>) {
  const { t } = useI18n()

  return computed<TargetingScore>(() => {
    const v = toValue(volume)
    const threshold = THRESHOLDS.find(th => v <= th.max) ?? THRESHOLDS[4]
    return {
      level: threshold.level,
      label: t(threshold.labelKey),
      color: threshold.color,
      position: Math.min(computePosition(v), 100),
    }
  })
}
