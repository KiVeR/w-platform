<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { MapPin, Hash, Navigation, Building2, Layers, Check } from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import DemographicsSelector from '@/components/campaigns/wizard/DemographicsSelector.vue'
import SeasonalBanner from '@/components/campaigns/wizard/SeasonalBanner.vue'
import SectorNudge from '@/components/campaigns/wizard/SectorNudge.vue'
import SavedZones from '@/components/campaigns/wizard/SavedZones.vue'
import { useCampaignWizardStore } from '@/stores/campaignWizard'
import { usePartnerShops } from '@/composables/usePartnerShops'
import { usePartnerStore } from '@/stores/partner'
import { useTargetingNudges, type TargetingNudge } from '@/composables/useTargetingNudges'
import { SECTOR_CONFIGS } from '@/data/sector-nudges'
import { useExpertMode } from '@/composables/useExpertMode'
import { useApi } from '@/composables/useApi'
import type { CampaignTargeting, TargetingMethod } from '@/types/campaign'

const wizard = useCampaignWizardStore()
const partnerStore = usePartnerStore()
const { primaryShop, fetchShops } = usePartnerShops()
const { effectiveMode, setMode, detect, isExpert } = useExpertMode()
const { t } = useI18n()
const api = useApi()

const partnerActivityType = ref<string | null>(null)
const { nudges: sectorNudges } = useTargetingNudges(
  partnerActivityType,
  computed(() => wizard.campaign.targeting),
)

const { communeGeoJson } = useCommuneBoundaries(
  computed(() => wizard.campaign.targeting.postcodes),
)

const isSmartMode = computed({
  get: () => effectiveMode.value === 'smart',
  set: (val: boolean) => setMode(val ? 'smart' : 'classic'),
})

onMounted(() => {
  detect()
})

watch(() => partnerStore.effectivePartnerId, async (id) => {
  if (id) {
    fetchShops(id)
    const { data, error } = await api.GET('/partners/{partner}', {
      params: { path: { partner: id } },
    } as never)
    if (!error && data) {
      const raw = (data as { data: { activity_type: string | null } }).data
      partnerActivityType.value = raw.activity_type
    }
  }
}, { immediate: true })

const shopLabel = computed(() => {
  const shop = primaryShop.value
  if (!shop) return ''
  return [shop.address, shop.city].filter(Boolean).join(', ')
})

const shopCenter = computed<[number, number] | undefined>(() => {
  const shop = primaryShop.value
  if (!shop?.latitude || !shop?.longitude) return undefined
  return [shop.latitude, shop.longitude]
})

function applyShopLocation(): void {
  const shop = primaryShop.value
  if (!shop?.latitude || !shop?.longitude) return
  wizard.campaign.targeting.method = 'address'
  wizard.campaign.targeting.address = shopLabel.value
  wizard.campaign.targeting.lat = shop.latitude
  wizard.campaign.targeting.lng = shop.longitude
  wizard.campaign.targeting.radius = 3
  wizard.isDirty = true
}

const baseMethods: { key: TargetingMethod, icon: typeof MapPin }[] = [
  { key: 'postcode', icon: Hash },
  { key: 'commune', icon: Building2 },
  { key: 'department', icon: MapPin },
  { key: 'address', icon: Navigation },
]

const methods = computed(() => {
  if (isExpert.value) {
    return [...baseMethods, { key: 'iris' as TargetingMethod, icon: Layers }]
  }
  return baseMethods
})

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

// SmartSearch selection handler
function handleSmartSelect(result: SmartSearchResult): void {
  if (result.type === 'department' && result.departmentCode) {
    wizard.campaign.targeting.method = 'department'
    if (!wizard.campaign.targeting.departments.includes(result.departmentCode)) {
      wizard.campaign.targeting.departments.push(result.departmentCode)
    }
    // Clear address fields when switching to department
    wizard.campaign.targeting.address = null
    wizard.campaign.targeting.lat = null
    wizard.campaign.targeting.lng = null
    wizard.campaign.targeting.postcodes = []
  }
  else if (result.type === 'postcode' && result.postcode) {
    wizard.campaign.targeting.method = 'postcode'
    if (!wizard.campaign.targeting.postcodes.includes(result.postcode)) {
      wizard.campaign.targeting.postcodes.push(result.postcode)
    }
    // Clear address and department fields
    wizard.campaign.targeting.address = null
    wizard.campaign.targeting.lat = null
    wizard.campaign.targeting.lng = null
    wizard.campaign.targeting.departments = []
  }
  else if (result.type === 'address' && result.lat != null && result.lng != null) {
    wizard.campaign.targeting.method = 'address'
    wizard.campaign.targeting.address = result.label
    wizard.campaign.targeting.lat = result.lat
    wizard.campaign.targeting.lng = result.lng
    wizard.campaign.targeting.radius = wizard.campaign.targeting.radius ?? 3
    // Clear department and postcode fields
    wizard.campaign.targeting.departments = []
    wizard.campaign.targeting.postcodes = []
  }
  wizard.isDirty = true
}

function removeDepartment(code: string): void {
  const idx = wizard.campaign.targeting.departments.indexOf(code)
  if (idx >= 0) wizard.campaign.targeting.departments.splice(idx, 1)
  wizard.isDirty = true
}

