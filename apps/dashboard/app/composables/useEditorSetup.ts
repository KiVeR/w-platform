import { tokenRefreshManager } from '@/services/tokenRefreshManager'

interface UseEditorSetupOptions {
  buildContentAdapter: (api: ReturnType<typeof createEditorApiClient>) => EditorConfig['contentAdapter']
  buildVersionAdapter?: (api: ReturnType<typeof createEditorApiClient>) => EditorConfig['versionAdapter']
  features?: EditorConfigFeatures
  theme?: EditorTheme
  variables?: EditorConfigVariables
  onContentCreated?: EditorConfig['onContentCreated']
  onNavigateToHistory?: EditorConfig['onNavigateToHistory']
  onNavigateToEditor?: EditorConfig['onNavigateToEditor']
}

export function useEditorSetup(options: UseEditorSetupOptions) {
  const config = useRuntimeConfig()
  const editorBaseConfig = {
    apiBaseUrl: `${config.public.apiUrl}/api`,
    getAuthToken: () => tokenRefreshManager.getAccessToken(),
    refreshToken: () => tokenRefreshManager.refreshToken(),
    features: {
      ai: true,
      history: true,
      templates: false,
      variables: true,
      ...options.features,
    },
    theme: options.theme,
    variables: options.variables,
    onContentCreated: options.onContentCreated,
    onNavigateToHistory: options.onNavigateToHistory,
    onNavigateToEditor: options.onNavigateToEditor,
    onAuthFailure: () => {
      navigateTo('/login')
    },
  }
  const editorApi = createEditorApiClient(editorBaseConfig)
  const editorConfig: EditorConfig = {
    ...editorBaseConfig,
    contentAdapter: options.buildContentAdapter(editorApi),
    versionAdapter: options.buildVersionAdapter?.(editorApi),
  }

  provideEditorConfig(editorConfig)
  return editorConfig
}
