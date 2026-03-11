import { ref, toValue, type MaybeRef, watch } from 'vue'
import type { CampaignStatus } from '@/types/campaign'

export type SectionKey = 'message' | 'targeting' | 'recipients' | 'timeline' | 'logs'

type SectionState = Record<SectionKey, boolean>

function getDefaultSections(status: CampaignStatus): SectionState {
  switch (status) {
    case 'sent':
      return { message: true, targeting: true, recipients: true, timeline: true, logs: true }
    case 'failed':
      return { message: true, targeting: false, recipients: false, timeline: true, logs: true }
    case 'cancelled':
      return { message: true, targeting: false, recipients: false, timeline: false, logs: false }
    default:
      return { message: true, targeting: true, recipients: false, timeline: false, logs: false }
  }
}

export function useCollapsibleSections(status: MaybeRef<CampaignStatus>) {
  const sections = ref<SectionState>(getDefaultSections(toValue(status)))

  function toggle(key: SectionKey): void {
    sections.value[key] = !sections.value[key]
  }

  function isOpen(key: SectionKey): boolean {
    return sections.value[key]
  }

  watch(() => toValue(status), (nextStatus) => {
    sections.value = getDefaultSections(nextStatus)
  })

  return { sections, toggle, isOpen }
}
