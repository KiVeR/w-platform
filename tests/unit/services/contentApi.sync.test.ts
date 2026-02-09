/* eslint-disable no-template-curly-in-string */
import { describe, expect, it, vi } from 'vitest'
import { stubEditorApi, stubEditorConfig } from '../../helpers/stubs'

// Stub dependencies first
stubEditorConfig()
const api = stubEditorApi()

// Mock the variable modules used by contentApi via direct imports
const mockMarkUsed = vi.fn()
const mockMarkUnused = vi.fn()
const mockStore = {
  isAvailable: false,
  schema: null as any,
  variableNames: [] as string[],
}

vi.mock('#editor/stores/variableSchema', () => ({
  useVariableSchemaStore: () => mockStore,
}))

vi.mock('#editor/composables/useVariableSchema', () => ({
  useVariableSchema: () => ({
    initialize: vi.fn(),
    loadSchema: vi.fn(),
    markUsed: mockMarkUsed,
    markUnused: mockMarkUnused,
  }),
}))

const { useContentApi } = await import('#editor/services/contentApi')

describe('contentApi syncVariableUsage', () => {
  it('calls markUsed/markUnused after successful save when schema is available', async () => {
    mockStore.isAvailable = true
    mockStore.schema = { uuid: 'test-uuid', globalVariables: [], recipientVariables: [], dataSets: [] }
    mockStore.variableNames = ['firstName', 'lastName', 'unused_var']
    mockMarkUsed.mockClear()
    mockMarkUnused.mockClear()

    api.put.mockResolvedValue({ success: true, id: 1, updatedAt: '2025-01-01' })

    const design = {
      widgets: [
        { id: '1', type: 'title', order: 0, content: { text: 'Hello ${firstName}' }, styles: {} },
        { id: '2', type: 'text', order: 1, content: { text: 'Dear ${lastName}, welcome' }, styles: {} },
      ],
      globalStyles: {},
    }

    await useContentApi().saveDesign(1, design as any)

    expect(mockMarkUsed).toHaveBeenCalledWith(['firstName', 'lastName'])
    expect(mockMarkUnused).toHaveBeenCalledWith(['unused_var'])
  })

  it('does not call markUsed/markUnused when no schema is available', async () => {
    mockStore.isAvailable = false
    mockStore.schema = null
    mockStore.variableNames = []
    mockMarkUsed.mockClear()
    mockMarkUnused.mockClear()

    api.put.mockResolvedValue({ success: true, id: 2, updatedAt: '2025-01-01' })

    const design = {
      widgets: [
        { id: '1', type: 'text', order: 0, content: { text: 'Hello ${name}' }, styles: {} },
      ],
      globalStyles: {},
    }

    await useContentApi().saveDesign(2, design as any)

    expect(mockMarkUsed).not.toHaveBeenCalled()
    expect(mockMarkUnused).not.toHaveBeenCalled()
  })

  it('extracts variables from nested children widgets', async () => {
    mockStore.isAvailable = true
    mockStore.schema = { uuid: 'test-uuid', globalVariables: [], recipientVariables: [], dataSets: [] }
    mockStore.variableNames = ['city', 'address']
    mockMarkUsed.mockClear()
    mockMarkUnused.mockClear()

    api.put.mockResolvedValue({ success: true, id: 3, updatedAt: '2025-01-01' })

    const design = {
      widgets: [
        {
          id: '1',
          type: 'row',
          order: 0,
          content: {},
          styles: {},
          children: [
            { id: '2', type: 'text', order: 0, content: { text: 'Located in ${city}' }, styles: {} },
          ],
        },
      ],
      globalStyles: {},
    }

    await useContentApi().saveDesign(3, design as any)

    expect(mockMarkUsed).toHaveBeenCalledWith(['city'])
    expect(mockMarkUnused).toHaveBeenCalledWith(['address'])
  })

  it('does not call mark when no variables are used', async () => {
    mockStore.isAvailable = true
    mockStore.schema = { uuid: 'test-uuid', globalVariables: [], recipientVariables: [], dataSets: [] }
    mockStore.variableNames = ['name']
    mockMarkUsed.mockClear()
    mockMarkUnused.mockClear()

    api.put.mockResolvedValue({ success: true, id: 4, updatedAt: '2025-01-01' })

    const design = {
      widgets: [
        { id: '1', type: 'text', order: 0, content: { text: 'No variables here' }, styles: {} },
      ],
      globalStyles: {},
    }

    await useContentApi().saveDesign(4, design as any)

    expect(mockMarkUsed).not.toHaveBeenCalled()
    expect(mockMarkUnused).toHaveBeenCalledWith(['name'])
  })
})
