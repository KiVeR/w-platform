export type ColorMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'wellpack-color-mode'
let initialized = false
let mediaQuery: MediaQueryList | null = null
let mediaHandler: ((e: MediaQueryListEvent) => void) | null = null

export function useColorMode() {
  const mode = useState<ColorMode>('color-mode', () => 'system')
  const isDark = useState('color-mode-dark', () => false)

  function applyToDOM(dark: boolean) {
    isDark.value = dark
    if (import.meta.client) {
      document.documentElement.classList.toggle('dark', dark)
    }
  }

  function resolveSystemPreference(): boolean {
    return import.meta.client
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  }

  function listenToSystem() {
    if (!import.meta.client) return
    stopListening()
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaHandler = (e: MediaQueryListEvent) => {
      if (mode.value === 'system') {
        applyToDOM(e.matches)
      }
    }
    mediaQuery.addEventListener('change', mediaHandler)
  }

  function stopListening() {
    if (mediaQuery && mediaHandler) {
      mediaQuery.removeEventListener('change', mediaHandler)
      mediaQuery = null
      mediaHandler = null
    }
  }

  function setMode(newMode: ColorMode) {
    mode.value = newMode
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, newMode)
    }

    if (newMode === 'system') {
      applyToDOM(resolveSystemPreference())
      listenToSystem()
    } else {
      stopListening()
      applyToDOM(newMode === 'dark')
    }
  }

  // Init once on client
  if (import.meta.client && !initialized) {
    initialized = true
    const stored = localStorage.getItem(STORAGE_KEY) as ColorMode | null
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      setMode(stored)
    } else {
      setMode('system')
    }
  }

  return { mode, isDark, setMode }
}
