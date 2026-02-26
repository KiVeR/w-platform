<script setup lang="ts">
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card'
import type { CampaignTargeting } from '@/types/campaign'

const props = defineProps<{
  targeting: CampaignTargeting
}>()

const { t } = useI18n()

const zonesLabel = computed<string | null>(() => {
  if (props.targeting.method === 'department' && props.targeting.departments.length > 0) {
    return props.targeting.departments.join(', ')
  }
  if (props.targeting.method === 'postcode' && props.targeting.postcodes.length > 0) {
    return props.targeting.postcodes.join(', ')
  }
  if (props.targeting.method === 'address' && props.targeting.address) {
    return `${props.targeting.address} (${props.targeting.radius ?? 0} km)`
  }
  return null
})

function genderLabel(gender: CampaignTargeting['gender']): string {
  if (gender === 'M') return t('campaigns.detail.targeting.male')
  if (gender === 'F') return t('campaigns.detail.targeting.female')
  return t('campaigns.detail.targeting.mixed')
}

const demographicsLabel = computed<string>(() => {
  const gender = genderLabel(props.targeting.gender)
  const age = (props.targeting.age_min != null && props.targeting.age_max != null)
    ? t('campaigns.detail.targeting.age', { min: props.targeting.age_min, max: props.targeting.age_max })
    : t('campaigns.detail.targeting.allAges')
  return `${gender}, ${age}`
})
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-base">{{ t('campaigns.detail.targeting.title') }}</CardTitle>
    </CardHeader>
    <CardContent>
      <dl class="space-y-3 text-sm">
        <div class="flex justify-between">
          <dt class="text-muted-foreground">{{ t('campaigns.detail.targeting.methodLabel') }}</dt>
          <dd class="font-medium" data-method>{{ t(`campaigns.detail.targeting.method.${targeting.method}`) }}</dd>
        </div>

        <div v-if="zonesLabel" class="flex justify-between gap-4">
          <dt class="text-muted-foreground shrink-0">{{ t('campaigns.detail.targeting.zones') }}</dt>
          <dd class="font-medium text-right" data-zones>{{ zonesLabel }}</dd>
        </div>

        <div class="flex justify-between">
          <dt class="text-muted-foreground">{{ t('campaigns.detail.targeting.demographics') }}</dt>
          <dd class="font-medium" data-demographics>{{ demographicsLabel }}</dd>
        </div>
      </dl>
    </CardContent>
  </Card>
</template>