function removePostcode(code: string): void {
  const idx = wizard.campaign.targeting.postcodes.indexOf(code)
  if (idx >= 0) wizard.campaign.targeting.postcodes.splice(idx, 1)
  wizard.isDirty = true
}

function clearAddress(): void {
  wizard.campaign.targeting.address = null
  wizard.campaign.targeting.lat = null
  wizard.campaign.targeting.lng = null
  wizard.isDirty = true
}

function handleTemplateSelect(targeting: CampaignTargeting): void {
  wizard.campaign.targeting = { ...targeting }
  wizard.isDirty = true
  wizard.requestEstimate()
}

function handleSectorNudge(nudge: TargetingNudge): void {
  const config = SECTOR_CONFIGS[partnerActivityType.value ?? '']
  if (!config) return

  if (nudge.type === 'radius' && config.radiusHint) {
    wizard.campaign.targeting.radius = config.radiusHint[1]
  }
  else if (nudge.type === 'age' && config.ageHint) {
    wizard.campaign.targeting.age_min = config.ageHint[0]
    wizard.campaign.targeting.age_max = config.ageHint[1]
  }
  else if (nudge.type === 'gender' && config.genderHint) {
    wizard.campaign.targeting.gender = config.genderHint
  }
  wizard.isDirty = true
}
</script>

<template>
  <div class="space-y-6">
    <!-- Seasonal banner -->
    <SeasonalBanner />

    <!-- Saved zones / templates -->
    <SavedZones :activity-type="partnerActivityType" @select="handleTemplateSelect" />

    <!-- Header with mode toggle -->
    <div class="flex items-start justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold">{{ t('wizard.estimate.stepTitle') }}</h2>
        <p class="mt-1 text-sm text-muted-foreground">{{ t('wizard.estimate.stepDescription') }}</p>
      </div>
      <div class="flex shrink-0 items-center gap-2" data-targeting-mode-toggle>
        <span class="text-xs text-muted-foreground">
          {{ isSmartMode ? t('wizard.targeting.modeToggle.smart') : t('wizard.targeting.modeToggle.classic') }}
        </span>
        <Switch v-model="isSmartMode" />
      </div>
    </div>

    <!-- My shop button (both modes) -->
    <Button
      v-if="shopCenter"
      variant="outline"
      class="w-full justify-start gap-2 border-primary/20 hover:bg-primary/5"
      data-my-shop-button
      @click="applyShopLocation"
    >
      <MapPin class="size-4 text-primary" />
      <span class="truncate">{{ shopLabel }}</span>
    </Button>

    <!-- ===== SMART MODE ===== -->
    <template v-if="isSmartMode">
      <SmartSearch
        :departments="wizard.campaign.targeting.departments"
        :postcodes="wizard.campaign.targeting.postcodes"
        :address="wizard.campaign.targeting.address"
        :lat="wizard.campaign.targeting.lat"
        :lng="wizard.campaign.targeting.lng"
        :radius="wizard.campaign.targeting.radius"
        @select="handleSmartSelect"
        @remove-department="removeDepartment"
        @remove-postcode="removePostcode"
        @clear-address="clearAddress"
        @update:radius="v => { wizard.campaign.targeting.radius = v; wizard.isDirty = true }"
      />
    </template>

    <!-- ===== CLASSIC MODE ===== -->
    <template v-else>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <p class="mt-1 text-xs text-muted-foreground" data-method-hint>
              {{ t(`wizard.targeting.methods.${m.key}.hint`) }}
            </p>
          </CardHeader>
        </Card>
      </div>
    </template>

    <!-- Carte (both modes) -->
    <ClientOnly>
      <TargetingMap
        :method="wizard.campaign.targeting.method"
        :departments="wizard.campaign.targeting.departments"
        :postcodes="wizard.campaign.targeting.postcodes"
        :address="wizard.campaign.targeting.address"
        :lat="wizard.campaign.targeting.lat"
        :lng="wizard.campaign.targeting.lng"
        :radius="wizard.campaign.targeting.radius"
        :default-center="shopCenter"
        :default-zoom="9"
        :commune-geo-json="communeGeoJson"
        class="h-105!"
        @toggle-department="toggleDepartment"
      />
    </ClientOnly>

    <!-- Selecteur en dessous (classic mode only) -->
    <div v-if="!isSmartMode">
      <DepartmentSelector
        v-if="wizard.campaign.targeting.method === 'department'"
        v-model="wizard.campaign.targeting.departments"
      />
      <PostcodeSelector
        v-if="wizard.campaign.targeting.method === 'postcode'"
        v-model="wizard.campaign.targeting.postcodes"
      />
      <CommuneSelector
        v-if="wizard.campaign.targeting.method === 'commune'"
        v-model="wizard.campaign.targeting.communes"
      />
      <IrisSelector
        v-if="wizard.campaign.targeting.method === 'iris'"
        v-model="wizard.campaign.targeting.iris_codes"
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

    <!-- Demographics inline (both modes) -->
    <DemographicsSelector v-model="wizard.campaign.targeting" />

    <!-- Sector nudges -->
    <SectorNudge
      v-if="sectorNudges.length > 0"
      :nudges="sectorNudges"
      @apply="handleSectorNudge"
    />
  </div>
</template>
