import { describe, it, expect, vi } from 'vitest'
import { computed, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { mockUseI18n } from '../../helpers/stubs'
import type { CampaignRoutingStatus } from '@/types/campaign'

vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
mockUseI18n()

const RoutingStatusBadge = (await import('@/components/shared/RoutingStatusBadge.vue')).default

const ALL_STATUSES: CampaignRoutingStatus[] = [
  'QUERY_PENDING', 'QUERY_IN_PROGRESS', 'QUERY_FAILED',
  'SHORT_URL_ERROR', 'SHORT_URL_SUFFIX_PENDING', 'SHORT_URL_SUFFIX_REQUESTED', 'SHORT_URL_SUFFIX_FAILED',
  'MESSAGE_GENERATION_PENDING', 'MESSAGE_GENERATION_REQUESTED', 'MESSAGE_GENERATION_FAILED',
  'ROUTING_PENDING', 'ROUTING_IN_PROGRESS', 'ROUTING_COMPLETED',
  'ROUTING_PAUSED', 'ROUTING_FAILED', 'ROUTING_CANCELED',
]

describe('RoutingStatusBadge', () => {
  it.each(ALL_STATUSES)('renders badge for status %s', (status) => {
    const wrapper = mount(RoutingStatusBadge, {
      props: { status },
    })
    expect(wrapper.text()).toContain(`campaigns.routingStatus.${status}`)
    expect(wrapper.find('span').classes()).toContain('inline-flex')
  })

  it('applies success classes for ROUTING_COMPLETED', () => {
    const wrapper = mount(RoutingStatusBadge, {
      props: { status: 'ROUTING_COMPLETED' as CampaignRoutingStatus },
    })
    expect(wrapper.find('span').classes()).toContain('bg-success-100')
    expect(wrapper.find('span').classes()).toContain('text-success-700')
  })

  it('applies error classes for ROUTING_FAILED', () => {
    const wrapper = mount(RoutingStatusBadge, {
      props: { status: 'ROUTING_FAILED' as CampaignRoutingStatus },
    })
    expect(wrapper.find('span').classes()).toContain('bg-error-100')
    expect(wrapper.find('span').classes()).toContain('text-error-700')
  })

  it('applies warning classes for ROUTING_PAUSED', () => {
    const wrapper = mount(RoutingStatusBadge, {
      props: { status: 'ROUTING_PAUSED' as CampaignRoutingStatus },
    })
    expect(wrapper.find('span').classes()).toContain('bg-warning-100')
  })
})
