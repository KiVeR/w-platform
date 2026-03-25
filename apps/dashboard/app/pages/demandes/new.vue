<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { toast } from 'vue-sonner'
import { usePartnerStore } from '@/stores/partner'

definePageMeta({
  middleware: ['role-guard'],
  requiredPermissions: ['manage demandes'],
  layout: 'default',
})

const { t } = useI18n()
const router = useRouter()
const { $api } = useNuxtApp()
const partnerStore = usePartnerStore()

const isSubmitting = ref(false)
const errors = ref<Record<string, string[]>>({})

// If non-admin, effectivePartnerId is non-null (from auth.partnerId)
const isAdmin = computed(() => partnerStore.effectivePartnerId === null)

const form = reactive({
  ref_client: '',
  information: '',
  is_exoneration: false,
  partner_id: partnerStore.effectivePartnerId as number | null,
  commercial_id: null as number | null,
  sdr_id: null as number | null,
})

async function onSubmit() {
  isSubmitting.value = true
  errors.value = {}
  try {
    const { data, error } = await ($api as any).POST('/demandes', {
      body: form,
    })
    if (error) {
      if (error.errors) errors.value = error.errors
      return
    }
    toast.success(t('demandes.create.success'))
    router.push(`/demandes/${data.data.id}`)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <NuxtLink to="/demandes" class="text-sm text-muted-foreground hover:text-foreground">
        ← {{ t('demandes.list.title') }}
      </NuxtLink>
      <h1 class="text-2xl font-semibold tracking-tight">
        {{ t('demandes.create.title') }}
      </h1>
    </div>

    <!-- Form Card -->
    <Card>
      <CardContent class="pt-6">
        <form data-testid="create-form" class="space-y-4" @submit.prevent="onSubmit">
          <!-- ref_client -->
          <div class="space-y-1">
            <Label for="ref_client">{{ t('demandes.create.fields.ref_client') }}</Label>
            <Input
              id="ref_client"
              v-model="form.ref_client"
              data-testid="ref-client-input"
              type="text"
            />
            <p v-if="errors.ref_client" class="text-sm text-destructive">
              {{ errors.ref_client[0] }}
            </p>
          </div>

          <!-- information -->
          <div class="space-y-1">
            <Label for="information">{{ t('demandes.create.fields.information') }}</Label>
            <Textarea
              id="information"
              v-model="form.information"
              data-testid="information-textarea"
            />
            <p v-if="errors.information" class="text-sm text-destructive">
              {{ errors.information[0] }}
            </p>
          </div>

          <!-- is_exoneration -->
          <div class="flex items-center gap-3">
            <Switch
              id="is_exoneration"
              v-model="form.is_exoneration"
              data-testid="exoneration-switch"
            />
            <Label for="is_exoneration">{{ t('demandes.create.fields.is_exoneration') }}</Label>
          </div>

          <!-- partner_id — admin only -->
          <div v-if="isAdmin" class="space-y-1" data-testid="partner-field">
            <Label for="partner_id">{{ t('demandes.create.fields.partner') }}</Label>
            <Input
              id="partner_id"
              v-model.number="form.partner_id"
              data-testid="partner-id-input"
              type="number"
            />
            <p v-if="errors.partner_id" class="text-sm text-destructive">
              {{ errors.partner_id[0] }}
            </p>
          </div>

          <!-- commercial_id -->
          <div class="space-y-1">
            <Label for="commercial_id">{{ t('demandes.create.fields.commercial') }}</Label>
            <Input
              id="commercial_id"
              v-model.number="form.commercial_id"
              data-testid="commercial-id-input"
              type="number"
            />
            <p v-if="errors.commercial_id" class="text-sm text-destructive">
              {{ errors.commercial_id[0] }}
            </p>
          </div>

          <!-- sdr_id -->
          <div class="space-y-1">
            <Label for="sdr_id">{{ t('demandes.create.fields.sdr') }}</Label>
            <Input
              id="sdr_id"
              v-model.number="form.sdr_id"
              data-testid="sdr-id-input"
              type="number"
            />
            <p v-if="errors.sdr_id" class="text-sm text-destructive">
              {{ errors.sdr_id[0] }}
            </p>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              data-testid="submit-button"
              :disabled="isSubmitting"
            >
              {{ t('demandes.create.submit') }}
            </Button>
            <NuxtLink to="/demandes">
              <Button type="button" variant="ghost" data-testid="cancel-button">
                {{ t('demandes.create.cancel') }}
              </Button>
            </NuxtLink>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
