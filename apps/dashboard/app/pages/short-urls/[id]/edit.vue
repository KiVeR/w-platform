<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import ShortUrlForm from '@/components/short-urls/ShortUrlForm.vue'
import PageSkeleton from '@/components/shared/PageSkeleton.vue'
import { useShortUrlDetail } from '@/composables/useShortUrlDetail'

definePageMeta({ middleware: ['role-guard'], requiredPermissions: ['manage short-urls'] })

const { t } = useI18n()
const route = useRoute()
const shortUrlId = ref<number | null>(null)

onMounted(() => {
  shortUrlId.value = Number(route.params.id)
})

const { shortUrl, isLoading, hasError } = useShortUrlDetail(shortUrlId)

function onSaved(id: number) {
  toast.success(t('shortUrls.form.saveSuccess'))
  navigateTo(`/short-urls/${id}`)
}

function onCancel() {
  navigateTo(`/short-urls/${shortUrlId.value}`)
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-semibold tracking-tight">{{ t('shortUrls.form.editTitle') }}</h1>

    <PageSkeleton v-if="isLoading" variant="form" />

    <div v-else-if="hasError" class="text-center py-12">
      <p class="text-muted-foreground">{{ t('common.retry') }}</p>
    </div>

    <ShortUrlForm
      v-else-if="shortUrl"
      :short-url="shortUrl"
      @saved="onSaved"
      @cancel="onCancel"
    />
  </div>
</template>
