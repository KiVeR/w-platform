import { describe, expect, test } from 'vitest'
import { ref } from 'vue'
import { useCollapsibleSections } from '@/composables/useCollapsibleSections'

describe('useCollapsibleSections', () => {
  test('etat initial draft', () => {
    const { sections } = useCollapsibleSections(ref('draft'))
    expect(sections.value).toEqual({ message: true, targeting: true, recipients: false, timeline: false, logs: false })
  })

  test('etat initial scheduled', () => {
    const { sections } = useCollapsibleSections(ref('scheduled'))
    expect(sections.value).toEqual({ message: true, targeting: true, recipients: false, timeline: false, logs: false })
  })

  test('etat initial sent', () => {
    const { sections } = useCollapsibleSections(ref('sent'))
    expect(sections.value).toEqual({ message: true, targeting: true, recipients: true, timeline: true, logs: true })
  })

  test('etat initial failed', () => {
    const { sections } = useCollapsibleSections(ref('failed'))
    expect(sections.value).toEqual({ message: true, targeting: false, recipients: false, timeline: true, logs: true })
  })

  test('etat initial cancelled', () => {
    const { sections } = useCollapsibleSections(ref('cancelled'))
    expect(sections.value).toEqual({ message: true, targeting: false, recipients: false, timeline: false, logs: false })
  })

  test('toggle bascule une section', () => {
    const { sections, toggle } = useCollapsibleSections(ref('draft'))
    toggle('recipients')
    expect(sections.value.recipients).toBe(true)
  })

  test('isOpen retourne la valeur correcte', () => {
    const { isOpen } = useCollapsibleSections(ref('sent'))
    expect(isOpen('logs')).toBe(true)
    expect(isOpen('message')).toBe(true)
  })

  test('changement de statut recalcule les sections', async () => {
    const status = ref<'draft' | 'sent'>('draft')
    const { sections } = useCollapsibleSections(status)

    status.value = 'sent'
    await Promise.resolve()

    expect(sections.value).toEqual({ message: true, targeting: true, recipients: true, timeline: true, logs: true })
  })

  test('toggle preserve les autres sections', () => {
    const { sections, toggle } = useCollapsibleSections(ref('sent'))
    toggle('logs')

    expect(sections.value.message).toBe(true)
    expect(sections.value.targeting).toBe(true)
    expect(sections.value.recipients).toBe(true)
    expect(sections.value.timeline).toBe(true)
    expect(sections.value.logs).toBe(false)
  })
})
