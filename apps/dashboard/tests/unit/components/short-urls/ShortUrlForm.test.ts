import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { computed, ref, watch } from 'vue'
import { mockUseI18n } from '../../../helpers/stubs'
import type { ShortUrl } from '@/types/shortUrl'

mockUseI18n()
vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
vi.stubGlobal('watch', watch)

// Mock useShortUrlForm composable
const mockForm = ref({
  slug: '',
  link: '',
  is_traceable_by_recipient: false,
  is_draft: false,
  is_enabled: true,
  prefix: '',
  length: 6,
})
const mockIsSaving = ref(false)
const mockSaveError = ref<string | null>(null)
const mockFakePreview = ref<string | null>(null)
const mockIsEditMode = ref(false)
const mockPopulateFromExisting = vi.fn()
const mockGeneratePreview = vi.fn()
const mockSubmit = vi.fn()

vi.mock('@/composables/useShortUrlForm', () => ({
  useShortUrlForm: () => ({
    form: mockForm,
    isSaving: mockIsSaving,
    saveError: mockSaveError,
    fakePreview: mockFakePreview,
    isEditMode: mockIsEditMode,
    populateFromExisting: mockPopulateFromExisting,
    generatePreview: mockGeneratePreview,
    submit: mockSubmit,
  }),
}))

const ShortUrlForm = (await import('@/components/short-urls/ShortUrlForm.vue')).default

const slotStub = { template: '<div v-bind="$attrs"><slot /></div>' }

const baseStubs = {
  Card: slotStub,
  CardHeader: slotStub,
  CardTitle: { template: '<h2><slot /></h2>' },
  CardContent: slotStub,
  CardFooter: slotStub,
  Input: { template: '<input v-bind="$attrs" />', inheritAttrs: false },
  Label: { template: '<label><slot /></label>' },
  Switch: {
    template: '<input type="checkbox" :checked="checked" @change="$emit(\'update:checked\', $event.target.checked)" v-bind="$attrs" />',
    props: ['checked'],
    emits: ['update:checked'],
  },
  Button: {
    template: '<button v-bind="$attrs" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
    props: ['variant', 'disabled'],
    emits: ['click'],
  },
  Eye: { template: '<span data-icon-eye />' },
}

function mountForm(props: { shortUrl?: ShortUrl } = {}) {
  return mount(ShortUrlForm, {
    props,
    global: { stubs: baseStubs },
  })
}

const fakeShortUrl: ShortUrl = {
  id: 42,
  slug: 'promo-test',
  link: 'https://example.com',
  click_count: 5,
  click_count_bots: 0,
  is_draft: false,
  import_id: null,
  is_traceable_by_recipient: true,
  is_enabled: true,
}

describe('ShortUrlForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsEditMode.value = false
    mockSaveError.value = null
    mockFakePreview.value = null
    mockIsSaving.value = false
    mockForm.value = {
      slug: '',
      link: '',
      is_traceable_by_recipient: false,
      is_draft: false,
      is_enabled: true,
      prefix: '',
      length: 6,
    }
  })

  it('affiche le titre création en mode création', () => {
    const wrapper = mountForm()
    expect(wrapper.text()).toContain('shortUrls.form.createTitle')
  })

  it('affiche le titre édition quand shortUrl prop est fourni', () => {
    mockIsEditMode.value = true
    const wrapper = mountForm({ shortUrl: fakeShortUrl })
    expect(wrapper.text()).toContain('shortUrls.form.editTitle')
  })

  it('affiche les champs du formulaire (slug, link)', () => {
    const wrapper = mountForm()
    const inputs = wrapper.findAll('input')
    // Should find at least slug + prefix + length + link inputs
    expect(inputs.length).toBeGreaterThanOrEqual(2)
  })

  it('affiche les switches (traceable, draft)', () => {
    const wrapper = mountForm()
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    // traceable + draft (at minimum)
    expect(checkboxes.length).toBeGreaterThanOrEqual(2)
  })

  it('masque le champ "Active" en mode création', () => {
    mockIsEditMode.value = false
    const wrapper = mountForm()
    const text = wrapper.text()
    expect(text).not.toContain('shortUrls.form.enabledLabel')
  })

  it('affiche le champ "Active" en mode édition', () => {
    mockIsEditMode.value = true
    const wrapper = mountForm({ shortUrl: fakeShortUrl })
    expect(wrapper.text()).toContain('shortUrls.form.enabledLabel')
  })

  it('masque la section preview en mode édition', () => {
    mockIsEditMode.value = true
    const wrapper = mountForm({ shortUrl: fakeShortUrl })
    expect(wrapper.find('[data-preview-btn]').exists()).toBe(false)
  })

  it('affiche la section preview en mode création', () => {
    mockIsEditMode.value = false
    const wrapper = mountForm()
    expect(wrapper.find('[data-preview-btn]').exists()).toBe(true)
  })

  it('émet cancel quand on clique sur Annuler', async () => {
    const wrapper = mountForm()
    await wrapper.find('[data-cancel-btn]').trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('émet saved avec l\'id quand submit réussit', async () => {
    mockSubmit.mockResolvedValueOnce(99)
    const wrapper = mountForm()
    await wrapper.find('[data-save-btn]').trigger('click')
    await wrapper.vm.$nextTick()
    // Wait for the async handleSubmit to resolve
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(wrapper.emitted('saved')).toBeTruthy()
    expect(wrapper.emitted('saved')?.[0]).toEqual([99])
  })

  it('n\'émet pas saved quand submit retourne null', async () => {
    mockSubmit.mockResolvedValueOnce(null)
    const wrapper = mountForm()
    await wrapper.find('[data-save-btn]').trigger('click')
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(wrapper.emitted('saved')).toBeFalsy()
  })

  it('affiche l\'erreur quand saveError est set', () => {
    mockSaveError.value = 'Une erreur est survenue'
    const wrapper = mountForm()
    expect(wrapper.find('[data-save-error]').exists()).toBe(true)
    expect(wrapper.find('[data-save-error]').text()).toBe('Une erreur est survenue')
  })

  it('n\'affiche pas d\'erreur quand saveError est null', () => {
    mockSaveError.value = null
    const wrapper = mountForm()
    expect(wrapper.find('[data-save-error]').exists()).toBe(false)
  })

  it('désactive le bouton Enregistrer pendant isSaving', () => {
    mockIsSaving.value = true
    const wrapper = mountForm()
    const saveBtn = wrapper.find('[data-save-btn]')
    expect(saveBtn.attributes('disabled')).toBeDefined()
  })

  it('affiche le texte de preview quand fakePreview est set', () => {
    mockFakePreview.value = 'abc123'
    const wrapper = mountForm()
    expect(wrapper.find('[data-preview-text]').exists()).toBe(true)
    expect(wrapper.find('[data-preview-text]').text()).toBe('abc123')
  })
})
