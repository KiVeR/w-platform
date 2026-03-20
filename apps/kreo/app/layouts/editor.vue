<script setup lang="ts">
import { getContentTypeSlug } from '#shared/utils/content'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const schemaUuid = computed(() => (route.query.schemaUuid as string) || undefined)

const editorBaseConfig = {
  apiBaseUrl: '/api/v1',
  getAuthToken: () => authStore.accessToken,
  refreshToken: async () => {
    const success = await authStore.refresh()
    return success ? authStore.accessToken : null
  },
  onContentCreated: (id: number) => {
    const type = useContentStore().type || 'landing-page'
    router.replace(`/${getContentTypeSlug(type)}/${id}`)
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
    router.push('/login')
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
