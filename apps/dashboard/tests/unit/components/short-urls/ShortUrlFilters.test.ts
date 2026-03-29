import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import { mockUseI18n } from '../../../helpers/stubs'
import type { ShortUrlFilters } from '@/types/short-url'

vi.stubGlobal('ref', ref)
mockUseI18n()

const ShortUrlFilters = (await import('@/components/short-urls/ShortUrlFilters.vue')).default

const SelectStub = {
  name: 'Select',
  template: '<div data-select><slot /></div>',
  props: ['modelValue'],
  emits: ['update:modelValue'],
}

const baseStubs = {
  Input: {
    template: '<input data-input :placeholder="placeholder" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'placeholder'],
    emits: ['update:modelValue'],
  },
  Select: SelectStub,
  SelectTrigger: { template: '<button data-select-trigger><slot /></button>' },
  SelectValue: { template: '<span data-select-value>{{ placeholder }}</span>', props: ['placeholder'] },
  SelectContent: { template: '<div data-select-content><slot /></div>' },
  SelectItem: {
    template: '<div data-select-item :data-value="value" @click="$emit(\'select\', value)"><slot /></div>',
    props: ['value'],
    emits: ['select'],
  },
  Search: { template: '<span data-search-icon />' },
}

function mountFilters(filters: Partial<ShortUrlFilters> = {}) {
  return mount(ShortUrlFilters, {
    props: {
      filters: {
        search: '',
        isEnabled: 'all',
        ...filters,
      } as ShortUrlFilters,
    },
    global: { stubs: baseStubs },
  })
}

describe('ShortUrlFilters', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('rend le champ de recherche avec le bon placeholder', () => {
    const wrapper = mountFilters()
    const input = wrapper.find('[data-input]')
    expect(input.exists()).toBe(true)
    expect(input.attributes('placeholder')).toBe('shortUrls.filters.search')
  })

  it('rend le select de statut avec 3 options', () => {
    const wrapper = mountFilters()
    const items = wrapper.findAll('[data-select-item]')
    expect(items.length).toBe(3)
    const values = items.map(i => i.attributes('data-value'))
    expect(values).toContain('all')
    expect(values).toContain('true')
    expect(values).toContain('false')
  })

  it('émet update:filters avec le search après debounce', async () => {
    const wrapper = mountFilters()
    const input = wrapper.find('[data-input]')
    await input.setValue('promo')
    expect(wrapper.emitted('update:filters')).toBeFalsy()
    vi.advanceTimersByTime(300)
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('update:filters')).toBeTruthy()
    const emitted = wrapper.emitted('update:filters') as Partial<ShortUrlFilters>[][]
    expect(emitted[0][0]).toEqual({ search: 'promo' })
  })

  it('émet update:filters avec le isEnabled quand on change le select', async () => {
    const wrapper = mountFilters()
    const select = wrapper.findComponent(SelectStub)
    expect(select.exists()).toBe(true)
    await select.vm.$emit('update:modelValue', 'true')
    await wrapper.vm.$nextTick()
    const emitted = wrapper.emitted('update:filters') as Partial<ShortUrlFilters>[][]
    expect(emitted).toBeTruthy()
    expect(emitted[0][0]).toEqual({ isEnabled: 'true' })
  })

  it('le debounce est nettoyé au unmount', async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')
    const wrapper = mountFilters()
    const input = wrapper.find('[data-input]')
    await input.setValue('test')
    // Timeout is scheduled but not yet fired
    wrapper.unmount()
    expect(clearTimeoutSpy.mock.calls.length).toBeGreaterThan(0)
    clearTimeoutSpy.mockRestore()
  })
})
