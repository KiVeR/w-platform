import { usePartnerStore } from '@/stores/partner'

function normalizeLandingPageStatus(status: unknown): PageStatusType {
  const normalized = String(status ?? 'draft').toUpperCase()
  if (normalized === 'PUBLISHED' || normalized === 'ARCHIVED')
    return normalized
  return 'DRAFT'
}

function denormalizeLandingPageStatus(status: PageStatusType | undefined): string | undefined {
  return status?.toLowerCase()
}

function mapLandingPageTitle(raw: Record<string, unknown>, fallback = ''): string {
  return String(raw.name ?? raw.title ?? fallback)
}

export function useLandingPageEditorAdapter() {
  const partnerStore = usePartnerStore()

  function buildContentAdapter(api: ReturnType<typeof createEditorApiClient>): EditorConfig['contentAdapter'] {
    return {
      async createContent(data) {
        const body: Record<string, unknown> = {
          name: data.title,
          status: 'draft',
          is_active: false,
        }

        const partnerId = partnerStore.effectivePartnerId
        if (partnerId !== null)
          body.partner_id = partnerId

        const response = await api.post<{ data: Record<string, unknown> }>('/landing-pages', body)
        const raw = response.data

        return {
          id: Number(raw.id),
          type: data.type,
          title: mapLandingPageTitle(raw, data.title),
          status: normalizeLandingPageStatus(raw.status),
          createdAt: String(raw.created_at ?? new Date().toISOString()),
          updatedAt: String(raw.updated_at ?? raw.created_at ?? new Date().toISOString()),
        }
      },

      async loadDesign(contentId) {
        const response = await api.get<{ data: Record<string, unknown> }>(`/landing-pages/${contentId}/design`)
        const raw = response.data

        return {
          id: Number(raw.id),
          title: mapLandingPageTitle(raw),
          status: normalizeLandingPageStatus(raw.status),
          variableSchemaUuid: typeof raw.variableSchemaUuid === 'string' ? raw.variableSchemaUuid : null,
          design: (raw.design as DesignDocument | null) ?? {
            version: '1.0',
            globalStyles: {
              palette: 'turquoise',
              backgroundColor: '#ffffff',
              textColor: '#1e293b',
              primaryColor: '#14b8a6',
              secondaryColor: '#0d9488',
              fontFamily: 'Inter, system-ui, sans-serif',
              headingFontFamily: 'Inter, system-ui, sans-serif',
              baseFontSize: '16px',
              lineHeight: '1.6',
              contentPadding: '16px',
              widgetGap: '12px',
              borderRadius: '8px',
              pageTitle: '',
              metaDescription: '',
            },
            widgets: [],
          },
          updatedAt: String(raw.updatedAt ?? raw.updated_at ?? new Date().toISOString()),
        }
      },

      async saveDesign(contentId, design) {
        const response = await api.put<{ data: Record<string, unknown> }>(`/landing-pages/${contentId}/design`, { design })
        const raw = response.data

        return {
          success: true,
          id: Number(raw.id),
          updatedAt: String(raw.updatedAt ?? raw.updated_at ?? new Date().toISOString()),
        }
      },

      async updateContent(contentId, data) {
        const body: Record<string, unknown> = {}
        if (data.title !== undefined)
          body.name = data.title
        if (data.status !== undefined)
          body.status = denormalizeLandingPageStatus(data.status)

        const response = await api.put<{ data: Record<string, unknown> }>(`/landing-pages/${contentId}`, body)
        const raw = response.data

        return {
          id: Number(raw.id),
          title: mapLandingPageTitle(raw, String(body.name ?? '')),
          status: normalizeLandingPageStatus(raw.status),
          updatedAt: String(raw.updated_at ?? new Date().toISOString()),
        }
      },

      async deleteContent(contentId) {
        await api.delete(`/landing-pages/${contentId}`)
        return true
      },

      async attachSchema(contentId, uuid) {
        await api.post(`/landing-pages/${contentId}/variable-schema`, { variable_schema_uuid: uuid })
        return {
          id: contentId,
          title: '',
          status: 'DRAFT',
          updatedAt: new Date().toISOString(),
        }
      },

      async detachSchema(contentId) {
        await api.delete(`/landing-pages/${contentId}/variable-schema`)
        return {
          id: contentId,
          title: '',
          status: 'DRAFT',
          updatedAt: new Date().toISOString(),
        }
      },
    }
  }

  return {
    buildContentAdapter,
  }
}
