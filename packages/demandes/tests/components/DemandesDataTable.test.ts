import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'
import { mockUseI18n } from '../helpers/stubs'
import DemandesDataTable from '../../components/DemandesDataTable.vue'
import type { DemandeRow } from '../../types/demandes'

function makeDemandeRow(overrides: Partial<DemandeRow> = {}): DemandeRow {
  return {
    id: 1,
    ref_demande: 'DEM-001',
    ref_client: null,
    information: null,
    is_exoneration: false,
    pays_id: null,
    partner_id: 10,
    commercial_id: null,
    sdr_id: null,
    operations_count: 5,
    operations_completed_count: 3,
    operations_blocked_count: 0,
    created_at: '2026-01-15T12:00:00.000Z',
    updated_at: '2026-01-16T12:00:00.000Z',
    partner: { id: 10, name: 'Acme Corp' },
    ...overrides,
  }
}

const globalStubs = {
  stubs: {
    Table: { template: '<table><slot /></table>' },
    TableHeader: { template: '<thead><slot /></thead>' },
    TableBody: { template: '<tbody><slot /></tbody>' },
    TableRow: { template: '<tr @click="$emit(\'click\')"><slot /></tr>', emits: ['click'] },
    TableHead: { template: '<th @click="$emit(\'click\')"><slot /></th>', emits: ['click'] },
    TableCell: { template: '<td><slot /></td>' },
  },
}

beforeEach(() => {
  vi.restoreAllMocks()
  mockUseI18n()
  vi.stubGlobal('computed', computed)
})

