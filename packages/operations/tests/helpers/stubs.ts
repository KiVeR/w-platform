import { vi } from 'vitest'

/**
 * Mock useI18n for components that use auto-imported i18n.
 * Returns the key as-is (e.g. t('error.retry') -> 'error.retry').
 */
export function mockUseI18n() {
  const t = (key: string) => key
  vi.stubGlobal('useI18n', () => ({ t }))
}

/**
 * Mock useNuxtApp with a configurable $api mock.
 */
export function mockNuxtApp(api: { GET?: Function; POST?: Function; DELETE?: Function }) {
  vi.stubGlobal('useNuxtApp', () => ({ $api: api }))
}
