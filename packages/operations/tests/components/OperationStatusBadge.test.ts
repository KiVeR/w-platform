import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { mockUseI18n } from '../helpers/stubs'

mockUseI18n()

const OperationStatusBadge = (await import('#operations/components/OperationStatusBadge.vue')).default

describe('OperationStatusBadge', () => {
  it('renders the correct i18n key for draft status', () => {
    const wrapper = mount(OperationStatusBadge, {
      props: { status: 'draft' },
    })
    expect(wrapper.text()).toBe('operations.status.draft')
    expect(wrapper.find('[data-status="draft"]').exists()).toBe(true)
  })

  it('renders the correct i18n key for processing status', () => {
    const wrapper = mount(OperationStatusBadge, {
      props: { status: 'processing' },
    })
    expect(wrapper.text()).toBe('operations.status.processing')
    expect(wrapper.find('[data-status="processing"]').exists()).toBe(true)
  })

  it('applies color classes based on status', () => {
    const wrapper = mount(OperationStatusBadge, {
      props: { status: 'cancelled' },
    })
    // cancelled has red color
    expect(wrapper.find('span').classes()).toContain('bg-red-100')
  })
})
