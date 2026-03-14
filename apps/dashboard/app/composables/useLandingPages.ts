import { ref } from 'vue'
import { useApi } from '@/composables/useApi'
import { usePartnerScope } from '@/composables/usePartnerScope'
import type { LandingPageRow, LandingPageStatus } from '@/types/campaign'

function mapLandingPage(raw: Record<string, unknown>): LandingPageRow {
  return {
    id: Number(raw.id),
    name: String(raw.name ?? ''),
    status: String(raw.status ?? 'draft') as LandingPageStatus,
    is_active: raw.is_active === 'true' || raw.is_active === true,
    created_at: String(raw.created_at ?? ''),
  }
}

export function useLandingPages() {
  const api = useApi()
  const { withPartnerScope } = usePartnerScope()

  const landingPages = ref<LandingPageRow[]>([])
  const isLoading = ref(false)
  const hasError = ref(false)

  async function fetchLandingPages(): Promise<void> {
    isLoading.value = true
    hasError.value = false
    try {
      const { data, error } = await api.GET('/landing-pages' as never, {
        params: {
          query: withPartnerScope({
            'filter[status]': 'published',
          }),
        },
      } as never)
      if (error) {
        hasError.value = true
        return
      }
      if (data) {
        const raw = data as { data: Record<string, unknown>[] }
        landingPages.value = raw.data.map(mapLandingPage)
      }
    }
    catch {
      hasError.value = true
    }
    finally {
      isLoading.value = false
    }
  }

  return {
    landingPages,
    isLoading,
    hasError,
    fetchLandingPages,
  }
}
