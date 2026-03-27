<script setup lang="ts">
import PartnerForm from '@/components/hub/PartnerForm.vue'
import { usePartnerDetail } from '@/composables/usePartnerDetail'
import type { PartnerFormData } from '@/types/partner'

definePageMeta({
  middleware: ['role-guard'],
  requiredPermissions: ['manage partners'],
})

const { isSaving, saveError, createPartner } = usePartnerDetail()

async function handleSubmit(data: PartnerFormData) {
  const id = await createPartner(data)
  if (id) {
    await navigateTo(`/hub/partners/${id}`)
  }
}

function handleCancel() {
  navigateTo('/hub/partners')
}
</script>

<template>
  <div data-new-partner-page class="max-w-3xl mx-auto py-6">
    <div v-if="saveError" class="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm" data-save-error>
      {{ saveError }}
    </div>

    <PartnerForm
      mode="create"
      :is-saving="isSaving"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>
