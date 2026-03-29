<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { toast } from 'vue-sonner'
import { ArrowLeft } from 'lucide-vue-next'
import { usePartnerStore } from '@/stores/partner'
import { useAuthStore } from '@/stores/auth'
import AsyncCombobox from '@/components/shared/AsyncCombobox.vue'

definePageMeta({
  middleware: ['role-guard'],
  requiredPermissions: ['manage demandes'],
  layout: 'default',
})

const { t } = useI18n()
const router = useRouter()
const { scopedRoute } = useScopedNavigation()
const { $api } = useNuxtApp()
const auth = useAuthStore()
const partnerStore = usePartnerStore()

const isSubmitting = ref(false)
const errors = ref<Record<string, string[]>>({})

// Admins (non-partner-bound) see the partner selector; partner-bound users don't
const isAdmin = computed(() => !auth.isPartnerBound)

const form = reactive({
  ref_client: '',
  information: '',
  is_exoneration: false,
  pays_id: '' as string,
  partner_id: partnerStore.effectivePartnerId as number | null,
  commercial_id: null as number | null,
  sdr_id: null as number | null,
})

// --- Async search functions for comboboxes ---
async function searchPartners(query: string) {
  const { data } = await ($api as any).GET('/partners', {
    params: { query: { 'filter[name]': query, per_page: 10 } },
  })
  return (data?.data ?? []).map((p: any) => ({ id: p.id, label: p.name }))
}

async function searchUsers(query: string) {
  const { data } = await ($api as any).GET('/users', {
    params: { query: { 'filter[search]': query, per_page: 10 } },
  })
  return (data?.data ?? []).map((u: any) => ({ id: u.id, label: u.full_name }))
}

// Basic client-side validation
const canSubmit = computed(() => {
  if (isAdmin.value && !form.partner_id) return false
  if (form.pays_id && form.pays_id.length !== 2) return false
  return true
})

function fieldError(field: string): string | undefined {
  return errors.value[field]?.[0]
}

