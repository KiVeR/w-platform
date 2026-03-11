<script setup lang="ts">
import { MapPin } from 'lucide-vue-next'
import TargetingSummary from '@/components/campaigns/TargetingSummary.vue'
import CollapsibleSection from '@/components/campaigns/detail/CollapsibleSection.vue'
import type { CampaignTargeting } from '@/types/campaign'

defineProps<{
  targeting: CampaignTargeting | null
  open?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { t } = useI18n()
</script>

<template>
  <CollapsibleSection
    :open="open"
    :title="t('campaigns.detail.targeting.title')"
    :icon="MapPin"
    :default-open="true"
    @update:open="emit('update:open', $event)"
  >
    <TargetingSummary
      v-if="targeting"
      data-section-targeting
      :targeting="targeting"
    />

    <p
      v-else
      data-section-targeting-empty
      class="text-sm text-muted-foreground"
    >
      —
    </p>
  </CollapsibleSection>
</template>
