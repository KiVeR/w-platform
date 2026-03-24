import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, computed, watch, reactive } from 'vue'
import { mockUseI18n, mockNuxtApp } from '../helpers/stubs'
import DemandeOperationConfigSheet from '../../components/DemandeOperationConfigSheet.vue'
import type { DemandeOperationRow } from '../../types/demandes'
import { toast as mockToast } from '../__mocks__/vue-sonner'

function makeOp(overrides: Partial<DemandeOperationRow> = {}): DemandeOperationRow {
  return {
    id: 1,
    ref_operation: 'OP-001',
    line_number: 1,
    type: 'loc',
    name: 'Test Operation',
    advertiser: 'Acme Corp',
    priority: 'medium',
    lifecycle_status: 'draft',
    last_transitioned_at: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeDetail(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    ref_operation: 'OP-001',
    line_number: 1,
    type: 'loc',
    name: 'Test Operation',
    advertiser: 'Acme Corp',
    priority: 'medium',
    lifecycle_status: 'draft',
    last_transitioned_at: null,
    created_at: '2026-01-01T00:00:00Z',
    external_ref: 'EXT-001',
    message: 'Hello World',
    sender: 'MySender',
    volume_estimated: 5000,
    scheduled_at: '2026-02-01T10:00',
    unit_price: 0.05,
    ...overrides,
  }
}

function mockApiWithDetail(detail = makeDetail(), putResult = { data: {}, error: null }) {
  const mockGet = vi.fn().mockResolvedValue({ data: detail, error: null })
  const mockPut = vi.fn().mockResolvedValue(putResult)
  mockNuxtApp({ GET: mockGet, PUT: mockPut })
  return { mockGet, mockPut }
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
  mockUseI18n()
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('reactive', reactive)
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('watch', watch)
  mockToast.success.mockReset()
  mockToast.error.mockReset()
})

