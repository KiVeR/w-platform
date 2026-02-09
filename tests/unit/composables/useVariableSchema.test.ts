import { createPinia, defineStore, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import { stubEditorApi, stubEditorConfig } from '../../helpers/stubs'

vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('defineStore', defineStore)

// ── Test data ──────────────────────────────────────────────

function createApiSchemaResponse(overrides: Record<string, unknown> = {}) {
  return {
    uuid: 'schema-uuid-123',
    globalVariables: [
      { name: 'nom_magasin', type: 'global', description: 'Store name' },
      { name: 'horaires', type: 'global', description: 'Opening hours' },
    ],
    recipientVariables: [
      { name: 'firstName', type: 'recipient', description: 'First name' },
      { name: 'lastName', type: 'recipient', description: 'Last name' },
    ],
    dataSets: [
      {
        key: 'm1',
        merged_preview_data: {
          firstName: 'Marie',
          lastName: 'Dupont',
          nom_magasin: 'Boutique Paris',
        },
      },
    ],
    ...overrides,
  }
}

// ── Tests ──────────────────────────────────────────────────

describe('useVariableSchema', () => {
  let api: ReturnType<typeof stubEditorApi>

  beforeEach(() => {
    vi.stubGlobal('ref', ref)
    vi.stubGlobal('computed', computed)
    vi.stubGlobal('defineStore', defineStore)
    setActivePinia(createPinia())
    stubEditorConfig()
    api = stubEditorApi()
  })

  async function loadComposable() {
    const mod = await import('#editor/composables/useVariableSchema')
    return mod.useVariableSchema()
  }

  describe('initialize', () => {
    it('loads schema from API when schemaUuid is provided', async () => {
      const schemaResponse = createApiSchemaResponse()
      api.get.mockResolvedValue(schemaResponse)

      const { initialize } = await loadComposable()
      await initialize({ schemaUuid: 'schema-uuid-123' })

      expect(api.get).toHaveBeenCalledWith('/variable-schemas/schema-uuid-123')
    })

    it('uses provided schema directly without API call', async () => {
      const schema = createApiSchemaResponse()

      const { initialize } = await loadComposable()
      await initialize({ schema: schema as any })

      expect(api.get).not.toHaveBeenCalled()
    })

    it('does nothing if neither schemaUuid nor schema provided', async () => {
      const { initialize } = await loadComposable()
      await initialize({})

      expect(api.get).not.toHaveBeenCalled()
    })

    it('sets the schema in the store after API load', async () => {
      const schemaResponse = createApiSchemaResponse()
      api.get.mockResolvedValue(schemaResponse)

      const mod = await import('#editor/composables/useVariableSchema')
      const { initialize } = mod.useVariableSchema()
      await initialize({ schemaUuid: 'schema-uuid-123' })

      const storeModule = await import('#editor/stores/variableSchema')
      const store = storeModule.useVariableSchemaStore()
      expect(store.isAvailable).toBe(true)
    })

    it('sets previewDataSetKey if provided', async () => {
      const schemaResponse = createApiSchemaResponse()
      api.get.mockResolvedValue(schemaResponse)

      const mod = await import('#editor/composables/useVariableSchema')
      const { initialize } = mod.useVariableSchema()
      await initialize({ schemaUuid: 'schema-uuid-123', previewDataSetKey: 'm1' })

      const storeModule = await import('#editor/stores/variableSchema')
      const store = storeModule.useVariableSchemaStore()
      expect(store.selectedPreviewSetKey).toBe('m1')
    })
  })

  describe('loadSchema', () => {
    it('fetches schema by UUID and sets it in store', async () => {
      const schemaResponse = createApiSchemaResponse()
      api.get.mockResolvedValue(schemaResponse)

      const { loadSchema } = await loadComposable()
      await loadSchema('schema-uuid-123')

      expect(api.get).toHaveBeenCalledWith('/variable-schemas/schema-uuid-123')
    })

    it('handles API error gracefully', async () => {
      api.get.mockRejectedValue(new Error('Network error'))

      const { loadSchema } = await loadComposable()

      // Should not throw
      await expect(loadSchema('bad-uuid')).resolves.not.toThrow()
    })

    it('sets error in store on API failure', async () => {
      api.get.mockRejectedValue(new Error('Network error'))

      const mod = await import('#editor/composables/useVariableSchema')
      const { loadSchema } = mod.useVariableSchema()
      await loadSchema('bad-uuid')

      const storeModule = await import('#editor/stores/variableSchema')
      const store = storeModule.useVariableSchemaStore()
      expect(store.error).toBeTruthy()
    })
  })

  describe('markUsed', () => {
    it('sends POST with variable names to mark-used endpoint', async () => {
      const schemaResponse = createApiSchemaResponse()
      api.get.mockResolvedValue(schemaResponse)
      api.post.mockResolvedValue({})

      const { initialize, markUsed } = await loadComposable()
      await initialize({ schemaUuid: 'schema-uuid-123' })
      await markUsed(['firstName', 'nom_magasin'])

      expect(api.post).toHaveBeenCalledWith(
        '/variable-schemas/schema-uuid-123/mark-used',
        { variables: ['firstName', 'nom_magasin'] },
      )
    })

    it('does nothing if no schema is loaded', async () => {
      const { markUsed } = await loadComposable()
      await markUsed(['firstName'])
      expect(api.post).not.toHaveBeenCalled()
    })
  })

  describe('markUnused', () => {
    it('sends POST with variable names to mark-unused endpoint', async () => {
      const schemaResponse = createApiSchemaResponse()
      api.get.mockResolvedValue(schemaResponse)
      api.post.mockResolvedValue({})

      const { initialize, markUnused } = await loadComposable()
      await initialize({ schemaUuid: 'schema-uuid-123' })
      await markUnused(['lastName'])

      expect(api.post).toHaveBeenCalledWith(
        '/variable-schemas/schema-uuid-123/mark-unused',
        { variables: ['lastName'] },
      )
    })

    it('does nothing if no schema is loaded', async () => {
      const { markUnused } = await loadComposable()
      await markUnused(['lastName'])
      expect(api.post).not.toHaveBeenCalled()
    })
  })
})
