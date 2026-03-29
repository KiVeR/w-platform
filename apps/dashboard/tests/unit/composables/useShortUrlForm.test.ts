import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { stubAuthGlobals } from '../../helpers/auth-stubs'

const mockPost = vi.fn()
const mockPut = vi.fn()

vi.mock('@/composables/useApi', () => ({
  useApi: () => ({
    POST: mockPost,
    PUT: mockPut,
  }),
}))

const shortUrlFixture = {
  id: 42,
  slug: 'abc123',
  link: 'https://example.com',
  click_count: 5,
  click_count_bots: 0,
  is_draft: false,
  is_enabled: true,
  is_traceable_by_recipient: true,
  import_id: null,
}

describe('useShortUrlForm', () => {
  beforeEach(() => {
    stubAuthGlobals()
    vi.clearAllMocks()
  })

  it('initialises with default values in create mode', async () => {
    const { useShortUrlForm } = await import('@/composables/useShortUrlForm')
    const { form, isSaving, saveError, fakePreview } = useShortUrlForm()

    expect(form.value.slug).toBe('')
    expect(form.value.link).toBe('')
    expect(form.value.is_traceable_by_recipient).toBe(false)
    expect(form.value.is_draft).toBe(false)
    expect(form.value.is_enabled).toBe(true)
    expect(form.value.prefix).toBe('')
    expect(form.value.length).toBe(6)
    expect(isSaving.value).toBe(false)
    expect(saveError.value).toBeNull()
    expect(fakePreview.value).toBeNull()
  })

  it('isEditMode is false in create mode (no argument)', async () => {
    const { useShortUrlForm } = await import('@/composables/useShortUrlForm')
    const { isEditMode } = useShortUrlForm()

    expect(isEditMode.value).toBe(false)
  })

  it('isEditMode is false when ref holds null', async () => {
    const { useShortUrlForm } = await import('@/composables/useShortUrlForm')
    const existing = ref(null)
    const { isEditMode } = useShortUrlForm(existing)

    expect(isEditMode.value).toBe(false)
  })

  it('isEditMode is true when existingShortUrl is provided with a value', async () => {
    const { useShortUrlForm } = await import('@/composables/useShortUrlForm')
    const existing = ref(shortUrlFixture)
    const { isEditMode } = useShortUrlForm(existing)

    expect(isEditMode.value).toBe(true)
  })

  it('populateFromExisting fills form fields from existing short URL', async () => {
    const { useShortUrlForm } = await import('@/composables/useShortUrlForm')
    const existing = ref({ ...shortUrlFixture, link: 'https://filled.com', slug: 'filled-slug' })
    const { form, populateFromExisting } = useShortUrlForm(existing)

    populateFromExisting()

    expect(form.value.slug).toBe('filled-slug')
    expect(form.value.link).toBe('https://filled.com')
    expect(form.value.is_traceable_by_recipient).toBe(true)
    expect(form.value.is_draft).toBe(false)
    expect(form.value.is_enabled).toBe(true)
  })

  it('populateFromExisting handles null link by setting empty string', async () => {
    const { useShortUrlForm } = await import('@/composables/useShortUrlForm')
    const existing = ref({ ...shortUrlFixture, link: null })
    const { form, populateFromExisting } = useShortUrlForm(existing)

    populateFromExisting()

    expect(form.value.link).toBe('')
  })

  it('populateFromExisting does nothing when existingShortUrl is null', async () => {
    const { useShortUrlForm } = await import('@/composables/useShortUrlForm')
    const existing = ref<typeof shortUrlFixture | null>(null)
    const { form, populateFromExisting } = useShortUrlForm(existing)

    form.value.slug = 'untouched'
    populateFromExisting()

    expect(form.value.slug).toBe('untouched')
  })

  it('submit in create mode calls POST /short-urls with correct data', async () => {
    mockPost.mockResolvedValueOnce({ data: { data: { id: 99 } }, error: null })

    const { useShortUrlForm } = await import('@/composables/useShortUrlForm')
    const { form, submit } = useShortUrlForm()

    form.value.link = 'https://my-link.com'
    form.value.is_traceable_by_recipient = true

    await submit()

    expect(mockPost).toHaveBeenCalledWith(
      '/short-urls',
      expect.objectContaining({
        body: expect.objectContaining({
          link: 'https://my-link.com',
          is_traceable_by_recipient: true,
        }),
      }),
    )
  })

  it('submit in create mode returns the id from response', async () => {
    mockPost.mockResolvedValueOnce({ data: { data: { id: 99 } }, error: null })

    const { useShortUrlForm } = await import('@/composables/useShortUrlForm')
    const { form, submit } = useShortUrlForm()
    form.value.link = 'https://my-link.com'

    const result = await submit()

    expect(result).toBe(99)
  })

  it('submit in create mode omits optional fields when empty', async () => {
    mockPost.mockResolvedValueOnce({ data: { data: { id: 1 } }, error: null })

    const { useShortUrlForm } = await import('@/composables/useShortUrlForm')
    const { form, submit } = useShortUrlForm()
    form.value.link = 'https://my-link.com'
    form.value.slug = ''
    form.value.prefix = ''

    await submit()

    const body = mockPost.mock.calls[0][1].body
    expect(body.slug).toBeUndefined()
    expect(body.prefix).toBeUndefined()
  })

  it('submit in edit mode calls PUT /short-urls/{id}', async () => {
    mockPut.mockResolvedValueOnce({ data: { data: { id: 42 } }, error: null })

    const { useShortUrlForm } = await import('@/composables/useShortUrlForm')
    const existing = ref({ ...shortUrlFixture })
    const { form, submit } = useShortUrlForm(existing)
    form.value.slug = 'new-slug'

    await submit()

    expect(mockPut).toHaveBeenCalledWith(
      '/short-urls/{shortUrl}',
      expect.objectContaining({
        params: { path: { shortUrl: 42 } },
      }),
    )
  })

  it('submit in edit mode returns the id from response', async () => {
    mockPut.mockResolvedValueOnce({ data: { data: { id: 42 } }, error: null })

    const { useShortUrlForm } = await import('@/composables/useShortUrlForm')
    const existing = ref({ ...shortUrlFixture })
    const { submit } = useShortUrlForm(existing)

    const result = await submit()

    expect(result).toBe(42)
  })

  it('submit sets saveError and returns null on API error (create)', async () => {
    mockPost.mockResolvedValueOnce({ data: null, error: { message: 'Unprocessable' } })

    const { useShortUrlForm } = await import('@/composables/useShortUrlForm')
    const { form, saveError, submit } = useShortUrlForm()
    form.value.link = 'https://my-link.com'

    const result = await submit()

    expect(result).toBeNull()
    expect(saveError.value).toBe('save_error')
  })

  it('submit sets saveError and returns null on API error (edit)', async () => {
    mockPut.mockResolvedValueOnce({ data: null, error: { message: 'Forbidden' } })

    const { useShortUrlForm } = await import('@/composables/useShortUrlForm')
    const existing = ref({ ...shortUrlFixture })
    const { saveError, submit } = useShortUrlForm(existing)

    const result = await submit()

    expect(result).toBeNull()
    expect(saveError.value).toBe('save_error')
  })

  it('submit sets saveError and returns null when POST throws', async () => {
    mockPost.mockRejectedValueOnce(new Error('Network error'))

    const { useShortUrlForm } = await import('@/composables/useShortUrlForm')
    const { form, saveError, submit } = useShortUrlForm()
    form.value.link = 'https://my-link.com'

    const result = await submit()

    expect(result).toBeNull()
    expect(saveError.value).toBe('save_error')
  })

  it('submit resets isSaving to false after completion', async () => {
    mockPost.mockResolvedValueOnce({ data: { data: { id: 1 } }, error: null })

    const { useShortUrlForm } = await import('@/composables/useShortUrlForm')
    const { form, isSaving, submit } = useShortUrlForm()
    form.value.link = 'https://my-link.com'

    const promise = submit()
    await promise

    expect(isSaving.value).toBe(false)
  })

  it('generatePreview calls POST /short-urls with fake=true', async () => {
    mockPost.mockResolvedValueOnce({ data: { data: { slug: 'pr3v1ew' } }, error: null })

    const { useShortUrlForm } = await import('@/composables/useShortUrlForm')
    const { form, generatePreview } = useShortUrlForm()
    form.value.link = 'https://target.com'

    await generatePreview()

    expect(mockPost).toHaveBeenCalledWith(
      '/short-urls',
      expect.objectContaining({
        body: expect.objectContaining({ fake: true }),
      }),
    )
  })

  it('generatePreview updates fakePreview with slug from response', async () => {
    mockPost.mockResolvedValueOnce({ data: { data: { slug: 'pr3v1ew' } }, error: null })

    const { useShortUrlForm } = await import('@/composables/useShortUrlForm')
    const { form, fakePreview, generatePreview } = useShortUrlForm()
    form.value.link = 'https://target.com'

    await generatePreview()

    expect(fakePreview.value).toBe('pr3v1ew')
  })

  it('generatePreview uses fallback link when form.link is empty', async () => {
    mockPost.mockResolvedValueOnce({ data: { data: { slug: 'xyz' } }, error: null })

    const { useShortUrlForm } = await import('@/composables/useShortUrlForm')
    const { generatePreview } = useShortUrlForm()

    await generatePreview()

    const body = mockPost.mock.calls[0][1].body
    expect(body.link).toBe('https://example.com')
  })

  it('generatePreview silently ignores API errors', async () => {
    mockPost.mockResolvedValueOnce({ data: null, error: { message: 'Error' } })

    const { useShortUrlForm } = await import('@/composables/useShortUrlForm')
    const { fakePreview, generatePreview } = useShortUrlForm()

    await expect(generatePreview()).resolves.toBeUndefined()
    expect(fakePreview.value).toBeNull()
  })

  it('generatePreview silently ignores thrown exceptions', async () => {
    mockPost.mockRejectedValueOnce(new Error('Network error'))

    const { useShortUrlForm } = await import('@/composables/useShortUrlForm')
    const { fakePreview, generatePreview } = useShortUrlForm()

    await expect(generatePreview()).resolves.toBeUndefined()
    expect(fakePreview.value).toBeNull()
  })
})
