import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'
import { mockUseI18n } from '../../helpers/stubs'
import { stubAuthGlobals } from '../../helpers/auth-stubs'
import type { PartnerRow, PartnerPagination } from '@/types/partner'

stubAuthGlobals()
mockUseI18n()
vi.stubGlobal('computed', computed)

const PartnerDataTable = (await import('@/components/hub/PartnerDataTable.vue')).default

function fakePartnerRows(count = 3): PartnerRow[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Partner ${i + 1}`,
    code: `P-${i + 1}`,
    activity_type: i % 2 === 0 ? 'boulangerie' : null,
    email: `partner${i + 1}@test.fr`,
    euro_credits: (i + 1) * 500,
    is_active: i !== 2,
    users_count: i + 1,
    shops_count: (i + 1) * 2,
    created_at: '2026-01-15T10:00:00Z',
  }))
}

const defaultPagination: PartnerPagination = { page: 1, lastPage: 1, total: 3 }

const slotStub = { template: '<div v-bind="$attrs"><slot /></div>' }

describe('PartnerDataTable', () => {
  function mountTable(overrides: Partial<{
    data: PartnerRow[]
    isLoading: boolean
    hasError: boolean
    sort: string
    pagination: PartnerPagination
  }> = {}) {
    return mount(PartnerDataTable, {
      props: {
        data: fakePartnerRows(),
        isLoading: false,
        hasError: false,
        sort: '-created_at',
        pagination: defaultPagination,
        ...overrides,
      },
      global: {
        stubs: {
          PartnerStatusBadge: { template: '<span data-status-badge />', props: ['isActive'] },
          PartnerCreditsCell: { template: '<span data-credits-cell />', props: ['credits'] },
          EmptyState: { template: '<div v-bind="$attrs" />', props: ['icon', 'title', 'description', 'actionLabel'] },
          PageSkeleton: { template: '<div data-skeleton />', props: ['variant'] },
          Table: slotStub,
          TableHeader: slotStub,
          TableBody: slotStub,
          TableRow: slotStub,
          TableHead: slotStub,
          TableCell: slotStub,
          Button: { template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>', props: ['variant', 'size', 'disabled'] },
          DropdownMenu: slotStub,
          DropdownMenuTrigger: slotStub,
          DropdownMenuContent: slotStub,
          DropdownMenuItem: { template: '<div v-bind="$attrs" @click="$emit(\'click\')"><slot /></div>' },
        },
      },
    })
  }

  it('renders partner rows when data is provided', () => {
    const wrapper = mountTable()

    const rows = wrapper.findAll('[data-partner-row]')
    expect(rows.length).toBe(3)
  })

  it('shows skeleton when loading', () => {
    const wrapper = mountTable({ isLoading: true })

    expect(wrapper.find('[data-skeleton]').exists()).toBe(true)
    expect(wrapper.findAll('[data-partner-row]').length).toBe(0)
  })

  it('shows error state when hasError is true', () => {
    const wrapper = mountTable({ hasError: true, data: [] })

    expect(wrapper.find('[data-partner-table-error]').exists()).toBe(true)
  })

  it('shows empty state when data is empty', () => {
    const wrapper = mountTable({ data: [] })

    expect(wrapper.find('[data-partner-table-empty]').exists()).toBe(true)
  })

  it('emits enter when a row is clicked', async () => {
    const data = fakePartnerRows(1)
    const wrapper = mountTable({ data })

    const row = wrapper.find('[data-partner-row]')
    await row.trigger('click')

    expect(wrapper.emitted('enter')).toBeTruthy()
    expect(wrapper.emitted('enter')![0]).toEqual([data[0]])
  })

  it('emits sort when a sortable column header is clicked', async () => {
    const wrapper = mountTable()

    const sortButtons = wrapper.findAll('button')
    const nameButton = sortButtons.find(b => b.text().includes('hub.partners.columns.name'))
    expect(nameButton).toBeTruthy()

    await nameButton!.trigger('click')
    expect(wrapper.emitted('sort')).toBeTruthy()
    expect(wrapper.emitted('sort')![0]).toEqual(['name'])
  })

  it('shows pagination when lastPage > 1', () => {
    const wrapper = mountTable({
      pagination: { page: 1, lastPage: 3, total: 42 },
    })

    expect(wrapper.find('[data-prev-page]').exists()).toBe(true)
    expect(wrapper.find('[data-next-page]').exists()).toBe(true)
  })

  it('hides pagination when only one page', () => {
    const wrapper = mountTable({
      pagination: { page: 1, lastPage: 1, total: 3 },
    })

    expect(wrapper.find('[data-prev-page]').exists()).toBe(false)
    expect(wrapper.find('[data-next-page]').exists()).toBe(false)
  })

  it('emits page when pagination buttons are clicked', async () => {
    const wrapper = mountTable({
      pagination: { page: 2, lastPage: 3, total: 42 },
    })

    await wrapper.find('[data-next-page]').trigger('click')
    expect(wrapper.emitted('page')).toBeTruthy()
    expect(wrapper.emitted('page')![0]).toEqual([3])
  })

  it('displays partner name in each row', () => {
    const wrapper = mountTable()

    const text = wrapper.text()
    expect(text).toContain('Partner 1')
    expect(text).toContain('Partner 2')
    expect(text).toContain('Partner 3')
  })
})
