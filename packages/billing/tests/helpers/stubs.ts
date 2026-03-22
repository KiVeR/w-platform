import { vi } from 'vitest'

/**
 * Mock useI18n for components that use auto-imported i18n.
 * Returns the key as-is (e.g. t('billing.status.draft') -> 'billing.status.draft').
 */
export function mockUseI18n() {
  const t = (key: string) => key
  vi.stubGlobal('useI18n', () => ({ t, locale: { value: 'fr-FR' } }))
}

/**
 * Mock useNuxtApp with a configurable $api mock.
 */
export function mockNuxtApp(api: { GET?: Function; POST?: Function; DELETE?: Function }) {
  vi.stubGlobal('useNuxtApp', () => ({ $api: api }))
}
