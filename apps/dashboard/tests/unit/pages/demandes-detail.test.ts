import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { computed, ref } from 'vue'
import { mockUseI18n, NuxtLinkStub } from '../../helpers/stubs'
import type { DemandeDetail } from '@wellpack/demandes/types/demandes'

vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('computed', computed)
mockUseI18n()

// Route stub
vi.stubGlobal('useRoute', () => ({ params: { id: '42' } }))

// useDemandeDetail stub state
const demande = ref<DemandeDetail | null>(null)
const isLoading = ref(false)
const hasError = ref(false)
const refreshDemande = vi.fn()

vi.stubGlobal('useDemandeDetail', () => ({
  demande,
  isLoading,
  hasError,
  refreshDemande,
}))

const DemandesDetailPage = (await import('@/pages/demandes/[id].vue')).default

function makeDetail(): DemandeDetail {
  return {
    id: 42,
    ref_demande: 'DEM-042',
    ref_client: null,
    information: null,
    is_exoneration: false,
    pays_id: null,
    partner_id: 10,
    commercial_id: null,
    sdr_id: null,
    operations_count: 3,
    operations_completed_count: 1,
    operations_blocked_count: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    partner: { id: 10, name: 'Acme Corp' },
    commercial: null,
    sdr: null,
    operations: [],
  }
}

const DemandeFormCardStub = {
  name: 'DemandeFormCard',
  template: '<div data-stub="form-card" />',
  props: ['demande'],
  emits: ['updated'],
}

const DemandeTimelineStub = {
  name: 'DemandeTimeline',
  template: '<div data-stub="timeline" />',
  props: ['operations'],
}

const DemandeDetailHubStub = {
  name: 'DemandeDetailHub',
  template: '<div data-stub="detail-hub" />',
  props: ['demande'],
  emits: ['refresh'],
}

const ButtonStub = {
  template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
  emits: ['click'],
}

function mountPage() {
  return mount(DemandesDetailPage, {
    global: {
      stubs: {
        NuxtLink: NuxtLinkStub,
        Button: ButtonStub,
        DemandeFormCard: DemandeFormCardStub,
        DemandeTimeline: DemandeTimelineStub,
        DemandeDetailHub: DemandeDetailHubStub,
      },
    },
  })
}

describe('demandes/[id] page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    demande.value = null
    isLoading.value = false
    hasError.value = false
  })

  it('shows loading skeletons while fetching', () => {
    isLoading.value = true
    const wrapper = mountPage()

    expect(wrapper.find('.animate-pulse').exists()).toBe(true)
    expect(wrapper.find('[data-stub="form-card"]').exists()).toBe(false)
  })

  it('shows error state when hasError is true', () => {
    hasError.value = true
    const wrapper = mountPage()

    expect(wrapper.find('.animate-pulse').exists()).toBe(false)
    expect(wrapper.text()).toContain('error.404.title')
  })

  it('calls refreshDemande on error retry click', async () => {
    hasError.value = true
    const wrapper = mountPage()

    await wrapper.find('button').trigger('click')
    expect(refreshDemande).toHaveBeenCalledOnce()
  })

  it('renders hub layout with DemandeFormCard and DemandeDetailHub when demande loaded', async () => {
    demande.value = makeDetail()
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[data-stub="form-card"]').exists()).toBe(true)
    expect(wrapper.find('[data-stub="timeline"]').exists()).toBe(true)
    expect(wrapper.find('[data-stub="detail-hub"]').exists()).toBe(true)
  })

  it('passes demande to DemandeFormCard and calls refreshDemande on updated', async () => {
    demande.value = makeDetail()
    const wrapper = mountPage()
    await flushPromises()

    const formCard = wrapper.findComponent(DemandeFormCardStub)
    expect(formCard.props('demande')).toMatchObject({ id: 42, ref_demande: 'DEM-042' })

    // emit updated from the form card
    formCard.vm.$emit('updated')
    await flushPromises()
    expect(refreshDemande).toHaveBeenCalled()
  })
})
