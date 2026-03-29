import { ref, computed, type Ref } from 'vue'
import { useApi } from '@/composables/useApi'
import type { ShortUrl } from '@/types/shortUrl'

export function useShortUrlForm(existingShortUrl?: Ref<ShortUrl | null>) {
  const api = useApi()

  const form = ref({
    slug: '',
    link: '',
    is_traceable_by_recipient: false,
    is_draft: false,
    is_enabled: true,
    prefix: '',
    length: 6,
  })
  const isSaving = ref(false)
  const saveError = ref<string | null>(null)
  const fakePreview = ref<string | null>(null)

  const isEditMode = computed(() => !!existingShortUrl?.value)

  // Populate form from existing short URL in edit mode
  function populateFromExisting(): void {
    if (!existingShortUrl?.value) return
    const su = existingShortUrl.value
    form.value.slug = su.slug
    form.value.link = su.link ?? ''
    form.value.is_traceable_by_recipient = su.is_traceable_by_recipient
    form.value.is_draft = su.is_draft
    form.value.is_enabled = su.is_enabled
  }

  // Generate fake preview via POST /short-urls with fake=true
  async function generatePreview(): Promise<void> {
    try {
      const { data: resp, error: apiError } = await api.POST('/short-urls', {
        body: {
          link: form.value.link || 'https://example.com',
          prefix: form.value.prefix || undefined,
          length: form.value.length || undefined,
          fake: true,
        },
      } as never)
      if (apiError) return
      if (resp) {
        const raw = (resp as { data: Record<string, unknown> }).data
        fakePreview.value = String(raw.slug ?? '')
      }
    } catch { /* silently fail */ }
  }

  // Submit create or update
  async function submit(): Promise<number | null> {
    isSaving.value = true
    saveError.value = null
    try {
      if (isEditMode.value && existingShortUrl?.value) {
        // UPDATE
        const { data: resp, error: apiError } = await api.PUT('/short-urls/{shortUrl}', {
          params: { path: { shortUrl: existingShortUrl.value.id } },
          body: {
            slug: form.value.slug || undefined,
            link: form.value.link || undefined,
            is_draft: form.value.is_draft,
            is_enabled: form.value.is_enabled,
            is_traceable_by_recipient: form.value.is_traceable_by_recipient,
          },
        } as never)
        if (apiError) { saveError.value = 'save_error'; return null }
        if (resp) {
          const raw = (resp as { data: Record<string, unknown> }).data
          return Number(raw.id)
        }
      } else {
        // CREATE
        const { data: resp, error: apiError } = await api.POST('/short-urls', {
          body: {
            slug: form.value.slug || undefined,
            link: form.value.link,
            prefix: form.value.prefix || undefined,
            length: form.value.length || undefined,
            is_traceable_by_recipient: form.value.is_traceable_by_recipient || undefined,
          },
        } as never)
        if (apiError) { saveError.value = 'save_error'; return null }
        if (resp) {
          const raw = (resp as { data: Record<string, unknown> }).data
          return Number(raw.id)
        }
      }
      return null
    } catch {
      saveError.value = 'save_error'
      return null
    } finally {
      isSaving.value = false
    }
  }

  return { form, isSaving, saveError, fakePreview, isEditMode, populateFromExisting, generatePreview, submit }
}
