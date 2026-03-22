<script setup lang="ts">
import { AlertCircle, ArrowLeft, Loader2, RefreshCw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useCampaignWizardStore } from '@/stores/campaignWizard'
import { useLandingPageEditorAdapter } from '@/composables/useLandingPageEditorAdapter'

const props = defineProps<{
  landingPageId: number
}>()

const emit = defineEmits<{
  back: []
  continue: []
}>()

const wizard = useCampaignWizardStore()
const { buildContentAdapter } = useLandingPageEditorAdapter()

const editorConfig = useEditorSetup({
  buildContentAdapter,
  features: {
    ai: true,
    history: false,
    templates: false,
    variables: true,
  },
})

useEditorTheme(editorConfig)

const editorStore = useEditorStore()
const widgetsStore = useWidgetsStore()
const contentStore = useContentStore()
const variableSchemaStore = useVariableSchemaStore()
const { t } = useI18n()

const isLoading = ref(true)
const loadError = ref<string | null>(null)

async function loadLandingPage(): Promise<void> {
  isLoading.value = true
  loadError.value = null

  try {
    const response = await editorConfig.contentAdapter.loadDesign(props.landingPageId)
    if (!response) {
      loadError.value = t('campaigns.detail.loadErrorDescription')
      return
    }

    editorStore.setDesign(response.design)
    widgetsStore.setWidgets(response.design.widgets || [])
    contentStore.setMetadata({
      id: response.id,
      type: 'landing-page',
      title: response.title,
      status: response.status,
      variableSchemaUuid: response.variableSchemaUuid ?? null,
    })

    wizard.setLandingPageSummary({
      id: response.id,
      name: response.title,
      status: response.status.toLowerCase() as 'draft' | 'published' | 'archived',
    })
  }
  catch (error) {
    loadError.value = error instanceof Error ? error.message : t('campaigns.detail.loadErrorDescription')
  }
  finally {
    isLoading.value = false
  }
}

onMounted(() => {
  void loadLandingPage()
})

onUnmounted(() => {
  editorStore.reset()
  widgetsStore.setWidgets([])
  contentStore.reset()
  variableSchemaStore.reset()
})
</script>

<template>
  <div class="editor-inline-shell">
    <div class="editor-inline-toolbar">
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" @click="emit('back')">
          <ArrowLeft class="mr-2 size-4" />
          {{ t('wizard.nav.back') }}
        </Button>
        <Button size="sm" :disabled="isLoading" @click="emit('continue')">
          {{ t('wizard.nav.next') }}
        </Button>
      </div>
      <p class="text-sm text-muted-foreground">
        {{ t('wizard.landingPage.title') }}
      </p>
    </div>

    <div v-if="isLoading" class="editor-inline-state">
      <Loader2 class="size-5 animate-spin text-primary" />
      <span>{{ t('wizard.autosave.saving') }}</span>
    </div>

    <Alert v-else-if="loadError" variant="destructive">
      <AlertCircle class="size-4" />
      <AlertTitle>{{ t('campaigns.detail.loadError') }}</AlertTitle>
      <AlertDescription class="flex items-center justify-between gap-3">
        <span>{{ loadError }}</span>
        <Button size="sm" variant="outline" @click="loadLandingPage()">
          <RefreshCw class="mr-2 size-4" />
          {{ t('wizard.landingPage.refresh') }}
        </Button>
      </AlertDescription>
    </Alert>

    <div v-else class="editor-inline-frame">
      <EditorShell height="parent" />
    </div>
  </div>
</template>

<style scoped>
.editor-inline-shell {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 720px;
}

.editor-inline-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.editor-inline-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 280px;
  border: 1px dashed var(--border);
  border-radius: 16px;
  background: color-mix(in oklab, var(--background) 92%, white);
}

.editor-inline-frame {
  flex: 1;
  min-height: 720px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 20px;
}
</style>
