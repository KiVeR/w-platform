import { computed, type MaybeRef, toValue } from 'vue'
import { SECTOR_CONFIGS } from '@/data/sector-nudges'
import type { CampaignTargeting } from '@/types/campaign'

export interface TargetingNudge {
  type: 'radius' | 'age' | 'gender'
  messageKey: string
  messageParams: Record<string, string | number>
}

export function useTargetingNudges(
  activityType: MaybeRef<string | null | undefined>,
  targeting: MaybeRef<CampaignTargeting>,
) {
  const nudges = computed<TargetingNudge[]>(() => {
    const type = toValue(activityType)
    if (!type) return []

    const config = SECTOR_CONFIGS[type]
    if (!config) return []

    const target = toValue(targeting)
    const result: TargetingNudge[] = []

    if (config.radiusHint && target.method === 'address' && target.radius) {
      const [minR, maxR] = config.radiusHint
      if (target.radius > maxR) {
        result.push({
          type: 'radius',
          messageKey: 'wizard.estimate.sectorNudge.radiusTooLarge',
          messageParams: { recommended: `${minR}-${maxR}`, current: target.radius },
        })
      }
    }

    if (config.ageHint) {
      const [recMin, recMax] = config.ageHint
      const currentMin = target.age_min ?? 18
      const currentMax = target.age_max ?? 100
      if (currentMin < recMin - 5 || currentMax > recMax + 5) {
        result.push({
          type: 'age',
          messageKey: 'wizard.estimate.sectorNudge.ageRange',
          messageParams: { recommended: `${recMin}-${recMax}` },
        })
      }
    }

    if (config.genderHint && target.gender !== config.genderHint) {
      result.push({
        type: 'gender',
        messageKey: 'wizard.estimate.sectorNudge.gender',
        messageParams: { recommended: config.genderHint },
      })
    }

    return result
  })

  return { nudges }
}
