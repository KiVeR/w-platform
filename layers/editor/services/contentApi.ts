export interface CreateContentRequest {
  type: ContentType
  title: string
}

export interface CreateContentResponse {
  id: number
  type: ContentType
  title: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface LoadContentDesignResponse {
  id: number
  title: string
  status: string
  variableSchemaUuid?: string | null
  design: DesignDocument
  updatedAt: string
}

export interface SaveContentDesignResponse {
  success: boolean
  id: number
  updatedAt: string
}

export interface UpdateContentResponse {
  id: number
  title: string
  status: string
  updatedAt: string
}

export interface ContentApi {
  createContent: (data: CreateContentRequest) => Promise<CreateContentResponse | null>
  loadDesign: (contentId: number) => Promise<LoadContentDesignResponse | null>
  saveDesign: (contentId: number, design: DesignDocument) => Promise<SaveContentDesignResponse | null>
  updateContent: (contentId: number, data: { title?: string, status?: string }) => Promise<UpdateContentResponse | null>
  deleteContent: (contentId: number) => Promise<boolean>
  attachSchema: (contentId: number, uuid: string) => Promise<UpdateContentResponse | null>
  detachSchema: (contentId: number) => Promise<UpdateContentResponse | null>
}

/**
 * Scan all widgets in a design to find used variables,
 * then call markUsed / markUnused on the schema.
 * Wrapped in try/catch — this is fire-and-forget, must never break save.
 *
 * Accepts the api instance from the caller since this function runs outside
 * Vue setup scope and cannot call inject()-based composables.
 */
function syncVariableUsage(design: DesignDocument, api: ReturnType<typeof useEditorApi>): void {
  try {
    const store = useVariableSchemaStore()
    if (!store.isAvailable || !store.schema?.uuid)
      return

    // Collect all text content from widgets
    const allText = extractAllTextContent(design.widgets)

    // Find used variable names
    const usedNames = new Set<string>()
    for (const text of allText) {
      for (const match of text.matchAll(VARIABLE_PATTERN)) {
        usedNames.add(match[1])
      }
    }

    // Diff against known schema variables
    const knownNames = new Set(store.variableNames)
    const used = [...usedNames].filter(n => knownNames.has(n))
    const unused = [...knownNames].filter(n => !usedNames.has(n))

    // Fire-and-forget — non-blocking, non-critical
    const uuid = store.schema.uuid
    if (used.length > 0)
      api.post(`/variable-schemas/${uuid}/mark-used`, { variables: used })
    if (unused.length > 0)
      api.post(`/variable-schemas/${uuid}/mark-unused`, { variables: unused })
  }
  catch {
    // Silently fail — variable sync is non-critical
  }
}

/**
 * Recursively extract all string values from widget content fields.
 */
function extractAllTextContent(widgets: Widget[]): string[] {
  const texts: string[] = []
  for (const widget of widgets) {
    if (widget.content) {
      for (const value of Object.values(widget.content)) {
        if (typeof value === 'string')
          texts.push(value)
      }
    }
    if (widget.children)
      texts.push(...extractAllTextContent(widget.children))
  }
  return texts
}

export function useContentApi(): ContentApi {
  const api = useEditorApi()

  return {
    async createContent(data) {
      try {
        return await api.post<CreateContentResponse>('/contents', data)
      }
      catch {
        return null
      }
    },

    async loadDesign(contentId) {
      try {
        return await api.get<LoadContentDesignResponse>(`/contents/${contentId}/design`)
      }
      catch {
        return null
      }
    },

    async saveDesign(contentId, design) {
      try {
        const result = await api.put<SaveContentDesignResponse>(`/contents/${contentId}/design`, { design })

        // After successful save, sync variable usage with the schema
        syncVariableUsage(design, api)

        return result
      }
      catch {
        return null
      }
    },

    async updateContent(contentId, data) {
      try {
        return await api.patch<UpdateContentResponse>(`/contents/${contentId}`, data)
      }
      catch {
        return null
      }
    },

    async deleteContent(contentId) {
      try {
        await api.delete(`/contents/${contentId}`)
        return true
      }
      catch {
        return false
      }
    },

    async attachSchema(contentId, uuid) {
      try {
        return await api.patch<UpdateContentResponse>(`/contents/${contentId}`, { variableSchemaUuid: uuid })
      }
      catch {
        return null
      }
    },

    async detachSchema(contentId) {
      try {
        return await api.patch<UpdateContentResponse>(`/contents/${contentId}`, { variableSchemaUuid: null })
      }
      catch {
        return null
      }
    },
  }
}
