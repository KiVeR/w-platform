<script setup lang="ts">
import { toast } from 'vue-sonner'
import ShortUrlForm from '@/components/short-urls/ShortUrlForm.vue'

definePageMeta({
  middleware: ['role-guard'],
  requiredPermissions: ['manage short-urls'],
})

const { t } = useI18n()

function onSaved(id: number) {
  toast.success(t('shortUrls.form.saveSuccess'))
  navigateTo(`/short-urls/${id}`)
}

function onCancel() {
  navigateTo('/short-urls')
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">{{ t('shortUrls.form.createTitle') }}</h1>
    </div>
    <ShortUrlForm @saved="onSaved" @cancel="onCancel" />
  </div>
</template>
