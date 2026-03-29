<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { Pencil, Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import ShortUrlInfoCard from '@/components/short-urls/detail/ShortUrlInfoCard.vue'
import ShortUrlStatsCard from '@/components/short-urls/detail/ShortUrlStatsCard.vue'
import PageSkeleton from '@/components/shared/PageSkeleton.vue'
import { useShortUrlDetail } from '@/composables/useShortUrlDetail'
import { usePermission } from '@/composables/usePermission'

definePageMeta({ middleware: ['role-guard'], requiredPermissions: ['view short-urls'] })

const { t } = useI18n()
const route = useRoute()
const { can } = usePermission()

const shortUrlId = ref<number | null>(null)
onMounted(() => { shortUrlId.value = Number(route.params.id) })

const { shortUrl, isLoading, hasError, deleteShortUrl, toggleEnabled } = useShortUrlDetail(shortUrlId)

async function handleDelete() {
  const success = await deleteShortUrl()
  if (success) {
    toast.success('Deleted')
    navigateTo('/short-urls')
  }
}

async function handleToggle() {
  await toggleEnabled()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold tracking-tight">
        {{ shortUrl ? shortUrl.slug : t('shortUrls.detail.title') }}
      </h1>
      <div v-if="can('manage short-urls') && shortUrl" class="flex gap-2">
        <NuxtLink :to="`/short-urls/${shortUrl.id}/edit`">
          <Button variant="outline">
            <Pencil class="mr-2 size-4" />{{ t('shortUrls.actions.edit') }}
          </Button>
        </NuxtLink>
        <AlertDialog>
          <AlertDialogTrigger as-child>
            <Button variant="destructive">
              <Trash2 class="mr-2 size-4" />{{ t('shortUrls.actions.delete') }}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{{ t('shortUrls.form.deleteConfirm.title') }}</AlertDialogTitle>
              <AlertDialogDescription>{{ t('shortUrls.form.deleteConfirm.description') }}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{{ t('cancel') }}</AlertDialogCancel>
              <AlertDialogAction
                class="bg-destructive text-destructive-foreground"
                @click="handleDelete"
              >
                {{ t('confirm') }}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>

    <!-- Loading -->
    <PageSkeleton v-if="isLoading" />

    <!-- Error -->
    <div v-else-if="hasError" class="py-12 text-center">
      <p class="text-muted-foreground">{{ t('common.retry') }}</p>
    </div>

    <!-- Content -->
    <div v-else-if="shortUrl" class="grid gap-6 lg:grid-cols-2">
      <ShortUrlInfoCard :short-url="shortUrl" :can-manage="can('manage short-urls')" @toggle="handleToggle" />
      <ShortUrlStatsCard :short-url="shortUrl" />
    </div>
  </div>
</template>
