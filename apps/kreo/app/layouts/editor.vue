<script setup lang="ts">
import { getContentTypeSlug } from '#shared/utils/content'
import { tokenRefreshManager } from '@/services/api/tokenRefreshManager'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const config = useRuntimeConfig()
const route = useRoute()

const schemaUuid = computed(() => (route.query.schemaUuid as string) || undefined)

const editorBaseConfig = {
  apiBaseUrl: `${config.public.platformApiUrl}/api`,
  getAuthToken: () => tokenRefreshManager.getAccessToken(),
  refreshToken: () => tokenRefreshManager.refreshToken(),
  onContentCreated: (id: number) => {
    const type = useContentStore().type || 'landing-page'
    navigateTo(`/${getContentTypeSlug(type)}/${id}`, { replace: true })
  },
  onNavigateToHistory: (contentId: number) => {
    const type = useContentStore().type || 'landing-page'
    navigateTo(`/${getContentTypeSlug(type)}/${contentId}/history`)
  },
  onNavigateToEditor: (contentId: number) => {
    const type = useContentStore().type || 'landing-page'
    navigateTo(`/${getContentTypeSlug(type)}/${contentId}`)
  },
  onAuthFailure: () => {
    authStore.clearAuth()
    navigateTo('/login')
  },
  features: {
    ai: true,
    history: true,
    templates: true,
    variables: true,
  },
  theme: {
    logo: {
      src: '/logo_simple.svg',
      alt: 'Kreo',
      height: 28,
    },
  },
  variables: schemaUuid.value ? { schemaUuid: schemaUuid.value } : undefined,
}

const editorApi = createEditorApiClient(editorBaseConfig)
const editorConfig: EditorConfig = {
  ...editorBaseConfig,
  contentAdapter: createAIContentAdapter(editorApi),
  versionAdapter: createAIContentVersionAdapter(editorApi),
}

provideEditorConfig(editorConfig)
useEditorTheme(editorConfig)
</script>

<template>
  <EditorShell
    :schema-uuid="schemaUuid"
    home-path="/dashboard"
    home-aria-label="Retour au dashboard"
  >
    <slot />
  </EditorShell>
</template>
