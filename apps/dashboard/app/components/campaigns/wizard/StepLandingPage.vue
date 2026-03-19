<script setup lang="ts">
import { ref } from 'vue'
import { LayoutTemplate, Check, ExternalLink, FileX, CheckCircle2, RefreshCw } from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import EmptyState from '@/components/shared/EmptyState.vue'
import { useCampaignWizardStore } from '@/stores/campaignWizard'
import { useLandingPages } from '@/composables/useLandingPages'

const wizard = useCampaignWizardStore()
const { t } = useI18n()
const { landingPages, isLoading, hasError, fetchLandingPages } = useLandingPages()

const mode = ref<'none' | 'with'>(wizard.campaign.landing_page_id ? 'with' : 'none')

function getInitials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function getAvatarColor(name: string): string {
  const hue = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360
  return `hsl(${hue}, 50%, 55%)`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function selectMode(m: 'none' | 'with') {
  mode.value = m
  if (m === 'none') {
    wizard.campaign.landing_page_id = null
  }
  else {
    fetchLandingPages()
  }
}

function selectLandingPage(id: number) {
  wizard.campaign.landing_page_id = id
  wizard.isDirty = true
}
</script>

<template>
  <div class="space-y-6">
    <h2 class="text-lg font-semibold">{{ t('wizard.landingPage.title') }}</h2>

    <div class="grid gap-4 sm:grid-cols-2">
      <Card
        data-mode-with
        class="cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
        :class="mode === 'with' ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'hover:border-primary/50'"
        @click="selectMode('with')"
      >
        <CardHeader>
          <div class="flex items-center justify-between">
            <div class="flex size-10 items-center justify-center rounded-full bg-primary/10">
              <LayoutTemplate class="size-5 text-primary" />
            </div>
            <Check v-if="mode === 'with'" class="size-5 text-primary" />
          </div>
          <CardTitle class="mt-3">{{ t('wizard.landingPage.withLp') }}</CardTitle>
          <CardDescription>{{ t('wizard.landingPage.withLpDesc') }}</CardDescription>
        </CardHeader>
      </Card>

      <Card
        data-mode-none
        class="cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
        :class="mode === 'none' ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'hover:border-primary/50'"
        @click="selectMode('none')"
      >
        <CardHeader>
          <div class="flex items-center justify-between">
            <div class="flex size-10 items-center justify-center rounded-full bg-muted">
              <FileX class="size-5 text-muted-foreground" />
            </div>
            <Check v-if="mode === 'none'" class="size-5 text-primary" />
          </div>
          <CardTitle class="mt-3">{{ t('wizard.landingPage.withoutLp') }}</CardTitle>
          <CardDescription>{{ t('wizard.landingPage.withoutLpDesc') }}</CardDescription>
        </CardHeader>
      </Card>
    </div>

    <template v-if="mode === 'with'">
      <div v-if="isLoading" class="flex justify-center py-8">
        <div class="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>

      <EmptyState
        v-else-if="landingPages.length === 0 && !hasError"
        :icon="LayoutTemplate"
        :title="t('wizard.landingPage.empty.title')"
        :description="t('wizard.landingPage.empty.description')"
      />

      <template v-else>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Card
            v-for="lp in landingPages"
            :key="lp.id"
            data-lp-card
            class="cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
            :class="wizard.campaign.landing_page_id === lp.id
              ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
              : 'hover:border-primary/50'"
            @click="selectLandingPage(lp.id)"
          >
            <CardHeader>
              <div class="flex items-center gap-3">
                <div
                  data-lp-avatar
                  class="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                  :style="{ backgroundColor: getAvatarColor(lp.name) }"
                >
                  {{ getInitials(lp.name) }}
                </div>
                <div class="min-w-0 flex-1">
                  <CardTitle class="truncate text-sm">{{ lp.name }}</CardTitle>
                  <p data-lp-date class="text-xs text-muted-foreground">
                    {{ formatDate(lp.created_at) }}
                  </p>
                </div>
                <div v-if="wizard.campaign.landing_page_id === lp.id" data-lp-selected class="shrink-0">
                  <CheckCircle2 class="size-5 text-primary" />
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        <div class="flex items-center justify-between gap-4">
          <Button
            data-refresh-button
            variant="ghost"
            size="sm"
            @click="fetchLandingPages()"
          >
            <RefreshCw class="mr-1.5 size-3.5" />
            {{ t('wizard.landingPage.refresh') }}
          </Button>

          <p
            data-lp-managed-externally
            class="flex items-center gap-1.5 text-right text-sm text-muted-foreground"
          >
            <ExternalLink class="size-3.5 shrink-0" />
            {{ t('wizard.landingPage.managedExternally') }}
          </p>
        </div>
      </template>
    </template>
  </div>
</template>
