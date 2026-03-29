<script setup lang="ts">
import { ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PartnerFormData } from '@/types/partner'

const props = defineProps<{
  initialData?: PartnerFormData & { id?: number }
  isSaving: boolean
  mode: 'create' | 'edit'
}>()

const emit = defineEmits<{
  submit: [data: PartnerFormData]
  cancel: []
}>()

const { t } = useI18n()

const form = ref<PartnerFormData>({
  name: '',
  code: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  zip_code: '',
  activity_type: '',
  is_active: true,
  billing_mode: 'prepaid',
})

watch(
  () => props.initialData,
  (data) => {
    if (data) {
      form.value = {
        name: data.name ?? '',
        code: data.code ?? '',
        email: data.email ?? '',
        phone: data.phone ?? '',
        address: data.address ?? '',
        city: data.city ?? '',
        zip_code: data.zip_code ?? '',
        activity_type: data.activity_type ?? '',
        is_active: data.is_active ?? true,
        billing_mode: data.billing_mode ?? 'prepaid',
      }
    }
  },
  { immediate: true },
)

function handleSubmit() {
  emit('submit', { ...form.value })
}
</script>

<template>
  <form data-partner-form @submit.prevent="handleSubmit">
    <Card>
      <CardHeader>
        <CardTitle>
          {{ mode === 'create' ? t('hub.partnerForm.titleCreate') : t('hub.partnerForm.titleEdit') }}
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="name">{{ t('hub.partnerForm.name') }}</Label>
            <Input
              id="name"
              v-model="form.name"
              data-field-name
              required
              :placeholder="t('hub.partnerForm.namePlaceholder')"
            />
          </div>

          <div class="space-y-2">
            <Label for="code">{{ t('hub.partnerForm.code') }}</Label>
            <Input
              id="code"
              v-model="form.code"
              data-field-code
              :placeholder="t('hub.partnerForm.codePlaceholder')"
            />
          </div>

          <div class="space-y-2">
            <Label for="email">{{ t('hub.partnerForm.email') }}</Label>
            <Input
              id="email"
              v-model="form.email"
              type="email"
              data-field-email
              :placeholder="t('hub.partnerForm.emailPlaceholder')"
            />
          </div>

          <div class="space-y-2">
            <Label for="phone">{{ t('hub.partnerForm.phone') }}</Label>
            <Input
              id="phone"
              v-model="form.phone"
              data-field-phone
              :placeholder="t('hub.partnerForm.phonePlaceholder')"
            />
          </div>

          <div class="space-y-2">
            <Label for="address">{{ t('hub.partnerForm.address') }}</Label>
            <Input
              id="address"
              v-model="form.address"
              data-field-address
            />
          </div>

          <div class="space-y-2">
            <Label for="city">{{ t('hub.partnerForm.city') }}</Label>
            <Input
              id="city"
              v-model="form.city"
              data-field-city
            />
          </div>

          <div class="space-y-2">
            <Label for="zip_code">{{ t('hub.partnerForm.zipCode') }}</Label>
            <Input
              id="zip_code"
              v-model="form.zip_code"
              data-field-zip-code
            />
          </div>

          <div class="space-y-2">
            <Label for="activity_type">{{ t('hub.partnerForm.activityType') }}</Label>
            <Input
              id="activity_type"
              v-model="form.activity_type"
              data-field-activity-type
            />
          </div>

          <div class="space-y-2">
            <Label for="billing_mode">{{ t('hub.partnerForm.billingMode') }}</Label>
            <Input
              id="billing_mode"
              v-model="form.billing_mode"
              data-field-billing-mode
            />
          </div>
        </div>

        <div class="flex items-center gap-3 pt-2">
          <Switch
            :checked="form.is_active"
            data-field-is-active
            @update:checked="form.is_active = $event"
          />
          <Label>{{ t('hub.partnerForm.isActive') }}</Label>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            data-cancel-btn
            @click="emit('cancel')"
          >
            {{ t('hub.partnerForm.cancel') }}
          </Button>
          <Button
            type="submit"
            data-submit-btn
            :disabled="isSaving || !form.name"
          >
            {{ isSaving ? t('hub.partnerForm.saving') : t('hub.partnerForm.save') }}
          </Button>
        </div>
      </CardContent>
    </Card>
  </form>
</template>
