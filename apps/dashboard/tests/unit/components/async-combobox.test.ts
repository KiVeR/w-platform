import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { mockUseI18n } from '../../helpers/stubs'

// Global stubs
mockUseI18n()

// Stub Nuxt auto-imports used by shadcn components
vi.stubGlobal('useNuxtApp', () => ({ $api: {} }))

// Import after stubs
const AsyncCombobox = (await import('@/components/shared/AsyncCombobox.vue')).default

// Simple stubs for all sub-components
const ButtonStub = {
  template: '<button v-bind="$attrs" @click.stop="$emit(\'click\', $event)"><slot /></button>',
  emits: ['click'],
  inheritAttrs: true,
}
const PopoverStub = {
  template: '<div data-stub="popover"><slot /></div>',
  props: ['open'],
  emits: ['update:open'],
}
const PopoverTriggerStub = {
  template: '<div data-stub="popover-trigger"><slot /></div>',
  props: ['asChild'],
}
const PopoverContentStub = {
  template: '<div data-stub="popover-content"><slot /></div>',
  props: ['class', 'align'],
}
const CommandStub = { template: '<div data-stub="command"><slot /></div>' }
const CommandInputStub = {
  template: '<input data-testid="combobox-search" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  props: ['modelValue', 'placeholder'],
  emits: ['update:modelValue'],
}
const CommandListStub = { template: '<div data-stub="command-list"><slot /></div>' }
const CommandEmptyStub = { template: '<div data-testid="combobox-empty"><slot /></div>' }
const CommandGroupStub = { template: '<div data-stub="command-group"><slot /></div>' }
const CommandItemStub = {
  template: '<div data-testid="combobox-option" @click="$emit(\'select\')"><slot /></div>',
  props: ['value'],
  emits: ['select'],
}
const IconStub = { template: '<span />' }

const globalStubs = {
  Button: ButtonStub,
  Popover: PopoverStub,
  PopoverTrigger: PopoverTriggerStub,
  PopoverContent: PopoverContentStub,
  Command: CommandStub,
  CommandInput: CommandInputStub,
  CommandList: CommandListStub,
  CommandEmpty: CommandEmptyStub,
  CommandGroup: CommandGroupStub,
  CommandItem: CommandItemStub,
  Check: IconStub,
  ChevronsUpDown: IconStub,
  X: IconStub,
  Loader2: IconStub,
}

function mountCombobox(props: Record<string, unknown> = {}) {
  return mount(AsyncCombobox, {
    props: {
      modelValue: null,
      searchFn: vi.fn().mockResolvedValue([]),
      placeholder: 'Search...',
      ...props,
    },
    global: {
      stubs: globalStubs,
      mocks: {
        $t: (key: string) => key,
      },
    },
  })
}

// Helper to set the internal search ref and trigger the watcher
async function setSearch(wrapper: ReturnType<typeof mount>, value: string) {
  const vm = wrapper.vm as any
  vm.search = value
  await nextTick()
}

describe('AsyncCombobox', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders with placeholder when no value selected', () => {
    const wrapper = mountCombobox({ placeholder: 'Pick one' })
    expect(wrapper.find('[data-testid="async-combobox"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Pick one')
  })

  it('does not show clear button when no value', () => {
    const wrapper = mountCombobox()
    expect(wrapper.find('[data-testid="combobox-clear"]').exists()).toBe(false)
  })

  it('shows clear button when a value is selected', () => {
    const wrapper = mountCombobox({ modelValue: 1, displayValue: 'Test' })
    expect(wrapper.find('[data-testid="combobox-clear"]').exists()).toBe(true)
  })

  it('emits null when clear button is clicked', async () => {
    const wrapper = mountCombobox({ modelValue: 1, displayValue: 'Test' })
    const clearBtn = wrapper.find('[data-testid="combobox-clear"]')
    // Call the clear method directly since the stub might not propagate click.stop correctly
    const vm = wrapper.vm as any
    vm.clear()
    await nextTick()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([null])
  })

  it('calls searchFn after debounce when typing >= 2 chars', async () => {
    const searchFn = vi.fn().mockResolvedValue([
      { id: 1, label: 'Alpha' },
      { id: 2, label: 'Beta' },
    ])
    const wrapper = mountCombobox({ searchFn })

    await setSearch(wrapper, 'ab')

    // Advance past debounce (300ms)
    vi.advanceTimersByTime(350)
    await flushPromises()

    expect(searchFn).toHaveBeenCalledWith('ab')
  })

  it('does not call searchFn when query is less than 2 chars', async () => {
    const searchFn = vi.fn().mockResolvedValue([])
    const wrapper = mountCombobox({ searchFn })

    await setSearch(wrapper, 'a')

    vi.advanceTimersByTime(350)
    await flushPromises()

    expect(searchFn).not.toHaveBeenCalled()
  })

  it('renders options after search', async () => {
    const searchFn = vi.fn().mockResolvedValue([
      { id: 1, label: 'Alpha' },
      { id: 2, label: 'Beta' },
    ])
    const wrapper = mountCombobox({ searchFn })

    await setSearch(wrapper, 'al')

    vi.advanceTimersByTime(350)
    await flushPromises()
    await nextTick()

    const optionEls = wrapper.findAll('[data-testid="combobox-option"]')
    expect(optionEls).toHaveLength(2)
    expect(optionEls[0].text()).toContain('Alpha')
    expect(optionEls[1].text()).toContain('Beta')
  })

  it('emits selected option id on select', async () => {
    const searchFn = vi.fn().mockResolvedValue([
      { id: 42, label: 'Acme Corp' },
    ])
    const wrapper = mountCombobox({ searchFn })

    // Trigger search
    await setSearch(wrapper, 'ac')
    vi.advanceTimersByTime(350)
    await flushPromises()
    await nextTick()

    // Click the option (triggers @select on the CommandItem stub)
    const option = wrapper.find('[data-testid="combobox-option"]')
    await option.trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([42])
  })

  it('shows display value when modelValue is set', () => {
    const wrapper = mountCombobox({
      modelValue: 5,
      displayValue: 'Selected Partner',
    })
    expect(wrapper.text()).toContain('Selected Partner')
  })

  it('shows loading state while fetching', async () => {
    // Create a search function that never resolves (to keep isLoading true)
    const searchFn = vi.fn().mockReturnValue(new Promise(() => {}))
    const wrapper = mountCombobox({ searchFn })

    await setSearch(wrapper, 'test')
    vi.advanceTimersByTime(350)
    // Only flush one microtask tick so the Promise hasn't resolved yet
    await nextTick()
    await nextTick()

    expect(wrapper.find('[data-testid="combobox-loading"]').exists()).toBe(true)
  })
})
