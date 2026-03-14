import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { useEcho } from '@/composables/useEcho'

const mockListen = vi.fn()
const mockPrivate = vi.fn(() => ({ listen: mockListen }))
const mockLeave = vi.fn()

function mountHarness(
  withEcho: boolean,
  run: (echo: ReturnType<typeof useEcho>) => void,
) {
  vi.stubGlobal('useNuxtApp', () => withEcho
    ? { $echo: { private: mockPrivate, leave: mockLeave } }
    : {})

  return mount(defineComponent({
    setup() {
      const echo = useEcho()
      run(echo)
      return () => h('div')
    },
  }))
}

describe('useEcho', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('listen delegates to $echo.private().listen()', () => {
    mountHarness(true, ({ listen }) => {
      listen('campaign', '.CampaignUpdated', vi.fn())
    })

    expect(mockPrivate).toHaveBeenCalledWith('campaign')
    expect(mockListen).toHaveBeenCalledTimes(1)
    expect(mockListen).toHaveBeenCalledWith('.CampaignUpdated', expect.any(Function))
  })

  it('stopListening delegates to $echo.leave()', () => {
    mountHarness(true, ({ stopListening }) => {
      stopListening('campaign')
    })

    expect(mockLeave).toHaveBeenCalledWith('campaign')
  })

  it('cleans tracked channels on component unmount', () => {
    const wrapper = mountHarness(true, ({ listen }) => {
      listen('campaign', '.CampaignUpdated', vi.fn())
      listen('users.42', '.UserUpdated', vi.fn())
    })

    wrapper.unmount()

    expect(mockLeave).toHaveBeenCalledWith('campaign')
    expect(mockLeave).toHaveBeenCalledWith('users.42')
  })

  it('reports disabled when no echo client is provided', () => {
    let enabled = true

    mountHarness(false, ({ isEnabled }) => {
      enabled = isEnabled.value
    })

    expect(enabled).toBe(false)
    expect(mockPrivate).not.toHaveBeenCalled()
  })

  it('ignores listen calls when websocket is disabled', () => {
    mountHarness(false, ({ listen, stopListening }) => {
      listen('campaign', '.CampaignUpdated', vi.fn())
      stopListening('campaign')
    })

    expect(mockPrivate).not.toHaveBeenCalled()
    expect(mockLeave).not.toHaveBeenCalled()
  })
})
