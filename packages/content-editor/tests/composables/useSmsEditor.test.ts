import { describe, expect, it } from 'vitest'
import { ref, nextTick } from 'vue'
import { useSmsEditor } from '../../composables/useSmsEditor'

describe('useSmsEditor', () => {
  it('computes smsStats from message ref', () => {
    const message = ref('Hello World')
    const { smsStats } = useSmsEditor(message)

    expect(smsStats.value.charCount).toBe(11)
    expect(smsStats.value.smsCount).toBe(1)
    expect(smsStats.value.encoding).toBe('gsm7')
  })

  it('detects isMultiSms when message exceeds 149 chars', () => {
    const message = ref('a'.repeat(150))
    const { isMultiSms } = useSmsEditor(message)

    expect(isMultiSms.value).toBe(true)
  })

  it('isMultiSms is false for short messages', () => {
    const message = ref('Hello')
    const { isMultiSms } = useSmsEditor(message)

    expect(isMultiSms.value).toBe(false)
  })

  it('detects hasForbidden when message contains rsms.co', () => {
    const message = ref('Visit https://rsms.co/test')
    const { hasForbidden } = useSmsEditor(message)

    expect(hasForbidden.value).toBe(true)
  })

  it('hasForbidden is false for clean messages', () => {
    const message = ref('Bonjour!')
    const { hasForbidden } = useSmsEditor(message)

    expect(hasForbidden.value).toBe(false)
  })

  it('insertVariable appends token to message', () => {
    const message = ref('Hello ')
    const { insertVariable } = useSmsEditor(message)

    insertVariable('${prenom}')

    expect(message.value).toBe('Hello ${prenom}')
  })

  it('updates stats reactively when message changes', async () => {
    const message = ref('Hi')
    const { smsStats } = useSmsEditor(message)

    expect(smsStats.value.charCount).toBe(2)

    message.value = 'Hello World!'
    await nextTick()

    expect(smsStats.value.charCount).toBe(12)
  })
})
