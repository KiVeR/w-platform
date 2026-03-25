<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { usePartnerStore } from '@/stores/partner'
import { useScopedNavigation } from '@/composables/useScopedNavigation'

const { t } = useI18n()
const partner = usePartnerStore()
const { exitToHub } = useScopedNavigation()
</script>

<template>
  <div
    class="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-1.5"
    data-scope-banner
  >
    <span class="truncate text-sm font-medium">
      {{ partner.currentPartnerName ?? t('scope.partner') }}
    </span>
    <Badge
      v-if="partner.currentPartnerData?.euro_credits != null"
      variant="secondary"
      class="shrink-0 text-xs"
    >
      {{ partner.currentPartnerData.euro_credits.toFixed(2) }} &euro;
    </Badge>
    <Button
      variant="ghost"
      size="icon"
      class="-mr-1 size-6"
      :aria-label="t('scope.exit')"
      @click="exitToHub"
    >
      <X class="size-3.5" />
    </Button>
  </div>
</template>
