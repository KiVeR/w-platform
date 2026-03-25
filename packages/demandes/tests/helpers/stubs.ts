import { vi } from 'vitest'

export function mockUseI18n() {
  const t = (key: string) => key
  vi.stubGlobal('useI18n', () => ({ t, locale: { value: 'fr-FR' } }))
}

export function mockNuxtApp(api: { GET?: Function; POST?: Function; PUT?: Function; DELETE?: Function }) {
  vi.stubGlobal('useNuxtApp', () => ({ $api: api }))
}
