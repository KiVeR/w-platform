<script setup lang="ts">
import { ref, watch } from 'vue'
import { LayoutTemplate, Check, ExternalLink, FileX } from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import EmptyState from '@/components/shared/EmptyState.vue'
import { useCampaignWizardStore } from '@/stores/campaignWizard'
import { useLandingPages } from '@/composables/useLandingPages'

const wizard = useCampaignWizardStore()
const { t } = useI18n()
const { landingPages, isLoading, hasError, fetchLandingPages } = useLandingPages()

const mode = ref<'none' | 'with'>(wizard.campaign.landing_page_id ? 'with' : 'none')

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

watch(() => wizard.campaign.landing_page_id, (val) => {
  if (val && mode.value === 'none') mode.value = 'with'
})
</script>

<template>
  <div class="space-y-6">
    <h2 class="text-lg font-semibold">{{ t('wizard.landingPage.title') }}</h2>

    <div class="grid gap-4 sm:grid-cols-2">
      <Card
        data-mode-with
        class="cursor-pointer transition-all"
        :class="mode === 'with' ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'hover:border-primary/50'"
        @click="selectMode('with')"
      >
        <CardHeader>
          <div class="flex items-center justify-between">
            <LayoutTemplate class="size-8 text-primary" />
            <Check v-if="mode === 'with'" class="size-5 text-primary" />
          </div>
          <CardTitle class="mt-3">{{ t('wizard.landingPage.withLp') }}</CardTitle>
          <CardDescription>{{ t('wizard.landingPage.withLpDesc') }}</CardDescription>
        </CardHeader>
      </Card>

      <Card
        data-mode-none
        class="cursor-pointer transition-all"
        :class="mode === 'none' ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'hover:border-primary/50'"
        @click="selectMode('none')"
      >
        <CardHeader>
          <div class="flex items-center justify-between">
            <FileX class="size-8 text-muted-foreground" />
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

      <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          v-for="lp in landingPages"
          :key="lp.id"
          data-lp-card
          class="cursor-pointer transition-all"
          :class="wizard.campaign.landing_page_id === lp.id ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'hover:border-primary/50'"
          @click="selectLandingPage(lp.id)"
        >
          <CardHeader>
            <div class="flex items-center justify-between">
              <CardTitle class="text-sm">{{ lp.name }}</CardTitle>
              <Badge v-if="wizard.campaign.landing_page_id === lp.id" variant="default">
                {{ t('wizard.landingPage.selected') }}
              </Badge>
            </div>
          </CardHeader>
        </Card>
      </div>

      <NuxtLink
        to="/landing-pages/new"
        target="_blank"
        class="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        <ExternalLink class="size-3.5" />
        {{ t('wizard.landingPage.createNew') }}
      </NuxtLink>
    </template>
  </div>
</template>
