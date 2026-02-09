import { createPinia, defineStore, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'

vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('defineStore', defineStore)

const { useVariableSchemaStore } = await import('#editor/stores/variableSchema')

// ── Test data ──────────────────────────────────────────────

function createTestVariableField(overrides: Record<string, unknown> = {}) {
  return {
    name: 'firstName',
    type: 'recipient' as const,
    description: 'First name',
    example: 'Marie',
    ...overrides,
  }
}

function createTestDataSet(overrides: Record<string, unknown> = {}) {
  return {
    key: 'm1',
    merged_preview_data: {
      firstName: 'Marie',
      lastName: 'Dupont',
      nom_magasin: 'Boutique Paris',
    },
    ...overrides,
  }
}

function createTestSchema(overrides: Record<string, unknown> = {}) {
  return {
    uuid: 'schema-uuid-123',
    globalVariables: [
      createTestVariableField({ name: 'nom_magasin', type: 'global', description: 'Store name' }),
      createTestVariableField({ name: 'horaires', type: 'global', description: 'Opening hours' }),
    ],
    recipientVariables: [
      createTestVariableField({ name: 'firstName', type: 'recipient' }),
      createTestVariableField({ name: 'lastName', type: 'recipient', description: 'Last name' }),
    ],
    dataSets: [
      createTestDataSet({ key: 'm1' }),
      createTestDataSet({
        key: 'm2',
        merged_preview_data: {
          firstName: 'Jean',
          lastName: 'Martin',
          nom_magasin: 'Boutique Lyon',
        },
      }),
    ],
    ...overrides,
  }
}

// ── Tests ──────────────────────────────────────────────────

describe('useVariableSchemaStore', () => {
  beforeEach(() => {
    vi.stubGlobal('ref', ref)
    vi.stubGlobal('computed', computed)
    vi.stubGlobal('defineStore', defineStore)
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('has no schema initially', () => {
      const store = useVariableSchemaStore()
      expect(store.schema).toBeNull()
    })

    it('is not loading initially', () => {
      const store = useVariableSchemaStore()
      expect(store.isLoading).toBe(false)
    })

    it('has no error initially', () => {
      const store = useVariableSchemaStore()
      expect(store.error).toBeNull()
    })

    it('has no selected preview set key initially', () => {
      const store = useVariableSchemaStore()
      expect(store.selectedPreviewSetKey).toBeNull()
    })
  })

  describe('isAvailable getter', () => {
    it('returns false when no schema is loaded', () => {
      const store = useVariableSchemaStore()
      expect(store.isAvailable).toBe(false)
    })

    it('returns true when a schema is loaded', () => {
      const store = useVariableSchemaStore()
      store.setSchema(createTestSchema() as any)
      expect(store.isAvailable).toBe(true)
    })
  })

  describe('globalVariables getter', () => {
    it('returns empty array when no schema', () => {
      const store = useVariableSchemaStore()
      expect(store.globalVariables).toEqual([])
    })

    it('returns global variables from schema', () => {
      const store = useVariableSchemaStore()
      store.setSchema(createTestSchema() as any)
      expect(store.globalVariables).toHaveLength(2)
      expect(store.globalVariables[0].name).toBe('nom_magasin')
    })
  })

  describe('recipientVariables getter', () => {
    it('returns empty array when no schema', () => {
      const store = useVariableSchemaStore()
      expect(store.recipientVariables).toEqual([])
    })

    it('returns recipient variables from schema', () => {
      const store = useVariableSchemaStore()
      store.setSchema(createTestSchema() as any)
      expect(store.recipientVariables).toHaveLength(2)
      expect(store.recipientVariables[0].name).toBe('firstName')
    })
  })

  describe('allVariables getter', () => {
    it('returns empty array when no schema', () => {
      const store = useVariableSchemaStore()
      expect(store.allVariables).toEqual([])
    })

    it('combines global and recipient variables', () => {
      const store = useVariableSchemaStore()
      store.setSchema(createTestSchema() as any)
      expect(store.allVariables).toHaveLength(4)
    })
  })

  describe('variableNames getter', () => {
    it('returns empty array when no schema', () => {
      const store = useVariableSchemaStore()
      expect(store.variableNames).toEqual([])
    })

    it('returns names of all variables', () => {
      const store = useVariableSchemaStore()
      store.setSchema(createTestSchema() as any)
      expect(store.variableNames).toEqual(['nom_magasin', 'horaires', 'firstName', 'lastName'])
    })
  })

  describe('mergedPreviewData getter', () => {
    it('returns empty object when no schema', () => {
      const store = useVariableSchemaStore()
      expect(store.mergedPreviewData).toEqual({})
    })

    it('returns first data set preview data by default', () => {
      const store = useVariableSchemaStore()
      store.setSchema(createTestSchema() as any)
      expect(store.mergedPreviewData).toEqual({
        firstName: 'Marie',
        lastName: 'Dupont',
        nom_magasin: 'Boutique Paris',
      })
    })

    it('returns selected data set preview data', () => {
      const store = useVariableSchemaStore()
      store.setSchema(createTestSchema() as any)
      store.setPreviewSetKey('m2')
      expect(store.mergedPreviewData).toEqual({
        firstName: 'Jean',
        lastName: 'Martin',
        nom_magasin: 'Boutique Lyon',
      })
    })

    it('falls back to first data set if selected key not found', () => {
      const store = useVariableSchemaStore()
      store.setSchema(createTestSchema() as any)
      store.setPreviewSetKey('nonexistent')
      expect(store.mergedPreviewData.firstName).toBe('Marie')
    })
  })

  describe('globalDataSets getter', () => {
    it('returns empty array when no schema', () => {
      const store = useVariableSchemaStore()
      expect(store.globalDataSets).toEqual([])
    })

    it('returns data sets from schema', () => {
      const store = useVariableSchemaStore()
      store.setSchema(createTestSchema() as any)
      expect(store.globalDataSets).toHaveLength(2)
      expect(store.globalDataSets.map((d: any) => d.key)).toEqual(['m1', 'm2'])
    })
  })

  describe('setSchema', () => {
    it('sets the schema', () => {
      const store = useVariableSchemaStore()
      const schema = createTestSchema()
      store.setSchema(schema as any)
      expect(store.schema).toEqual(schema)
    })

    it('resets selectedPreviewSetKey when setting a new schema', () => {
      const store = useVariableSchemaStore()
      store.setSchema(createTestSchema() as any)
      store.setPreviewSetKey('m2')
      store.setSchema(createTestSchema({ uuid: 'new-uuid' }) as any)
      expect(store.selectedPreviewSetKey).toBeNull()
    })
  })

  describe('clearSchema', () => {
    it('clears the schema', () => {
      const store = useVariableSchemaStore()
      store.setSchema(createTestSchema() as any)
      store.clearSchema()
      expect(store.schema).toBeNull()
    })

    it('clears selectedPreviewSetKey', () => {
      const store = useVariableSchemaStore()
      store.setSchema(createTestSchema() as any)
      store.setPreviewSetKey('m2')
      store.clearSchema()
      expect(store.selectedPreviewSetKey).toBeNull()
    })

    it('clears error', () => {
      const store = useVariableSchemaStore()
      store.setSchema(createTestSchema() as any)
      store.clearSchema()
      expect(store.error).toBeNull()
    })
  })

  describe('setPreviewSetKey', () => {
    it('sets the selected preview set key', () => {
      const store = useVariableSchemaStore()
      store.setPreviewSetKey('m2')
      expect(store.selectedPreviewSetKey).toBe('m2')
    })
  })

  describe('reset', () => {
    it('resets all state to initial values', () => {
      const store = useVariableSchemaStore()
      store.setSchema(createTestSchema() as any)
      store.setPreviewSetKey('m2')
      store.reset()

      expect(store.schema).toBeNull()
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
      expect(store.selectedPreviewSetKey).toBeNull()
    })
  })
})
