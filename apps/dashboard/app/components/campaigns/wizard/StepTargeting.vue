<script setup lang="ts">
import { MapPin, Hash, Navigation, Check } from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import DepartmentSelector from '@/components/campaigns/wizard/DepartmentSelector.vue'
import PostcodeInput from '@/components/campaigns/wizard/PostcodeInput.vue'
import AddressRadius from '@/components/campaigns/wizard/AddressRadius.vue'
import TargetingMap from '@/components/campaigns/wizard/TargetingMap.vue'
import { useCampaignWizardStore } from '@/stores/campaignWizard'
import type { TargetingMethod } from '@/types/campaign'

const wizard = useCampaignWizardStore()
const { t } = useI18n()

const methods: { key: TargetingMethod, icon: typeof MapPin }[] = [
  { key: 'department', icon: MapPin },
  { key: 'postcode', icon: Hash },
  { key: 'address', icon: Navigation },
]

function selectMethod(method: TargetingMethod) {
  wizard.campaign.targeting.method = method
  wizard.isDirty = true
}

function toggleDepartment(code: string) {
  const deps = wizard.campaign.targeting.departments
  const idx = deps.indexOf(code)
  if (idx >= 0) {
    deps.splice(idx, 1)
  }
  else {
    deps.push(code)
  }
  wizard.isDirty = true
}
</script>

<template>
  <div class="space-y-6">
    <h2 class="text-lg font-semibold">{{ t('wizard.targeting.title') }}</h2>

    <div class="grid gap-4 sm:grid-cols-3">
      <Card
        v-for="m in methods"
        :key="m.key"
        data-method-card
        class="cursor-pointer transition-all"
        :class="wizard.campaign.targeting.method === m.key
          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
          : 'hover:border-primary/50'"
        @click="selectMethod(m.key)"
      >
        <CardHeader>
          <div class="flex items-center justify-between">
            <component :is="m.icon" class="size-6 text-primary" />
            <Check v-if="wizard.campaign.targeting.method === m.key" class="size-5 text-primary" />
          </div>
          <CardTitle class="mt-2 text-sm">
            {{ t(`wizard.targeting.methods.${m.key}.title`) }}
          </CardTitle>
          <CardDescription class="text-xs">
            {{ t(`wizard.targeting.methods.${m.key}.description`) }}
          </CardDescription>
        </CardHeader>
      </Card>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <div>
        <DepartmentSelector
          v-if="wizard.campaign.targeting.method === 'department'"
          v-model="wizard.campaign.targeting.departments"
        />
        <PostcodeInput
          v-if="wizard.campaign.targeting.method === 'postcode'"
          v-model="wizard.campaign.targeting.postcodes"
        />
        <AddressRadius
          v-if="wizard.campaign.targeting.method === 'address'"
          :address="wizard.campaign.targeting.address"
          :lat="wizard.campaign.targeting.lat"
          :lng="wizard.campaign.targeting.lng"
          :radius="wizard.campaign.targeting.radius"
          @update:address="wizard.campaign.targeting.address = $event"
          @update:lat="wizard.campaign.targeting.lat = $event"
          @update:lng="wizard.campaign.targeting.lng = $event"
          @update:radius="wizard.campaign.targeting.radius = $event"
        />
      </div>

      <ClientOnly>
        <TargetingMap
          :method="wizard.campaign.targeting.method"
          :departments="wizard.campaign.targeting.departments"
          :postcodes="wizard.campaign.targeting.postcodes"
          :address="wizard.campaign.targeting.address"
          :lat="wizard.campaign.targeting.lat"
          :lng="wizard.campaign.targeting.lng"
          :radius="wizard.campaign.targeting.radius"
          @toggle-department="toggleDepartment"
        />
      </ClientOnly>
    </div>
  </div>
</template>
