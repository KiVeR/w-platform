import { ref, computed } from 'vue'
import { SEASONAL_NUDGES, type SeasonalNudgeConfig } from '@/data/seasonal-nudges'

function isDateInRange(date: Date, config: SeasonalNudgeConfig): boolean {
  const month = date.getMonth() + 1
  const day = date.getDate()

  if (config.startMonth <= config.endMonth) {
    if (month < config.startMonth || month > config.endMonth) return false
    if (month === config.startMonth && day < config.startDay) return false
    if (month === config.endMonth && day > config.endDay) return false
    return true
  }
  else {
    if (month > config.endMonth && month < config.startMonth) return false
    if (month === config.startMonth && day < config.startDay) return false
    if (month === config.endMonth && day > config.endDay) return false
    return true
  }
}

function getStorageKey(date: Date): string {
  return `seasonal-nudge-dismissed-${date.getMonth() + 1}`
}

export function useSeasonalNudge(now?: Date) {
  const date = now ?? new Date()

  const activeNudge = SEASONAL_NUDGES.find(n => isDateInRange(date, n)) ?? null

  const isDismissed = ref(
    activeNudge ? sessionStorage.getItem(getStorageKey(date)) === 'true' : false,
  )

  const nudge = computed(() => {
    if (!activeNudge || isDismissed.value) return null
    return activeNudge
  })

  function dismiss() {
    isDismissed.value = true
    sessionStorage.setItem(getStorageKey(date), 'true')
  }

  return { nudge, isDismissed, dismiss }
}