async function onSubmit() {
  if (!canSubmit.value) return
  isSubmitting.value = true
  errors.value = {}
  try {
    const body: Record<string, unknown> = { ...form }
    // Strip empty optional strings so the API receives null
    if (!body.pays_id) delete body.pays_id
    if (!body.ref_client) delete body.ref_client
    if (!body.information) delete body.information

    const { data, error } = await ($api as any).POST('/demandes', { body })
    if (error) {
      if (error.errors) errors.value = error.errors
      return
    }
    toast.success(t('demandes.create.success'))
    router.push(scopedRoute(`/demandes/${data.data.id}`))
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <NuxtLink
        :to="scopedRoute('/demandes')"
        class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft class="size-4" />
        {{ t('demandes.list.title') }}
      </NuxtLink>
    </div>

    <div>
      <h1 class="text-2xl font-semibold tracking-tight">
        {{ t('demandes.create.title') }}
      </h1>
    </div>

    <!-- Form -->
    <form data-testid="create-form" class="space-y-8" @submit.prevent="onSubmit">
      <!-- Section: General information -->
      <Card>
        <CardHeader class="pb-4">
          <CardTitle class="text-base font-medium">
            {{ t('demandes.create.sections.general') }}
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-5">
          <!-- ref_client -->
          <div class="space-y-1.5">
            <Label for="ref_client">{{ t('demandes.create.fields.ref_client') }}</Label>
            <Input
              id="ref_client"
              v-model="form.ref_client"
              data-testid="ref-client-input"
              type="text"
              maxlength="100"
              :placeholder="t('demandes.create.fields.ref_client_placeholder')"
            />
            <p class="text-xs text-muted-foreground">
              {{ t('demandes.create.fields.ref_client_hint') }}
            </p>
            <p v-if="fieldError('ref_client')" class="text-sm text-destructive">
              {{ fieldError('ref_client') }}
            </p>
          </div>

          <!-- information -->
          <div class="space-y-1.5">
            <Label for="information">{{ t('demandes.create.fields.information') }}</Label>
            <Textarea
              id="information"
              v-model="form.information"
              data-testid="information-textarea"
              :placeholder="t('demandes.create.fields.information_placeholder')"
              rows="4"
            />
            <p class="text-xs text-muted-foreground">
              {{ t('demandes.create.fields.information_hint') }}
            </p>
            <p v-if="fieldError('information')" class="text-sm text-destructive">
              {{ fieldError('information') }}
            </p>
          </div>

          <!-- pays_id -->
          <div class="space-y-1.5">
            <Label for="pays_id">{{ t('demandes.create.fields.pays_id') }}</Label>
            <Input
              id="pays_id"
              v-model="form.pays_id"
              data-testid="pays-id-input"
              type="text"
              maxlength="2"
              class="max-w-[120px] uppercase"
              :placeholder="t('demandes.create.fields.pays_id_placeholder')"
            />
            <p class="text-xs text-muted-foreground">
              {{ t('demandes.create.fields.pays_id_hint') }}
            </p>
            <p v-if="fieldError('pays_id')" class="text-sm text-destructive">
              {{ fieldError('pays_id') }}
            </p>
          </div>
        </CardContent>
      </Card>

      <!-- Section: Assignment (partner + commercial + sdr) -->
      <Card>
        <CardHeader class="pb-4">
          <CardTitle class="text-base font-medium">
            {{ t('demandes.create.sections.assignment') }}
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-5">
          <!-- partner_id — admin only -->
          <div v-if="isAdmin" class="space-y-1.5" data-testid="partner-field">
            <Label>
              {{ t('demandes.create.fields.partner') }}
              <span class="text-destructive">*</span>
            </Label>
            <AsyncCombobox
              :model-value="form.partner_id"
              :search-fn="searchPartners"
              :placeholder="t('demandes.create.fields.partner_placeholder')"
              data-testid="partner-id-combobox"
              @update:model-value="(v) => form.partner_id = v"
            />
            <p class="text-xs text-muted-foreground">
              {{ t('demandes.create.fields.partner_hint') }}
            </p>
            <p v-if="fieldError('partner_id')" class="text-sm text-destructive">
              {{ fieldError('partner_id') }}
            </p>
          </div>

          <!-- commercial_id + sdr_id side by side -->
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label>{{ t('demandes.create.fields.commercial') }}</Label>
              <AsyncCombobox
                :model-value="form.commercial_id"
                :search-fn="searchUsers"
                :placeholder="t('demandes.create.fields.commercial_placeholder')"
                data-testid="commercial-id-combobox"
                @update:model-value="(v) => form.commercial_id = v"
              />
              <p class="text-xs text-muted-foreground">
                {{ t('demandes.create.fields.commercial_hint') }}
              </p>
              <p v-if="fieldError('commercial_id')" class="text-sm text-destructive">
                {{ fieldError('commercial_id') }}
              </p>
            </div>

            <div class="space-y-1.5">
              <Label>{{ t('demandes.create.fields.sdr') }}</Label>
              <AsyncCombobox
                :model-value="form.sdr_id"
                :search-fn="searchUsers"
                :placeholder="t('demandes.create.fields.sdr_placeholder')"
                data-testid="sdr-id-combobox"
                @update:model-value="(v) => form.sdr_id = v"
              />
              <p class="text-xs text-muted-foreground">
                {{ t('demandes.create.fields.sdr_hint') }}
              </p>
              <p v-if="fieldError('sdr_id')" class="text-sm text-destructive">
                {{ fieldError('sdr_id') }}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Section: Options -->
      <Card>
        <CardHeader class="pb-4">
          <CardTitle class="text-base font-medium">
            {{ t('demandes.create.sections.options') }}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="flex items-start gap-3">
            <Switch
              id="is_exoneration"
              :checked="form.is_exoneration"
              data-testid="exoneration-switch"
              @update:checked="(v: boolean) => form.is_exoneration = v"
            />
            <div>
              <Label for="is_exoneration" class="cursor-pointer">
                {{ t('demandes.create.fields.is_exoneration') }}
              </Label>
              <p class="text-xs text-muted-foreground mt-0.5">
                {{ t('demandes.create.fields.is_exoneration_hint') }}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3 pt-2">
        <NuxtLink :to="scopedRoute('/demandes')">
          <Button type="button" variant="outline" data-testid="cancel-button">
            {{ t('demandes.create.cancel') }}
          </Button>
        </NuxtLink>
        <Button
          type="submit"
          data-testid="submit-button"
          :disabled="isSubmitting || !canSubmit"
        >
          {{ isSubmitting ? t('demandes.create.submitting') : t('demandes.create.submit') }}
        </Button>
      </div>
    </form>
  </div>
</template>
