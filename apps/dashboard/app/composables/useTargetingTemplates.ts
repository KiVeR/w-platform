import { ref } from 'vue'
import { useApi } from '@/composables/useApi'
import { usePartnerScope } from '@/composables/usePartnerScope'
import type { CampaignTargeting, TargetingTemplateRow } from '@/types/campaign'

function mapTemplate(raw: Record<string, unknown>): TargetingTemplateRow {
  const targeting = raw.targeting_json
  return {
    id: Number(raw.id),
    partner_id: raw.partner_id != null ? Number(raw.partner_id) : null,
    name: String(raw.name ?? ''),
    targeting_json: (typeof targeting === 'string' ? JSON.parse(targeting) : targeting) as CampaignTargeting,
    usage_count: Number(raw.usage_count ?? 0),
    last_used_at: raw.last_used_at ? String(raw.last_used_at) : null,
    is_preset: raw.is_preset === 'true' || raw.is_preset === true,
    category: raw.category ? String(raw.category) : null,
    created_at: String(raw.created_at ?? ''),
  }
}

export function useTargetingTemplates() {
  const api = useApi()
  const { withPartnerScope } = usePartnerScope()

  const templates = ref<TargetingTemplateRow[]>([])
  const presets = ref<TargetingTemplateRow[]>([])
  const isLoading = ref(false)
  const hasError = ref(false)

  async function fetchTemplates(activityType?: string | null): Promise<void> {
    isLoading.value = true
    hasError.value = false
    try {
      const { data, error } = await api.GET('/targeting-templates', {
        params: {
          query: withPartnerScope({
            'filter[is_preset]': 0,
            'sort': '-last_used_at',
          }),
        } as { query: Record<string, unknown> },
      })
      if (error) {
        hasError.value = true
        return
      }
      if (data) {
        const raw = data as { data: Record<string, unknown>[] }
        templates.value = raw.data.map(mapTemplate)
      }

      const presetQuery: Record<string, unknown> = { 'filter[is_preset]': 1 }
      if (activityType) {
        presetQuery['filter[category]'] = activityType
      }
      const { data: presetData, error: presetError } = await api.GET('/targeting-templates', {
        params: {
          query: presetQuery,
        } as { query: Record<string, unknown> },
      })
      if (!presetError && presetData) {
        const raw = presetData as { data: Record<string, unknown>[] }
        presets.value = raw.data.map(mapTemplate)
      }
    }
    catch {
      hasError.value = true
    }
    finally {
      isLoading.value = false
    }
  }

  async function useTemplate(id: number): Promise<CampaignTargeting | null> {
    const { data, error } = await api.POST('/targeting-templates/{targeting_template}/use', {
      params: { path: { targeting_template: id } },
    } as never)
    if (error || !data) return null
    const raw = (data as { data: Record<string, unknown> }).data
    return mapTemplate(raw).targeting_json
  }

  async function deleteTemplate(id: number): Promise<boolean> {
    const { error } = await api.DELETE('/targeting-templates/{targeting_template}', {
      params: { path: { targeting_template: id } },
    } as never)
    if (error) return false
    templates.value = templates.value.filter(t => t.id !== id)
    return true
  }

  return {
    templates,
    presets,
    isLoading,
    hasError,
    fetchTemplates,
    useTemplate,
    deleteTemplate,
  }
}
