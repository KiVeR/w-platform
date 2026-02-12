<script setup lang="ts">
import { ref } from 'vue'
import { MapPin, Hash, Navigation, Check, BarChart3, RefreshCw, Loader2 } from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import DemographicsSelector from '@/components/campaigns/wizard/DemographicsSelector.vue'
import { useCampaignWizardStore } from '@/stores/campaignWizard'
import type { TargetingMethod } from '@/types/campaign'

const wizard = useCampaignWizardStore()
const { t } = useI18n()

const isCounting = ref(false)

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

async function handleCount() {
  isCounting.value = true
  try { await wizard.requestEstimate() }
  finally { isCounting.value = false }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-lg font-semibold">{{ t('wizard.estimate.stepTitle') }}</h2>
      <p class="mt-1 text-sm text-muted-foreground">{{ t('wizard.estimate.stepDescription') }}</p>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
      <Card
        v-for="m in methods"
        :key="m.key"
        data-method-card
        class="cursor-pointer transition-all duration-200"
        :class="wizard.campaign.targeting.method === m.key
          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
          : 'hover:border-primary/50 hover:scale-[1.02] hover:shadow-md'"
        @click="selectMethod(m.key)"
      >
        <CardHeader>
          <div class="flex items-center justify-between">
            <div class="flex size-10 items-center justify-center rounded-full bg-primary/10">
              <component :is="m.icon" class="size-5 text-primary" />
            </div>
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

    <!-- Carte en premier (proeminente) -->
    <ClientOnly>
      <TargetingMap
        :method="wizard.campaign.targeting.method"
        :departments="wizard.campaign.targeting.departments"
        :postcodes="wizard.campaign.targeting.postcodes"
        :address="wizard.campaign.targeting.address"
        :lat="wizard.campaign.targeting.lat"
        :lng="wizard.campaign.targeting.lng"
        :radius="wizard.campaign.targeting.radius"
        class="h-105!"
        @toggle-department="toggleDepartment"
      />
    </ClientOnly>

    <!-- Selecteur en dessous -->
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
        @update:address="v => { wizard.campaign.targeting.address = v; wizard.isDirty = true }"
        @update:lat="v => { wizard.campaign.targeting.lat = v; wizard.isDirty = true }"
        @update:lng="v => { wizard.campaign.targeting.lng = v; wizard.isDirty = true }"
        @update:radius="v => { wizard.campaign.targeting.radius = v; wizard.isDirty = true }"
      />
    </div>

    <Separator />

    <DemographicsSelector v-model="wizard.campaign.targeting" />

    <!-- Section estimation inline -->
    <Separator />

    <!-- Loading state -->
    <div v-if="isCounting && !wizard.estimate" class="flex flex-col items-center gap-3 py-6 text-center" data-counting-state>
      <Loader2 class="size-6 animate-spin text-primary" />
      <p class="text-sm text-muted-foreground">{{ t('wizard.estimate.calculating') }}</p>
    </div>

    <!-- Results -->
    <Card v-else-if="wizard.estimate" class="border-primary/20 bg-primary/3" data-estimate-result>
      <CardHeader class="flex-row items-center justify-between space-y-0 pb-2">
        <div class="flex items-center gap-2">
          <BarChart3 class="size-4 text-primary" />
          <CardTitle class="text-sm font-semibold text-primary">{{ t('wizard.estimate.resultTitle') }}</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          :disabled="isCounting"
          data-recalculate-button
          @click="handleCount"
        >
          <RefreshCw class="size-3" :class="isCounting ? 'animate-spin' : ''" />
          <span class="ml-1">{{ t('wizard.estimate.recalculate') }}</span>
        </Button>
      </CardHeader>
      <CardContent>
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted-foreground">{{ t('wizard.estimate.volume') }}</span>
          <span class="text-lg font-semibold" data-volume>
            {{ wizard.estimate.volume.toLocaleString('fr-FR') }} {{ t('wizard.estimate.recipients') }}
          </span>
        </div>
        <div class="mt-1 flex items-center justify-between text-sm">
          <span class="text-muted-foreground">{{ t('wizard.estimate.smsCount') }}</span>
          <span class="font-medium" data-sms-count>{{ wizard.estimate.smsCount }} SMS/dest.</span>
        </div>
      </CardContent>
    </Card>

    <!-- Empty state: Count button -->
    <div v-else class="flex flex-col items-center gap-3 py-4 text-center" data-estimate-empty>
      <p class="text-sm text-muted-foreground">{{ t('wizard.estimate.notAvailable') }}</p>
      <Button
        :disabled="isCounting"
        data-count-button
        @click="handleCount"
      >
        <BarChart3 class="size-4" />
        {{ t('wizard.estimate.calculateButton') }}
      </Button>
    </div>
  </div>
</template>
