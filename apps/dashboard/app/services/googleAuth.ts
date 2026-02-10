declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleInitConfig) => void
          renderButton: (element: HTMLElement, config: GoogleButtonConfig) => void
        }
      }
    }
  }
}

interface GoogleInitConfig {
  client_id: string
  callback: (response: { credential: string }) => void
  auto_select?: boolean
}

interface GoogleButtonConfig {
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  width?: number
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  locale?: string
}

let loadPromise: Promise<void> | null = null

export function loadScript(): Promise<void> {
  if (window.google?.accounts) return Promise.resolve()

  if (loadPromise) return loadPromise

  loadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      loadPromise = null
      reject(new Error('Failed to load Google Identity Services'))
    }
    document.head.appendChild(script)
  })

  return loadPromise
}

export function initializeGoogleAuth(
  clientId: string,
  callback: (response: { credential: string }) => void,
): void {
  window.google!.accounts.id.initialize({
    client_id: clientId,
    callback,
    auto_select: false,
  })
}

export function renderGoogleButton(
  element: HTMLElement,
  options?: Partial<GoogleButtonConfig>,
): void {
  window.google!.accounts.id.renderButton(element, {
    theme: 'outline',
    size: 'large',
    text: 'continue_with',
    ...options,
  })
}
