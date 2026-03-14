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
  get: (): number[] => [props.modelValue.age_min ?? 18, props.modelValue.age_max ?? 100],
  set: (value: number[]) => {
    const [min = 18, max = 100] = value
    const isDefault = min === 18 && max === 100
    emit('update:modelValue', {
      ...props.modelValue,
      age_min: isDefault ? null : min,
      age_max: isDefault ? null : max,
    })
  },
})

const ageLabel = computed(() => {
  const [min, max] = ageRange.value
  if (min === 18 && max === 100) return t('wizard.targeting.demographics.allAges')
  return `${min} – ${max} ${t('wizard.targeting.demographics.ageLabel')}`
})

const agePresets = [
  { labelKey: 'wizard.targeting.demographics.preset.18_25', min: 18, max: 25 },
  { labelKey: 'wizard.targeting.demographics.preset.25_45', min: 25, max: 45 },
  { labelKey: 'wizard.targeting.demographics.preset.45_65', min: 45, max: 65 },
  { labelKey: 'wizard.targeting.demographics.preset.65plus', min: 65, max: 100 },
  { labelKey: 'wizard.targeting.demographics.preset.all', min: 18, max: 100 },
] as const

function isPresetActive(preset: typeof agePresets[number]) {
  return ageRange.value[0] === preset.min && ageRange.value[1] === preset.max
}

function applyPreset(preset: typeof agePresets[number]) {
  emit('update:modelValue', {
    ...props.modelValue,
    age_min: preset.min === 18 && preset.max === 100 ? null : preset.min,
    age_max: preset.min === 18 && preset.max === 100 ? null : preset.max,
  })
}
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
    <div class="space-y-2">
      <div class="flex items-center gap-4">
        <span class="shrink-0 text-xs font-medium text-muted-foreground">
          {{ t('wizard.targeting.demographics.ageRangeLabel') }}
        </span>
        <div class="flex flex-1 items-center gap-3">
          <span class="text-xs tabular-nums text-muted-foreground" data-age-min-label>18</span>
          <Slider
            v-model="ageRange"
            :min="18"
            :max="100"
            :step="1"
            :min-steps-between-thumbs="1"
            class="flex-1"
            data-age-slider
          />
          <span class="text-xs tabular-nums text-muted-foreground" data-age-max-label>100</span>
          <span class="w-24 shrink-0 text-right text-xs tabular-nums text-muted-foreground" data-age-label>
            {{ ageLabel }}
          </span>
        </div>
      </div>

      <!-- Age presets -->
      <div class="flex flex-wrap gap-1.5 pl-[calc(theme(spacing.4)+theme(spacing.4))]" data-age-presets>
        <button
          v-for="preset in agePresets"
          :key="preset.labelKey"
          type="button"
          data-age-preset
          :data-preset-active="isPresetActive(preset) ? 'true' : 'false'"
          class="rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors"
          :class="isPresetActive(preset)
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:text-foreground'"
          @click="applyPreset(preset)"
        >
          {{ t(preset.labelKey) }}
        </button>
      </div>
    </div>
  </div>
</template>
