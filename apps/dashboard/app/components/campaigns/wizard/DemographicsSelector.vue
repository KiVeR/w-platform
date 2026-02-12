<script setup lang="ts">
import { computed } from 'vue'
import { Users, UserRound } from 'lucide-vue-next'
import type { CampaignTargeting, Gender } from '@/types/campaign'

const { t } = useI18n()

const props = defineProps<{
  modelValue: CampaignTargeting
}>()

const emit = defineEmits<{
  'update:modelValue': [value: CampaignTargeting]
}>()

const genderOptions: { key: Gender, labelKey: string, icon: typeof Users }[] = [
  { key: null, labelKey: 'wizard.targeting.demographics.genderMixed', icon: Users },
  { key: 'M', labelKey: 'wizard.targeting.demographics.genderMale', icon: UserRound },
  { key: 'F', labelKey: 'wizard.targeting.demographics.genderFemale', icon: UserRound },
]

function selectGender(gender: Gender) {
  emit('update:modelValue', { ...props.modelValue, gender })
}

const ageRange = computed({
  get: () => [props.modelValue.age_min ?? 18, props.modelValue.age_max ?? 100],
  set: (val: number[]) => {
    const isDefault = val[0] === 18 && val[1] === 100
    emit('update:modelValue', {
      ...props.modelValue,
      age_min: isDefault ? null : val[0],
      age_max: isDefault ? null : val[1],
    })
  },
})

const ageLabel = computed(() => {
  const [min, max] = ageRange.value
  if (min === 18 && max === 100) return t('wizard.targeting.demographics.allAges')
  return `${min} – ${max} ${t('wizard.targeting.demographics.ageLabel')}`
})
</script>

<template>
  <div class="space-y-3" data-demographics-selector>
    <!-- Gender toggle group -->
    <div class="flex items-center gap-4">
      <span class="shrink-0 text-xs font-medium text-muted-foreground">
        {{ t('wizard.targeting.demographics.genderLabel') }}
      </span>
      <div class="inline-flex rounded-lg border p-0.5" data-gender-group>
        <button
          v-for="opt in genderOptions"
          :key="String(opt.key)"
          type="button"
          data-gender-button
          :data-selected="modelValue.gender === opt.key ? 'true' : 'false'"
          class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
          :class="modelValue.gender === opt.key
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'"
          @click="selectGender(opt.key)"
        >
          <component :is="opt.icon" class="size-3.5" />
          {{ t(opt.labelKey) }}
        </button>
      </div>
    </div>

    <!-- Age range slider -->
    <div class="flex items-center gap-4">
      <span class="shrink-0 text-xs font-medium text-muted-foreground">
        {{ t('wizard.targeting.demographics.ageRangeLabel') }}
      </span>
      <div class="flex flex-1 items-center gap-3">
        <Slider
          v-model="ageRange"
          :min="18"
          :max="100"
          :step="1"
          class="flex-1"
          data-age-slider
        />
        <span class="w-24 shrink-0 text-right text-xs tabular-nums text-muted-foreground" data-age-label>
          {{ ageLabel }}
        </span>
      </div>
    </div>
  </div>
</template>
