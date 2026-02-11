<script setup lang="ts">
import { Users, UserRound } from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
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

function updateAgeMin(value: string) {
  const num = value ? Number(value) : null
  emit('update:modelValue', { ...props.modelValue, age_min: num })
}

function updateAgeMax(value: string) {
  const num = value ? Number(value) : null
  emit('update:modelValue', { ...props.modelValue, age_max: num })
}
</script>

<template>
  <div class="space-y-4">
    <h3 class="text-sm font-medium">{{ t('wizard.targeting.demographics.title') }}</h3>

    <div class="grid gap-3 sm:grid-cols-3">
      <Card
        v-for="opt in genderOptions"
        :key="String(opt.key)"
        data-gender-card
        :data-selected="modelValue.gender === opt.key ? 'true' : 'false'"
        class="cursor-pointer transition-all duration-200"
        :class="modelValue.gender === opt.key
          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
          : 'hover:border-primary/50'"
        @click="selectGender(opt.key)"
      >
        <CardHeader class="p-3">
          <div class="flex items-center gap-2">
            <component :is="opt.icon" class="size-4 text-primary" />
            <CardTitle class="text-sm">{{ t(opt.labelKey) }}</CardTitle>
          </div>
        </CardHeader>
      </Card>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <Label>{{ t('wizard.targeting.demographics.ageMin') }}</Label>
        <Input
          type="number"
          :min="18"
          :max="100"
          :placeholder="t('wizard.targeting.demographics.ageMin')"
          :model-value="modelValue.age_min ?? ''"
          @update:model-value="updateAgeMin($event as string)"
        />
      </div>
      <div>
        <Label>{{ t('wizard.targeting.demographics.ageMax') }}</Label>
        <Input
          type="number"
          :min="18"
          :max="100"
          :placeholder="t('wizard.targeting.demographics.ageMax')"
          :model-value="modelValue.age_max ?? ''"
          @update:model-value="updateAgeMax($event as string)"
        />
      </div>
    </div>
  </div>
</template>
