<script setup lang="ts">
import { Settings2 } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import PageSkeleton from '@/components/shared/PageSkeleton.vue'
import type { PartnerFeature } from '@/types/partner'

defineProps<{
  features: PartnerFeature[]
  isLoading: boolean
  isAdmin: boolean
}>()

const emit = defineEmits<{
  toggle: [key: string, enabled: boolean]
}>()

const { t } = useI18n()

const featureGroups: Record<string, string[]> = {
  campaigns: ['campaign_prospection', 'campaign_fidelisation', 'campaign_comptage'],
  features: ['shops', 'sms_templates', 'short_urls', 'payment'],
  location: ['location_postcode', 'location_geoloc', 'location_iris'],
  analytics: ['analytics_prospection', 'analytics_fidelisation'],
  other: ['demo_mode'],
}

function getGroupForKey(key: string): string {
  for (const [group, keys] of Object.entries(featureGroups)) {
    if (keys.includes(key)) return group
  }
  return 'other'
}

function groupedFeatures(features: PartnerFeature[]) {
  const groups: Record<string, PartnerFeature[]> = {}
  for (const feature of features) {
    const group = getGroupForKey(feature.key)
    if (!groups[group]) groups[group] = []
    groups[group].push(feature)
  }
  return groups
}
</script>

<template>
  <Card data-features-panel>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Settings2 class="size-5" />
        {{ t('hub.features.title') }}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <PageSkeleton v-if="isLoading" variant="card" />
      <div v-else-if="features.length === 0" class="text-center py-6 text-muted-foreground">
        {{ t('hub.features.empty') }}
      </div>
      <div v-else class="space-y-6">
        <div
          v-for="(groupFeatures, groupKey) in groupedFeatures(features)"
          :key="groupKey"
        >
          <h4 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3" data-feature-group>
            {{ t(`hub.features.groups.${groupKey}`) }}
          </h4>
          <div class="space-y-3">
            <div
              v-for="feature in groupFeatures"
              :key="feature.key"
              data-feature-row
              class="flex items-center justify-between py-1"
            >
              <Label class="text-sm">
                {{ t(`hub.features.keys.${feature.key}`) }}
              </Label>
              <Switch
                :checked="feature.is_enabled"
                :disabled="!isAdmin"
                :data-feature-key="feature.key"
                @update:checked="emit('toggle', feature.key, $event)"
              />
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
