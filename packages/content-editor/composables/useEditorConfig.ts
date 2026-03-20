export interface EditorConfigVariables {
  schemaUuid?: string
  schema?: import('../types/variable').VariableSchema
  previewDataSetKey?: string
}

export interface EditorConfigFeatures {
  ai?: boolean
  history?: boolean
  templates?: boolean
  variables?: boolean
}

export interface EditorThemeLogo {
  /** URL to the logo image */
  src: string
  /** Alt text for accessibility */
  alt?: string
  /** Logo height in pixels (default: 28) */
  height?: number
}

export interface EditorTheme {
  /** Main accent color as hex (#rrggbb or #rgb). Default: '#14b8a6' (turquoise). */
  primaryColor?: string
  /** Brand logo to display in the editor toolbar */
  logo?: EditorThemeLogo
  /** Color mode for the editor UI. Currently only 'light' is supported. */
  colorMode?: 'light'
}

export interface EditorConfig {
  // HTTP — base URL for API calls (e.g., '/api/v1' or 'https://api.wellpack.fr/api')
  apiBaseUrl: string
  // Auth token provider — each app has its own auth system
  getAuthToken: () => string | null
  // Optional token refresh — returns new token or null if refresh fails
  refreshToken?: () => Promise<string | null>

  // Navigation callbacks — each app routes differently after editor actions
  onContentCreated?: (id: number) => void
  onNavigateToHistory?: (contentId: number) => void
  onNavigateToEditor?: (contentId: number) => void
  onAuthFailure?: () => void

  // Feature flags
  features?: EditorConfigFeatures

  // Content persistence adapters — each host app maps the editor layer to its own API surface
  contentAdapter: import('../types/editor-adapters').ContentAdapter
  versionAdapter?: import('../types/editor-adapters').ContentVersionAdapter

  // Editor UI theme customization
  theme?: EditorTheme

  // Variable schema for dynamic content (landing pages, SMS)
  variables?: EditorConfigVariables
}

export const EDITOR_CONFIG_KEY: InjectionKey<EditorConfig> = Symbol('editor-config')

/**
 * Provide editor configuration from the consuming app.
 * Call this in the page or layout that hosts the editor.
 */
export function provideEditorConfig(config: EditorConfig): void {
  provide(EDITOR_CONFIG_KEY, config)
}

/**
 * Consume editor configuration inside layer composables/components.
 * Throws if no config was provided by the consuming app.
 */
export function useEditorConfig(): EditorConfig {
  const config = inject(EDITOR_CONFIG_KEY, undefined)
  if (!config) {
    throw new Error(
      '[KreoEditor] Missing editor config. '
      + 'Call provideEditorConfig() in a parent component or layout.',
    )
  }
  return config
}
