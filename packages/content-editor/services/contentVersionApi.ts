import type { ContentVersionAdapter } from '../types/editor-adapters'

export interface ContentVersionApi extends ContentVersionAdapter {}

export function useContentVersionApi(): ContentVersionApi {
  const { versionAdapter } = useEditorConfig()

  return {
    async getVersions(contentId, params?) {
      try {
        return await versionAdapter?.getVersions(contentId, params) ?? null
      }
      catch {
        return null
      }
    },

    async getVersion(contentId, versionId) {
      try {
        return await versionAdapter?.getVersion(contentId, versionId) ?? null
      }
      catch {
        return null
      }
    },

    async restoreVersion(contentId, versionId) {
      try {
        return await versionAdapter?.restoreVersion(contentId, versionId) ?? null
      }
      catch {
        return null
      }
    },
  }
}