describe('DemandesDataTable', () => {
  it('renders table headers with i18n keys', () => {
    const wrapper = mount(DemandesDataTable, {
      props: { demandes: [makeDemandeRow()], isLoading: false, sort: '-created_at' },
      global: globalStubs,
    })

    const headers = wrapper.findAll('th')
    expect(headers).toHaveLength(5)
    expect(headers[0].text()).toContain('demandes.list.columns.reference')
    expect(headers[1].text()).toContain('demandes.list.columns.partner')
    expect(headers[2].text()).toContain('demandes.list.columns.operations')
    expect(headers[3].text()).toContain('demandes.list.columns.blocked')
    expect(headers[4].text()).toContain('demandes.list.columns.date')
  })

  it('renders demande rows with content', () => {
    const wrapper = mount(DemandesDataTable, {
      props: { demandes: [makeDemandeRow()], isLoading: false, sort: '-created_at' },
      global: globalStubs,
    })

    const cells = wrapper.findAll('td')
    expect(cells[0].text()).toBe('DEM-001')
    expect(cells[1].text()).toBe('Acme Corp')
    expect(cells[2].text()).toContain('3/5')
  })

  it('emits select event on row click', async () => {
    const demande = makeDemandeRow()
    const wrapper = mount(DemandesDataTable, {
      props: { demandes: [demande], isLoading: false, sort: '-created_at' },
      global: globalStubs,
    })

    // find the body row (last <tr> in tbody)
    const rows = wrapper.findAll('tr')
    // rows[0] is in thead, rows[1] is in tbody
    await rows[rows.length - 1].trigger('click')

    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')![0][0]).toMatchObject({ id: 1, ref_demande: 'DEM-001' })
  })

  it('shows loading skeleton when isLoading is true', () => {
    const wrapper = mount(DemandesDataTable, {
      props: { demandes: [], isLoading: true, sort: '' },
      global: globalStubs,
    })

    // 5 skeleton divs with animate-pulse
    const skeletons = wrapper.findAll('.animate-pulse')
    expect(skeletons).toHaveLength(5)
    // no table rendered
    expect(wrapper.find('table').exists()).toBe(false)
  })

  it('shows empty state when no demandes', () => {
    const wrapper = mount(DemandesDataTable, {
      props: { demandes: [], isLoading: false, sort: '' },
      global: globalStubs,
    })

    expect(wrapper.text()).toContain('demandes.list.empty')
    expect(wrapper.find('table').exists()).toBe(false)
  })

  it('formats created_at date', () => {
    const wrapper = mount(DemandesDataTable, {
      props: { demandes: [makeDemandeRow()], isLoading: false, sort: '-created_at' },
      global: globalStubs,
    })

    const cells = wrapper.findAll('td')
    const dateCell = cells[cells.length - 1]
    // should be formatted, not raw ISO string
    expect(dateCell.text()).not.toContain('T12:00:00')
    expect(dateCell.text()).toMatch(/\d{2}\/\d{2}\/\d{4}/)
  })

  it('shows progression X/Y in operations column', () => {
    const wrapper = mount(DemandesDataTable, {
      props: { demandes: [makeDemandeRow({ operations_count: 8, operations_completed_count: 4 })], isLoading: false, sort: '' },
      global: globalStubs,
    })

    expect(wrapper.text()).toContain('4/8')
  })

  it('shows blocked badge when operations_blocked_count > 0', () => {
    const wrapper = mount(DemandesDataTable, {
      props: { demandes: [makeDemandeRow({ operations_blocked_count: 3 })], isLoading: false, sort: '' },
      global: globalStubs,
    })

    const badge = wrapper.find('.bg-destructive')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('3')
  })

  it('hides blocked badge when operations_blocked_count is 0', () => {
    const wrapper = mount(DemandesDataTable, {
      props: { demandes: [makeDemandeRow({ operations_blocked_count: 0 })], isLoading: false, sort: '' },
      global: globalStubs,
    })

    expect(wrapper.find('.bg-destructive').exists()).toBe(false)
  })

  it('emits sort event on sortable header click', async () => {
    const wrapper = mount(DemandesDataTable, {
      props: { demandes: [makeDemandeRow()], isLoading: false, sort: '-created_at' },
      global: globalStubs,
    })

    const headers = wrapper.findAll('th')
    await headers[0].trigger('click') // ref_demande header

    expect(wrapper.emitted('sort')).toBeTruthy()
  })

  it('shows desc sort indicator (▼) on sorted column', () => {
    const wrapper = mount(DemandesDataTable, {
      props: { demandes: [makeDemandeRow()], isLoading: false, sort: '-created_at' },
      global: globalStubs,
    })

    // created_at is sorted desc
    const lastHeader = wrapper.findAll('th')[4]
    expect(lastHeader.text()).toContain('▼')
  })

  it('shows asc sort indicator (▲) on asc sorted column', () => {
    const wrapper = mount(DemandesDataTable, {
      props: { demandes: [makeDemandeRow()], isLoading: false, sort: 'ref_demande' },
      global: globalStubs,
    })

    const firstHeader = wrapper.findAll('th')[0]
    expect(firstHeader.text()).toContain('▲')
  })

  it('renders partner name in partner column', () => {
    const wrapper = mount(DemandesDataTable, {
      props: { demandes: [makeDemandeRow({ partner: { id: 5, name: 'BrandX' } })], isLoading: false, sort: '' },
      global: globalStubs,
    })

    expect(wrapper.text()).toContain('BrandX')
  })

  it('handles null partner gracefully (shows dash)', () => {
    const wrapper = mount(DemandesDataTable, {
      props: { demandes: [makeDemandeRow({ partner: undefined })], isLoading: false, sort: '' },
      global: globalStubs,
    })

    const cells = wrapper.findAll('td')
    expect(cells[1].text()).toBe('—')
  })

  it('applies progress bar style with correct width', () => {
    const wrapper = mount(DemandesDataTable, {
      props: { demandes: [makeDemandeRow({ operations_count: 4, operations_completed_count: 2 })], isLoading: false, sort: '' },
      global: globalStubs,
    })

    const progressBar = wrapper.find('.bg-primary.h-1\\.5')
    expect(progressBar.attributes('style')).toContain('width: 50%')
  })
})
