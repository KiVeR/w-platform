import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('googleAuth', () => {
  let loadScript: typeof import('@/services/googleAuth').loadScript
  let initializeGoogleAuth: typeof import('@/services/googleAuth').initializeGoogleAuth
  let renderGoogleButton: typeof import('@/services/googleAuth').renderGoogleButton

  const mockInitialize = vi.fn()
  const mockRenderButton = vi.fn()

  beforeEach(async () => {
    vi.resetModules()
    vi.restoreAllMocks()

    // Reset window.google
    delete (window as any).google
    document.head.innerHTML = ''

    const mod = await import('@/services/googleAuth')
    loadScript = mod.loadScript
    initializeGoogleAuth = mod.initializeGoogleAuth
    renderGoogleButton = mod.renderGoogleButton
  })

  describe('loadScript', () => {
    it('creates a script element and calls onload', async () => {
      // Intercept appendChild to prevent happy-dom from actually loading the script
      const appendedNodes: Node[] = []
      vi.spyOn(document.head, 'appendChild').mockImplementation((node: Node) => {
        appendedNodes.push(node)
        // Simulate async script load success
        setTimeout(() => (node as HTMLScriptElement).onload?.(new Event('load')), 0)
        return node
      })

      await loadScript()

      expect(appendedNodes.length).toBe(1)
      expect((appendedNodes[0] as HTMLScriptElement).src).toBe('https://accounts.google.com/gsi/client')
      expect((appendedNodes[0] as HTMLScriptElement).async).toBe(true)
    })

    it('deduplicates concurrent calls', async () => {
      const appendedNodes: Node[] = []
      vi.spyOn(document.head, 'appendChild').mockImplementation((node: Node) => {
        appendedNodes.push(node)
        setTimeout(() => (node as HTMLScriptElement).onload?.(new Event('load')), 0)
        return node
      })

      await Promise.all([loadScript(), loadScript(), loadScript()])

      expect(appendedNodes.length).toBe(1)
    })
  })

  describe('initializeGoogleAuth', () => {
    it('calls google.accounts.id.initialize with correct config', () => {
      ;(window as any).google = {
        accounts: { id: { initialize: mockInitialize, renderButton: mockRenderButton } },
      }

      const callback = vi.fn()
      initializeGoogleAuth('my-client-id', callback)

      expect(mockInitialize).toHaveBeenCalledWith({
        client_id: 'my-client-id',
        callback,
        auto_select: false,
      })
    })
  })

  describe('renderGoogleButton', () => {
    it('calls google.accounts.id.renderButton with defaults', () => {
      ;(window as any).google = {
        accounts: { id: { initialize: mockInitialize, renderButton: mockRenderButton } },
      }

      const el = document.createElement('div')
      renderGoogleButton(el)

      expect(mockRenderButton).toHaveBeenCalledWith(el, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
      })
    })
  })
})
