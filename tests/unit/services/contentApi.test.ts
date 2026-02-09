import { describe, expect, it } from 'vitest'
import { stubEditorApi } from '../../helpers/stubs'

const api = stubEditorApi()

const { useContentApi } = await import('#editor/services/contentApi')

describe('useContentApi', () => {
  function createApi() {
    return useContentApi()
  }

  describe('createContent', () => {
    it('calls api.post with /contents and data', async () => {
      const response = { id: 1, type: 'landing-page', title: 'Test', status: 'DRAFT', createdAt: '2025-01-01', updatedAt: '2025-01-01' }
      api.post.mockResolvedValue(response)

      const result = await createApi().createContent({ type: 'landing-page' as any, title: 'Test' })

      expect(api.post).toHaveBeenCalledWith('/contents', { type: 'landing-page', title: 'Test' })
      expect(result).toEqual(response)
    })

    it('returns null on error', async () => {
      api.post.mockRejectedValue(new Error('Network error'))

      const result = await createApi().createContent({ type: 'landing-page' as any, title: 'Test' })

      expect(result).toBeNull()
    })
  })

  describe('loadDesign', () => {
    it('calls api.get with /contents/:id/design', async () => {
      const response = { id: 5, title: 'My Page', status: 'DRAFT', design: { widgets: [] }, updatedAt: '2025-01-01' }
      api.get.mockResolvedValue(response)

      const result = await createApi().loadDesign(5)

      expect(api.get).toHaveBeenCalledWith('/contents/5/design')
      expect(result).toEqual(response)
    })

    it('returns null on error', async () => {
      api.get.mockRejectedValue(new Error('Not found'))

      const result = await createApi().loadDesign(999)

      expect(result).toBeNull()
    })
  })

  describe('saveDesign', () => {
    it('calls api.put with /contents/:id/design and design payload', async () => {
      const design = { widgets: [], globalStyles: {} } as any
      const response = { success: true, id: 3, updatedAt: '2025-01-02' }
      api.put.mockResolvedValue(response)

      const result = await createApi().saveDesign(3, design)

      expect(api.put).toHaveBeenCalledWith('/contents/3/design', { design })
      expect(result).toEqual(response)
    })

    it('returns null on error', async () => {
      api.put.mockRejectedValue(new Error('Server error'))

      const result = await createApi().saveDesign(3, { widgets: [] } as any)

      expect(result).toBeNull()
    })
  })

  describe('updateContent', () => {
    it('calls api.patch with /contents/:id and data', async () => {
      const response = { id: 7, title: 'Updated', status: 'PUBLISHED', updatedAt: '2025-01-03' }
      api.patch.mockResolvedValue(response)

      const result = await createApi().updateContent(7, { title: 'Updated', status: 'PUBLISHED' })

      expect(api.patch).toHaveBeenCalledWith('/contents/7', { title: 'Updated', status: 'PUBLISHED' })
      expect(result).toEqual(response)
    })

    it('returns null on error', async () => {
      api.patch.mockRejectedValue(new Error('Forbidden'))

      const result = await createApi().updateContent(7, { title: 'Nope' })

      expect(result).toBeNull()
    })
  })

  describe('deleteContent', () => {
    it('returns true on success', async () => {
      api.delete.mockResolvedValue(undefined)

      const result = await createApi().deleteContent(10)

      expect(api.delete).toHaveBeenCalledWith('/contents/10')
      expect(result).toBe(true)
    })

    it('returns false on error', async () => {
      api.delete.mockRejectedValue(new Error('Not found'))

      const result = await createApi().deleteContent(10)

      expect(result).toBe(false)
    })
  })
})
