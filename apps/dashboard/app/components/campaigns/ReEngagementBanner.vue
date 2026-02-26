<script setup lang="ts">
import { Megaphone } from 'lucide-vue-next'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useReEngagementBanner } from '@/composables/useReEngagementBanner'

const { t } = useI18n()
const { lastCampaign, daysSinceLastSend, shouldShow, dismiss, fetch } = useReEngagementBanner()

const isCollapsing = ref(false)

onMounted(() => fetch())

function handleDismiss(): void {
  isCollapsing.value = true
  setTimeout(() => {
    dismiss()
    isCollapsing.value = false
  }, 250)
}

function handleRelaunch(): void {
  navigateTo('/campaigns/new')
}
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-250 ease-out"
    enter-from-class="opacity-0 -translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-250 ease-in"
    leave-from-class="opacity-100 max-h-40"
    leave-to-class="opacity-0 max-h-0"
  >
    <Alert
      v-if="shouldShow && lastCampaign && !isCollapsing"
      variant="default"
      class="border-primary/40 bg-primary/5"
      data-testid="re-engagement-banner"
    >
      <Megaphone class="size-4" />
      <AlertTitle>
        {{ t('campaigns.reEngagement.title') }}
      </AlertTitle>
      <AlertDescription>
        <p>
          {{ t('campaigns.reEngagement.message', {
            name: lastCampaign.name,
            volume: lastCampaign.volume?.toLocaleString() ?? '—',
            days: daysSinceLastSend,
          }) }}
        </p>
        <div class="mt-3 flex items-center gap-2">
          <Button
            size="sm"
            data-testid="re-engagement-relaunch"
            @click="handleRelaunch"
          >
            {{ t('campaigns.reEngagement.relaunch') }}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            data-testid="re-engagement-dismiss"
            @click="handleDismiss"
          >
            {{ t('campaigns.reEngagement.later') }}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  </Transition>
</template>