// ============================================================
// Rendu général
// ============================================================
describe('DemandeOperationConfigSheet — rendu général', () => {
  it('does not render sheet when open=false', () => {
    mockApiWithDetail()
    const wrapper = mount(DemandeOperationConfigSheet, {
      props: { operation: makeOp(), open: false },
      attachTo: document.body,
    })
    expect(wrapper.find('[data-testid="config-sheet"]').exists()).toBe(false)
  })

  it('renders sheet panel when open=true', async () => {
    mockApiWithDetail()
    const wrapper = mount(DemandeOperationConfigSheet, {
      props: { operation: makeOp(), open: true },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.querySelector('[data-testid="config-sheet"]')).not.toBeNull()
    wrapper.unmount()
  })

  it('shows ref_operation in header', async () => {
    mockApiWithDetail()
    const wrapper = mount(DemandeOperationConfigSheet, {
      props: { operation: makeOp({ ref_operation: 'OP-999' }), open: true },
      attachTo: document.body,
    })
    await flushPromises()
    const el = document.querySelector('[data-testid="sheet-ref"]')
    expect(el?.textContent).toContain('OP-999')
    wrapper.unmount()
  })

  it('shows type badge in header', async () => {
    mockApiWithDetail()
    const wrapper = mount(DemandeOperationConfigSheet, {
      props: { operation: makeOp({ type: 'fid' }), open: true },
      attachTo: document.body,
    })
    await flushPromises()
    const el = document.querySelector('[data-testid="sheet-type"]')
    expect(el?.textContent).toContain('fid')
    wrapper.unmount()
  })

  it('shows lifecycle_status badge in header', async () => {
    mockApiWithDetail()
    const wrapper = mount(DemandeOperationConfigSheet, {
      props: { operation: makeOp({ lifecycle_status: 'completed' }), open: true },
      attachTo: document.body,
    })
    await flushPromises()
    const el = document.querySelector('[data-testid="sheet-status"]')
    expect(el?.textContent).toContain('completed')
    wrapper.unmount()
  })

  it('shows loading state while fetching detail', async () => {
    let resolveGet!: (val: unknown) => void
    const mockGet = vi.fn().mockReturnValue(new Promise(r => { resolveGet = r }))
    mockNuxtApp({ GET: mockGet, PUT: vi.fn() })

    const wrapper = mount(DemandeOperationConfigSheet, {
      props: { operation: makeOp(), open: true },
      attachTo: document.body,
    })

    // Should show loading before resolving
    const loadingEl = document.querySelector('[data-testid="sheet-loading"]')
    expect(loadingEl).not.toBeNull()

    resolveGet({ data: makeDetail(), error: null })
    await flushPromises()
    wrapper.unmount()
  })

  it('fetches detail via GET /operations/{id} on mount', async () => {
    const { mockGet } = mockApiWithDetail()
    const wrapper = mount(DemandeOperationConfigSheet, {
      props: { operation: makeOp({ id: 42 }), open: true },
      attachTo: document.body,
    })
    await flushPromises()

    expect(mockGet).toHaveBeenCalledWith('/operations/{id}', expect.objectContaining({
      params: expect.objectContaining({ path: { id: 42 } }),
    }))
    wrapper.unmount()
  })
})

// ============================================================
// Section Identité (toujours visible)
// ============================================================
describe('DemandeOperationConfigSheet — section Identité', () => {
  it('shows identity section always (for loc type)', async () => {
    mockApiWithDetail(makeDetail({ type: 'loc' }))
    const wrapper = mount(DemandeOperationConfigSheet, {
      props: { operation: makeOp({ type: 'loc' }), open: true },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.querySelector('[data-testid="section-identity"]')).not.toBeNull()
    wrapper.unmount()
  })

  it('shows name field', async () => {
    mockApiWithDetail(makeDetail({ name: 'My Op Name' }))
    const wrapper = mount(DemandeOperationConfigSheet, {
      props: { operation: makeOp(), open: true },
      attachTo: document.body,
    })
    await flushPromises()
    const el = document.querySelector('[data-testid="field-name"]') as HTMLInputElement
    expect(el).not.toBeNull()
    expect(el?.value).toBe('My Op Name')
    wrapper.unmount()
  })

  it('shows advertiser field', async () => {
    mockApiWithDetail(makeDetail({ advertiser: 'Wellpack' }))
    const wrapper = mount(DemandeOperationConfigSheet, {
      props: { operation: makeOp(), open: true },
      attachTo: document.body,
    })
    await flushPromises()
    const el = document.querySelector('[data-testid="field-advertiser"]') as HTMLInputElement
    expect(el?.value).toBe('Wellpack')
    wrapper.unmount()
  })

  it('shows priority radio group', async () => {
    mockApiWithDetail()
    const wrapper = mount(DemandeOperationConfigSheet, {
      props: { operation: makeOp(), open: true },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.querySelector('[data-testid="field-priority"]')).not.toBeNull()
    wrapper.unmount()
  })
})

// ============================================================
// Champs conditionnels
// ============================================================
describe('DemandeOperationConfigSheet — champs conditionnels', () => {
  it('shows message section for LOC type', async () => {
    mockApiWithDetail(makeDetail({ type: 'loc' }))
    const wrapper = mount(DemandeOperationConfigSheet, {
      props: { operation: makeOp({ type: 'loc' }), open: true },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.querySelector('[data-testid="section-message"]')).not.toBeNull()
    wrapper.unmount()
  })

  it('does NOT show message section for QUAL type', async () => {
    mockApiWithDetail(makeDetail({ type: 'qual' }))
    const wrapper = mount(DemandeOperationConfigSheet, {
      props: { operation: makeOp({ type: 'qual' }), open: true },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.querySelector('[data-testid="section-message"]')).toBeNull()
    wrapper.unmount()
  })

  it('shows targeting section for ACQ type', async () => {
    mockApiWithDetail(makeDetail({ type: 'acq' }))
    const wrapper = mount(DemandeOperationConfigSheet, {
      props: { operation: makeOp({ type: 'acq' }), open: true },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.querySelector('[data-testid="section-targeting"]')).not.toBeNull()
    wrapper.unmount()
  })

  it('does NOT show targeting section for FID type', async () => {
    mockApiWithDetail(makeDetail({ type: 'fid' }))
    const wrapper = mount(DemandeOperationConfigSheet, {
      props: { operation: makeOp({ type: 'fid' }), open: true },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.querySelector('[data-testid="section-targeting"]')).toBeNull()
    wrapper.unmount()
  })

  it('shows scheduling section for LOC type', async () => {
    mockApiWithDetail(makeDetail({ type: 'loc' }))
    const wrapper = mount(DemandeOperationConfigSheet, {
      props: { operation: makeOp({ type: 'loc' }), open: true },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.querySelector('[data-testid="section-scheduling"]')).not.toBeNull()
    wrapper.unmount()
  })

  it('does NOT show scheduling section for ENRICH type', async () => {
    mockApiWithDetail(makeDetail({ type: 'enrich' }))
    const wrapper = mount(DemandeOperationConfigSheet, {
      props: { operation: makeOp({ type: 'enrich' }), open: true },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.querySelector('[data-testid="section-scheduling"]')).toBeNull()
    wrapper.unmount()
  })

  it('shows billing section for LOC type', async () => {
    mockApiWithDetail(makeDetail({ type: 'loc' }))
    const wrapper = mount(DemandeOperationConfigSheet, {
      props: { operation: makeOp({ type: 'loc' }), open: true },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.querySelector('[data-testid="section-billing"]')).not.toBeNull()
    wrapper.unmount()
  })

  it('does NOT show billing section for FILTRE type', async () => {
    mockApiWithDetail(makeDetail({ type: 'filtre' }))
    const wrapper = mount(DemandeOperationConfigSheet, {
      props: { operation: makeOp({ type: 'filtre' }), open: true },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.querySelector('[data-testid="section-billing"]')).toBeNull()
    wrapper.unmount()
  })
})

// ============================================================
// Sauvegarde
// ============================================================
describe('DemandeOperationConfigSheet — sauvegarde', () => {
  it('calls PUT /operations/{id} on save', async () => {
    const { mockPut } = mockApiWithDetail()
    const wrapper = mount(DemandeOperationConfigSheet, {
      props: { operation: makeOp({ id: 10 }), open: true },
      attachTo: document.body,
    })
    await flushPromises()

    const saveBtn = document.querySelector('[data-testid="sheet-save-btn"]') as HTMLButtonElement
    saveBtn.click()
    await flushPromises()

    expect(mockPut).toHaveBeenCalledWith('/operations/{id}', expect.objectContaining({
      params: expect.objectContaining({ path: { id: 1 } }),
    }))
    wrapper.unmount()
  })

  it('includes identity fields in PUT payload', async () => {
    const { mockPut } = mockApiWithDetail(makeDetail({ name: 'Updated Name' }))
    const wrapper = mount(DemandeOperationConfigSheet, {
      props: { operation: makeOp(), open: true },
      attachTo: document.body,
    })
    await flushPromises()

    const saveBtn = document.querySelector('[data-testid="sheet-save-btn"]') as HTMLButtonElement
    saveBtn.click()
    await flushPromises()

    expect(mockPut).toHaveBeenCalledWith('/operations/{id}', expect.objectContaining({
      body: expect.objectContaining({ name: 'Updated Name' }),
    }))
    wrapper.unmount()
  })

  it('does NOT include message fields for QUAL type', async () => {
    const { mockPut } = mockApiWithDetail(makeDetail({ type: 'qual' }))
    const wrapper = mount(DemandeOperationConfigSheet, {
      props: { operation: makeOp({ type: 'qual' }), open: true },
      attachTo: document.body,
    })
    await flushPromises()

    const saveBtn = document.querySelector('[data-testid="sheet-save-btn"]') as HTMLButtonElement
    saveBtn.click()
    await flushPromises()

    const callBody = mockPut.mock.calls[0][1].body
    expect(callBody).not.toHaveProperty('message')
    expect(callBody).not.toHaveProperty('sender')
    wrapper.unmount()
  })

  it('shows success toast on save', async () => {
    mockApiWithDetail()
    const wrapper = mount(DemandeOperationConfigSheet, {
      props: { operation: makeOp(), open: true },
      attachTo: document.body,
    })
    await flushPromises()

    const saveBtn = document.querySelector('[data-testid="sheet-save-btn"]') as HTMLButtonElement
    saveBtn.click()
    await flushPromises()

    expect(mockToast.success).toHaveBeenCalledWith('demandes.config.saved')
    wrapper.unmount()
  })

  it('emits saved event on success', async () => {
    mockApiWithDetail()
    const wrapper = mount(DemandeOperationConfigSheet, {
      props: { operation: makeOp(), open: true },
      attachTo: document.body,
    })
    await flushPromises()

    const saveBtn = document.querySelector('[data-testid="sheet-save-btn"]') as HTMLButtonElement
    saveBtn.click()
    await flushPromises()

    expect(wrapper.emitted('saved')).toBeTruthy()
    wrapper.unmount()
  })

  it('emits update:open false after save success', async () => {
    mockApiWithDetail()
    const wrapper = mount(DemandeOperationConfigSheet, {
      props: { operation: makeOp(), open: true },
      attachTo: document.body,
    })
    await flushPromises()

    const saveBtn = document.querySelector('[data-testid="sheet-save-btn"]') as HTMLButtonElement
    saveBtn.click()
    await flushPromises()

    const updateOpenEvents = wrapper.emitted('update:open')
    expect(updateOpenEvents).toBeTruthy()
    expect(updateOpenEvents?.[0]).toEqual([false])
    wrapper.unmount()
  })

  it('shows error toast on save error', async () => {
    const mockGet = vi.fn().mockResolvedValue({ data: makeDetail(), error: null })
    const mockPut = vi.fn().mockResolvedValue({ data: null, error: { message: 'Server error' } })
    mockNuxtApp({ GET: mockGet, PUT: mockPut })

    const wrapper = mount(DemandeOperationConfigSheet, {
      props: { operation: makeOp(), open: true },
      attachTo: document.body,
    })
    await flushPromises()

    const saveBtn = document.querySelector('[data-testid="sheet-save-btn"]') as HTMLButtonElement
    saveBtn.click()
    await flushPromises()

    expect(mockToast.error).toHaveBeenCalledWith('demandes.config.save_error')
    wrapper.unmount()
  })
})
