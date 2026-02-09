<script setup lang="ts">
import type { NuxtError } from '#app'
import { FileX, ShieldX, ServerCrash } from 'lucide-vue-next'
import ErrorState from '@/components/shared/ErrorState.vue'

const { t } = useI18n()

const props = defineProps<{
  error: NuxtError
}>()

const statusCode = computed(() => props.error.statusCode ?? 500)

const errorConfig = computed(() => {
  switch (statusCode.value) {
    case 403:
      return {
        icon: ShieldX,
        title: t('error.403.title'),
        description: t('error.403.description'),
      }
    case 404:
      return {
        icon: FileX,
        title: t('error.404.title'),
        description: t('error.404.description'),
      }
    default:
      return {
        icon: ServerCrash,
        title: statusCode.value >= 500 ? t('error.500.title') : t('error.unknown.title'),
        description: statusCode.value >= 500 ? t('error.500.description') : t('error.unknown.description'),
      }
  }
})

</script>

<template>
  <div class="flex min-h-svh items-center justify-center bg-background px-4">
    <ErrorState
      :icon="errorConfig.icon"
      :title="errorConfig.title"
      :description="errorConfig.description"
      :back-label="t('error.backHome')"
      back-to="/"
      @retry="clearError({ redirect: '/' })"
    />
  </div>
</template>
