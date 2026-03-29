import { ref, watch, type Ref } from 'vue'
import { useApi } from '@/composables/useApi'
import { mapShortUrl } from '@/utils/shortUrlMapper'
import type { ShortUrl } from '@/types/shortUrl'

type UpdateShortUrlPayload = Partial<Pick<ShortUrl, 'slug' | 'link' | 'import_id' | 'is_enabled' | 'is_draft' | 'is_traceable_by_recipient'>>

export function useShortUrlDetail(shortUrlId: Ref<number | null>) {
  const api = useApi()
  const shortUrl = ref<ShortUrl | null>(null)
  const isLoading = ref(false)
  const hasError = ref(false)

  async function fetchShortUrl(): Promise<void> {
    if (!shortUrlId.value) return
    isLoading.value = true
    hasError.value = false
    try {
      const { data: resp, error: apiError } = await api.GET('/short-urls/{shortUrlIdOrSlug}', {
        params: { path: { shortUrlIdOrSlug: String(shortUrlId.value) } },
      } as never)
      if (apiError) {
        hasError.value = true
        return
      }
      if (resp) {
        const raw = (resp as { data: Record<string, unknown> }).data
        shortUrl.value = mapShortUrl(raw)
      }
    }
    catch {
      hasError.value = true
    }
    finally {
      isLoading.value = false
    }
  }

  async function updateShortUrl(payload: UpdateShortUrlPayload): Promise<boolean> {
    if (!shortUrlId.value) return false
    isLoading.value = true
    hasError.value = false
    try {
      const { data: resp, error: apiError } = await api.PUT('/short-urls/{shortUrl}', {
        params: { path: { shortUrl: shortUrlId.value } },
        body: payload,
      } as never)
      if (apiError) {
        hasError.value = true
        return false
      }
      if (resp) {
        const raw = (resp as { data: Record<string, unknown> }).data
        shortUrl.value = mapShortUrl(raw)
      }
      return true
    }
    catch {
      hasError.value = true
      return false
    }
    finally {
      isLoading.value = false
    }
  }

  async function deleteShortUrl(): Promise<boolean> {
    if (!shortUrlId.value) return false
    isLoading.value = true
    hasError.value = false
    try {
      const { error: apiError } = await api.DELETE('/short-urls/{shortUrl}', {
        params: { path: { shortUrl: shortUrlId.value } },
      } as never)
      if (apiError) {
        hasError.value = true
        return false
      }
      return true
    }
    catch {
      hasError.value = true
      return false
    }
    finally {
      isLoading.value = false
    }
  }

  async function toggleEnabled(): Promise<boolean> {
    if (!shortUrlId.value || !shortUrl.value) return false
    return updateShortUrl({ is_enabled: !shortUrl.value.is_enabled })
  }

  watch(shortUrlId, (id) => {
    if (id) fetchShortUrl()
  })

  return { shortUrl, isLoading, hasError, fetchShortUrl, updateShortUrl, deleteShortUrl, toggleEnabled }
}
