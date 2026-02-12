import { Gift, Heart, Flower2, Sun, GraduationCap, type LucideIcon } from 'lucide-vue-next'

export interface SeasonalNudgeConfig {
  startMonth: number
  startDay: number
  endMonth: number
  endDay: number
  titleKey: string
  descKey: string
  icon: LucideIcon
  colorClass: string
}

export const SEASONAL_NUDGES: SeasonalNudgeConfig[] = [
  {
    startMonth: 10,
    startDay: 15,
    endMonth: 12,
    endDay: 15,
    titleKey: 'wizard.estimate.seasonal.christmas.title',
    descKey: 'wizard.estimate.seasonal.christmas.desc',
    icon: Gift,
    colorClass: 'text-violet-600 border-violet-200 bg-violet-50',
  },
  {
    startMonth: 1,
    startDay: 15,
    endMonth: 2,
    endDay: 10,
    titleKey: 'wizard.estimate.seasonal.valentine.title',
    descKey: 'wizard.estimate.seasonal.valentine.desc',
    icon: Heart,
    colorClass: 'text-pink-600 border-pink-200 bg-pink-50',
  },
  {
    startMonth: 3,
    startDay: 15,
    endMonth: 4,
    endDay: 30,
    titleKey: 'wizard.estimate.seasonal.spring.title',
    descKey: 'wizard.estimate.seasonal.spring.desc',
    icon: Flower2,
    colorClass: 'text-emerald-600 border-emerald-200 bg-emerald-50',
  },
  {
    startMonth: 6,
    startDay: 1,
    endMonth: 7,
    endDay: 15,
    titleKey: 'wizard.estimate.seasonal.parents.title',
    descKey: 'wizard.estimate.seasonal.parents.desc',
    icon: Sun,
    colorClass: 'text-amber-600 border-amber-200 bg-amber-50',
  },
  {
    startMonth: 8,
    startDay: 1,
    endMonth: 9,
    endDay: 15,
    titleKey: 'wizard.estimate.seasonal.backToSchool.title',
    descKey: 'wizard.estimate.seasonal.backToSchool.desc',
    icon: GraduationCap,
    colorClass: 'text-blue-600 border-blue-200 bg-blue-50',
  },
]
