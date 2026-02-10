const store: Record<string, string> = {}

export const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value },
  removeItem: (key: string) => { delete store[key] },
  clear: () => { Object.keys(store).forEach(k => delete store[k]) },
  get length() { return Object.keys(store).length },
  key: (index: number) => Object.keys(store)[index] ?? null,
}

export function stubAuthGlobals(overrides?: { $api?: unknown }): void {
  vi.stubGlobal('localStorage', localStorageMock)
  vi.stubGlobal('useRuntimeConfig', () => ({
    public: { apiUrl: 'http://localhost:8000' },
  }))
  vi.stubGlobal('useNuxtApp', () => ({ $api: overrides?.$api ?? {} }))
}
