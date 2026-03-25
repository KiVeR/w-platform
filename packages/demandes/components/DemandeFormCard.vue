<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { DemandeDetail } from '#demandes/types/demandes'

const props = defineProps<{
  demande: DemandeDetail
}>()

const emit = defineEmits<{
  updated: []
}>()

const { t } = useI18n()
const { $api } = useNuxtApp()

const isEditing = ref(false)
const isSaving = ref(false)

const form = reactive({
  ref_client: '',
  information: '',
  is_exoneration: false,
})

function startEdit() {
  form.ref_client = props.demande.ref_client ?? ''
  form.information = props.demande.information ?? ''
  form.is_exoneration = props.demande.is_exoneration
  isEditing.value = true
}

function cancelEdit() {
  isEditing.value = false
}

async function saveEdit() {
  isSaving.value = true
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await ($api as any).PUT('/demandes/{id}', {
      params: { path: { id: props.demande.id } },
      body: form,
    })
    if (!error) {
      isEditing.value = false
      emit('updated')
    }
  }
  finally {
    isSaving.value = false
  }
}

function progressPercent(): number {
  if (props.demande.operations_count === 0) return 0
  return Math.round((props.demande.operations_completed_count / props.demande.operations_count) * 100)
}
</script>

<template>
  <Card data-testid="demande-form-card">
    <CardHeader class="pb-3">
      <div class="flex items-center justify-between">
        <CardTitle class="text-base">{{ t('demandes.detail.tabs.overview') }}</CardTitle>
        <Button
          v-if="!isEditing"
          size="sm"
          variant="outline"
          data-testid="edit-button"
          @click="startEdit"
        >
          {{ t('demandes.form.edit') }}
        </Button>
      </div>
    </CardHeader>

    <CardContent class="space-y-4">
      <!-- ref_demande — readonly -->
      <div class="space-y-1">
        <p class="text-xs text-muted-foreground font-medium">{{ t('demandes.form.fields.ref_demande') }}</p>
        <p class="text-sm font-mono font-medium" data-testid="ref-demande">{{ demande.ref_demande }}</p>
      </div>

      <!-- partner — readonly -->
      <div class="space-y-1">
        <p class="text-xs text-muted-foreground font-medium">{{ t('demandes.form.fields.partner') }}</p>
        <p class="text-sm" data-testid="partner-name">{{ demande.partner?.name ?? '—' }}</p>
      </div>

      <!-- ref_client -->
      <div class="space-y-1">
        <Label for="form-ref-client" class="text-xs text-muted-foreground font-medium">
          {{ t('demandes.form.fields.ref_client') }}
        </Label>
        <p v-if="!isEditing" class="text-sm" data-testid="ref-client">{{ demande.ref_client ?? '—' }}</p>
        <Input
          v-else
          id="form-ref-client"
          v-model="form.ref_client"
          data-testid="ref-client-input"
          type="text"
          class="h-8 text-sm"
        />
      </div>

      <!-- information -->
      <div class="space-y-1">
        <Label for="form-information" class="text-xs text-muted-foreground font-medium">
          {{ t('demandes.form.fields.information') }}
        </Label>
        <p v-if="!isEditing" class="text-sm whitespace-pre-wrap" data-testid="information">{{ demande.information ?? '—' }}</p>
        <Textarea
          v-else
          id="form-information"
          v-model="form.information"
          data-testid="information-textarea"
          class="text-sm min-h-[80px]"
        />
      </div>

      <!-- is_exoneration -->
      <div class="flex items-center gap-3">
        <template v-if="!isEditing">
          <span
            class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
            :class="demande.is_exoneration ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground'"
            data-testid="exoneration-badge"
          >
            {{ t('demandes.form.fields.is_exoneration') }}
            {{ demande.is_exoneration ? '✓' : '✗' }}
          </span>
        </template>
        <template v-else>
          <Switch
            id="form-is-exoneration"
            v-model="form.is_exoneration"
            data-testid="exoneration-switch"
          />
          <Label for="form-is-exoneration" class="text-sm">
            {{ t('demandes.form.fields.is_exoneration') }}
          </Label>
        </template>
      </div>

      <!-- commercial -->
      <div v-if="demande.commercial" class="space-y-1">
        <p class="text-xs text-muted-foreground font-medium">{{ t('demandes.form.fields.commercial') }}</p>
        <p class="text-sm" data-testid="commercial-name">{{ demande.commercial.full_name }}</p>
      </div>

      <!-- sdr -->
      <div v-if="demande.sdr" class="space-y-1">
        <p class="text-xs text-muted-foreground font-medium">{{ t('demandes.form.fields.sdr') }}</p>
        <p class="text-sm" data-testid="sdr-name">{{ demande.sdr.full_name }}</p>
      </div>

      <!-- Edit actions -->
      <div v-if="isEditing" class="flex items-center gap-2 pt-2">
        <Button
          size="sm"
          :disabled="isSaving"
          data-testid="save-button"
          @click="saveEdit"
        >
          {{ isSaving ? t('demandes.form.saving') : t('demandes.form.save') }}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          :disabled="isSaving"
          data-testid="cancel-button"
          @click="cancelEdit"
        >
          {{ t('demandes.form.cancel') }}
        </Button>
      </div>
    </CardContent>

    <!-- Progress footer -->
    <CardFooter class="pt-0">
      <div class="w-full space-y-1">
        <div class="flex items-center justify-between text-xs text-muted-foreground">
          <span>{{ t('demandes.detail.tabs.operations') }}</span>
          <span data-testid="progress-label">
            {{ demande.operations_completed_count }}/{{ demande.operations_count }}
          </span>
        </div>
        <div class="w-full bg-muted rounded-full h-1.5">
          <div
            class="bg-primary h-1.5 rounded-full transition-all"
            :style="{ width: `${progressPercent()}%` }"
            data-testid="progress-bar"
          />
        </div>
      </div>
    </CardFooter>
  </Card>
</template>
