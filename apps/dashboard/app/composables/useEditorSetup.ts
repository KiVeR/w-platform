import { tokenRefreshManager } from '@/services/tokenRefreshManager'

/**
 * Provides editor config for the @wellpack/content-editor layer.
 * Call this in a page or layout that hosts the editor.
 */
export function useEditorSetup() {
  const config = useRuntimeConfig()

  provideEditorConfig({
    apiBaseUrl: `${config.public.apiUrl}/api`,
    getAuthToken: () => tokenRefreshManager.getAccessToken(),
    refreshToken: () => tokenRefreshManager.refreshToken(),
    features: {
      ai: true,
      history: true,
      templates: false,
      variables: true,
    },
    onAuthFailure: () => {
      navigateTo('/login')
    },
  })
}
