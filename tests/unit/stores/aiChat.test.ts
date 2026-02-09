import { createPinia, defineStore, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'

// Re-stub Nuxt auto-imports (unstubGlobals restores after each test)
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('defineStore', defineStore)

const { useAIChatStore } = await import('#editor/stores/aiChat')

describe('useAIChatStore', () => {
  beforeEach(() => {
    vi.stubGlobal('ref', ref)
    vi.stubGlobal('computed', computed)
    vi.stubGlobal('defineStore', defineStore)
    setActivePinia(createPinia())
  })

  // -------------------------------------------------------------------------
  // 1. Initial state
  // -------------------------------------------------------------------------
  describe('initial state', () => {
    it('isOpen is false', () => {
      const store = useAIChatStore()
      expect(store.isOpen).toBe(false)
    })

    it('messages is an empty array', () => {
      const store = useAIChatStore()
      expect(store.messages).toEqual([])
    })

    it('isStreaming is false', () => {
      const store = useAIChatStore()
      expect(store.isStreaming).toBe(false)
    })

    it('currentStreamText is empty', () => {
      const store = useAIChatStore()
      expect(store.currentStreamText).toBe('')
    })

    it('pendingImage is null', () => {
      const store = useAIChatStore()
      expect(store.pendingImage).toBeNull()
    })

    it('quota is null', () => {
      const store = useAIChatStore()
      expect(store.quota).toBeNull()
    })

    it('error is null', () => {
      const store = useAIChatStore()
      expect(store.error).toBeNull()
    })

    it('hasMessages is false', () => {
      const store = useAIChatStore()
      expect(store.hasMessages).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // 2-4. open / close / toggle
  // -------------------------------------------------------------------------
  describe('open', () => {
    it('sets isOpen to true', () => {
      const store = useAIChatStore()
      store.open()
      expect(store.isOpen).toBe(true)
    })

    it('clears error when opening', () => {
      const store = useAIChatStore()
      store.setError('some error')
      store.open()
      expect(store.error).toBeNull()
    })
  })

  describe('close', () => {
    it('sets isOpen to false', () => {
      const store = useAIChatStore()
      store.open()
      store.close()
      expect(store.isOpen).toBe(false)
    })
  })

  describe('toggle', () => {
    it('opens when closed', () => {
      const store = useAIChatStore()
      store.toggle()
      expect(store.isOpen).toBe(true)
    })

    it('closes when open', () => {
      const store = useAIChatStore()
      store.open()
      store.toggle()
      expect(store.isOpen).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // 5-7. addUserMessage
  // -------------------------------------------------------------------------
  describe('addUserMessage', () => {
    it('adds a message with role user and correct content', () => {
      const store = useAIChatStore()
      store.addUserMessage('Hello AI')
      expect(store.messages).toHaveLength(1)
      expect(store.messages[0].role).toBe('user')
      expect(store.messages[0].content).toBe('Hello AI')
      expect(store.messages[0].createdAt).toBeInstanceOf(Date)
      expect(store.messages[0].id).toMatch(/^msg_/)
    })

    it('adds a message with an image attachment', () => {
      const store = useAIChatStore()
      const image = { data: 'base64data', mimeType: 'image/png' as const }
      store.addUserMessage('With image', image)
      expect(store.messages[0].image).toEqual(image)
    })

    it('trims conversation to last 20 messages when exceeding limit', () => {
      const store = useAIChatStore()
      for (let i = 0; i < 22; i++) {
        store.addUserMessage(`Message ${i}`)
      }
      expect(store.messages).toHaveLength(20)
      // First two messages should have been trimmed
      expect(store.messages[0].content).toBe('Message 2')
      expect(store.messages[19].content).toBe('Message 21')
    })

    it('hasMessages becomes true after adding a message', () => {
      const store = useAIChatStore()
      expect(store.hasMessages).toBe(false)
      store.addUserMessage('test')
      expect(store.hasMessages).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // 8-9. startAssistantMessage / appendStreamText
  // -------------------------------------------------------------------------
  describe('startAssistantMessage', () => {
    it('sets currentStreamText to empty, isStreaming to true, error to null', () => {
      const store = useAIChatStore()
      store.setError('previous error')
      store.startAssistantMessage()
      expect(store.currentStreamText).toBe('')
      expect(store.isStreaming).toBe(true)
      expect(store.error).toBeNull()
    })
  })

  describe('appendStreamText', () => {
    it('accumulates streamed text', () => {
      const store = useAIChatStore()
      store.startAssistantMessage()
      store.appendStreamText('Hello ')
      store.appendStreamText('world')
      expect(store.currentStreamText).toBe('Hello world')
    })
  })

  // -------------------------------------------------------------------------
  // 10-13. displayStreamText
  // -------------------------------------------------------------------------
  describe('displayStreamText', () => {
    it('returns text before ---JSON--- separator', () => {
      const store = useAIChatStore()
      store.startAssistantMessage()
      store.appendStreamText('Here is your design---JSON---{"widgets":[]}')
      expect(store.displayStreamText).toBe('Here is your design')
    })

    it('returns text before \\n{ (newline + opening brace)', () => {
      const store = useAIChatStore()
      store.startAssistantMessage()
      store.appendStreamText('Design ready\n{"version":"1.0"}')
      expect(store.displayStreamText).toBe('Design ready')
    })

    it('returns empty string if text starts with {', () => {
      const store = useAIChatStore()
      store.startAssistantMessage()
      store.appendStreamText('{"version":"1.0","widgets":[]}')
      expect(store.displayStreamText).toBe('')
    })

    it('returns full text if no JSON detected', () => {
      const store = useAIChatStore()
      store.startAssistantMessage()
      store.appendStreamText('Just a plain text response')
      expect(store.displayStreamText).toBe('Just a plain text response')
    })
  })

  // -------------------------------------------------------------------------
  // 14-16. isGeneratingDesign
  // -------------------------------------------------------------------------
  describe('isGeneratingDesign', () => {
    it('is true when streaming and text contains ---JSON---', () => {
      const store = useAIChatStore()
      store.startAssistantMessage()
      store.appendStreamText('Text---JSON---{"widgets":[]}')
      expect(store.isGeneratingDesign).toBe(true)
    })

    it('is true when streaming and text starts with {', () => {
      const store = useAIChatStore()
      store.startAssistantMessage()
      store.appendStreamText('{"version":"1.0"}')
      expect(store.isGeneratingDesign).toBe(true)
    })

    it('is false when not streaming', () => {
      const store = useAIChatStore()
      // Not streaming, even if text would match
      expect(store.isGeneratingDesign).toBe(false)
    })

    it('is false when streaming plain text', () => {
      const store = useAIChatStore()
      store.startAssistantMessage()
      store.appendStreamText('Just regular text')
      expect(store.isGeneratingDesign).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // 17-18. completeAssistantMessage
  // -------------------------------------------------------------------------
  describe('completeAssistantMessage', () => {
    it('extracts text content, stores design, and stops streaming', () => {
      const store = useAIChatStore()
      const design = { version: '1.0', globalStyles: {}, widgets: [] }
      store.startAssistantMessage()
      store.appendStreamText('Here is your design')
      store.completeAssistantMessage(design as any)

      expect(store.isStreaming).toBe(false)
      expect(store.currentStreamText).toBe('')
      expect(store.messages).toHaveLength(1)
      expect(store.messages[0].role).toBe('assistant')
      expect(store.messages[0].content).toBe('Here is your design')
      expect(store.messages[0].design).toEqual(design)
    })

    it('handles JSON separator by extracting text before it', () => {
      const store = useAIChatStore()
      store.startAssistantMessage()
      store.appendStreamText('Design created---JSON---{"widgets":[]}')
      store.completeAssistantMessage()

      expect(store.messages[0].content).toBe('Design created')
    })

    it('handles \\n{ by extracting text before it', () => {
      const store = useAIChatStore()
      store.startAssistantMessage()
      store.appendStreamText('Done\n{"version":"1.0"}')
      store.completeAssistantMessage()

      expect(store.messages[0].content).toBe('Done')
    })

    it('handles text starting with { by setting content to empty', () => {
      const store = useAIChatStore()
      store.startAssistantMessage()
      store.appendStreamText('{"version":"1.0"}')
      store.completeAssistantMessage()

      expect(store.messages[0].content).toBe('')
    })
  })

  // -------------------------------------------------------------------------
  // 19-20. setError / clearError
  // -------------------------------------------------------------------------
  describe('setError', () => {
    it('sets the error message, stops streaming, and clears stream text', () => {
      const store = useAIChatStore()
      store.startAssistantMessage()
      store.appendStreamText('partial text')
      store.setError('Generation failed')

      expect(store.error).toBe('Generation failed')
      expect(store.isStreaming).toBe(false)
      expect(store.currentStreamText).toBe('')
    })
  })

  describe('clearError', () => {
    it('sets error to null', () => {
      const store = useAIChatStore()
      store.setError('some error')
      store.clearError()
      expect(store.error).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // 21. setPendingImage
  // -------------------------------------------------------------------------
  describe('setPendingImage', () => {
    it('sets the pending image', () => {
      const store = useAIChatStore()
      const image = { data: 'abc123', mimeType: 'image/jpeg' as const }
      store.setPendingImage(image)
      expect(store.pendingImage).toEqual(image)
    })

    it('clears the pending image with null', () => {
      const store = useAIChatStore()
      store.setPendingImage({ data: 'abc', mimeType: 'image/png' as const })
      store.setPendingImage(null)
      expect(store.pendingImage).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // 22. setQuota
  // -------------------------------------------------------------------------
  describe('setQuota', () => {
    it('updates the quota info', () => {
      const store = useAIChatStore()
      const quotaInfo = { remaining: 10, limit: 20, resetsAt: new Date(), canGenerate: true }
      store.setQuota(quotaInfo)
      expect(store.quota).toEqual(quotaInfo)
    })
  })

  // -------------------------------------------------------------------------
  // 23. canSend
  // -------------------------------------------------------------------------
  describe('canSend', () => {
    it('is true when not streaming and quota allows generation', () => {
      const store = useAIChatStore()
      store.setQuota({ remaining: 5, limit: 20, resetsAt: new Date(), canGenerate: true })
      expect(store.canSend).toBe(true)
    })

    it('is false when streaming', () => {
      const store = useAIChatStore()
      store.setQuota({ remaining: 5, limit: 20, resetsAt: new Date(), canGenerate: true })
      store.startAssistantMessage()
      expect(store.canSend).toBe(false)
    })

    it('is false when quota.canGenerate is false', () => {
      const store = useAIChatStore()
      store.setQuota({ remaining: 0, limit: 20, resetsAt: new Date(), canGenerate: false })
      expect(store.canSend).toBe(false)
    })

    it('is true when quota is null (no quota info yet)', () => {
      const store = useAIChatStore()
      // quota is null by default, canGenerate check uses !== false
      expect(store.canSend).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // 24. clearConversation
  // -------------------------------------------------------------------------
  describe('clearConversation', () => {
    it('resets messages, stream text, error, and pending image', () => {
      const store = useAIChatStore()
      store.addUserMessage('Hello')
      store.startAssistantMessage()
      store.appendStreamText('response')
      store.completeAssistantMessage()
      store.setError('err')
      store.setPendingImage({ data: 'img', mimeType: 'image/png' as const })

      store.clearConversation()

      expect(store.messages).toEqual([])
      expect(store.currentStreamText).toBe('')
      expect(store.error).toBeNull()
      expect(store.pendingImage).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // 25. getConversationHistory
  // -------------------------------------------------------------------------
  describe('getConversationHistory', () => {
    it('returns all messages when 10 or fewer', () => {
      const store = useAIChatStore()
      for (let i = 0; i < 5; i++) {
        store.addUserMessage(`Message ${i}`)
      }
      const history = store.getConversationHistory()
      expect(history).toHaveLength(5)
    })

    it('returns only the last 10 messages when more than 10 exist', () => {
      const store = useAIChatStore()
      for (let i = 0; i < 15; i++) {
        store.addUserMessage(`Message ${i}`)
      }
      const history = store.getConversationHistory()
      expect(history).toHaveLength(10)
      expect(history[0].content).toBe('Message 5')
      expect(history[9].content).toBe('Message 14')
    })
  })

  // -------------------------------------------------------------------------
  // lastAssistantMessage / lastGeneratedDesign
  // -------------------------------------------------------------------------
  describe('lastAssistantMessage', () => {
    it('returns undefined when no assistant messages exist', () => {
      const store = useAIChatStore()
      store.addUserMessage('Hello')
      expect(store.lastAssistantMessage).toBeUndefined()
    })

    it('returns the most recent assistant message', () => {
      const store = useAIChatStore()
      store.addUserMessage('First')
      store.startAssistantMessage()
      store.appendStreamText('Response 1')
      store.completeAssistantMessage()

      store.addUserMessage('Second')
      store.startAssistantMessage()
      store.appendStreamText('Response 2')
      store.completeAssistantMessage()

      expect(store.lastAssistantMessage?.content).toBe('Response 2')
    })
  })

  describe('lastGeneratedDesign', () => {
    it('returns the design from the last assistant message', () => {
      const store = useAIChatStore()
      const design = { version: '1.0', globalStyles: {}, widgets: [] }
      store.startAssistantMessage()
      store.appendStreamText('Here you go')
      store.completeAssistantMessage(design as any)

      expect(store.lastGeneratedDesign).toEqual(design)
    })

    it('returns undefined when no design was generated', () => {
      const store = useAIChatStore()
      store.startAssistantMessage()
      store.appendStreamText('No design this time')
      store.completeAssistantMessage()

      expect(store.lastGeneratedDesign).toBeUndefined()
    })
  })
})
