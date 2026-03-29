<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { ShortUrl } from '@/types/shortUrl'

const props = defineProps<{ shortUrl: ShortUrl }>()
const { t } = useI18n()

const totalClicks = computed(() => props.shortUrl.click_count + props.shortUrl.click_count_bots)
const humanPercent = computed(() =>
  totalClicks.value > 0
    ? Math.round((props.shortUrl.click_count / totalClicks.value) * 100)
    : 0
)
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>{{ t('shortUrls.detail.statsTitle') }}</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <!-- KPI grid -->
      <div class="grid grid-cols-3 gap-4">
        <div class="text-center" data-human-clicks>
          <p class="text-2xl font-bold">{{ shortUrl.click_count }}</p>
          <p class="text-sm text-muted-foreground">{{ t('shortUrls.detail.humanClicks') }}</p>
        </div>
        <div class="text-center" data-bot-clicks>
          <p class="text-2xl font-bold">{{ shortUrl.click_count_bots }}</p>
          <p class="text-sm text-muted-foreground">{{ t('shortUrls.detail.botClicks') }}</p>
        </div>
        <div class="text-center" data-total-clicks>
          <p class="text-2xl font-bold">{{ totalClicks }}</p>
          <p class="text-sm text-muted-foreground">{{ t('shortUrls.detail.totalClicks') }}</p>
        </div>
      </div>

      <!-- Proportion bar -->
      <div class="h-3 rounded-full bg-muted overflow-hidden mt-4" data-proportion-bar>
        <div
          class="h-full bg-primary rounded-full transition-all"
          :style="{ width: humanPercent + '%' }"
        />
      </div>
      <p class="text-sm text-muted-foreground mt-2">{{ t('shortUrls.detail.humanPercent', { pct: humanPercent }) }}</p>
    </CardContent>
  </Card>
</template>
