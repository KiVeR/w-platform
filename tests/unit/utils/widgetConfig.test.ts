import type { Widget } from '@@/layers/editor/types/widget'
import { filterConfiguredWidgets, hasConfiguredChildren, isWidgetConfigured } from '@@/layers/editor/utils/widgetConfig'
import { describe, expect, it } from 'vitest'

function makeWidget(overrides: Partial<Widget> & Pick<Widget, 'type'>): Widget {
  return {
    id: 'test-1',
    order: 0,
    content: {},
    styles: {},
    ...overrides,
  } as Widget
}

// =============================================================================
// isWidgetConfigured
// =============================================================================

describe('isWidgetConfigured', () => {
  it('returns true for text widget (always configured)', () => {
    expect(isWidgetConfigured(makeWidget({ type: 'text' }))).toBe(true)
  })

  it('returns true for title widget (always configured)', () => {
    expect(isWidgetConfigured(makeWidget({ type: 'title' }))).toBe(true)
  })

  it('returns true for button widget (always configured)', () => {
    expect(isWidgetConfigured(makeWidget({ type: 'button' }))).toBe(true)
  })

  it('returns true for image with src', () => {
    expect(isWidgetConfigured(makeWidget({
      type: 'image',
      content: { src: 'https://example.com/img.png' },
    }))).toBe(true)
  })

  it('returns false for image without src', () => {
    expect(isWidgetConfigured(makeWidget({
      type: 'image',
      content: { src: '' },
    }))).toBe(false)
  })

  it('returns false for image with whitespace-only src', () => {
    expect(isWidgetConfigured(makeWidget({
      type: 'image',
      content: { src: '   ' },
    }))).toBe(false)
  })

  it('returns true for video with videoUrl', () => {
    expect(isWidgetConfigured(makeWidget({
      type: 'video',
      content: { videoUrl: 'https://youtube.com/watch?v=abc' },
    }))).toBe(true)
  })

  it('returns false for video without videoUrl', () => {
    expect(isWidgetConfigured(makeWidget({
      type: 'video',
      content: {},
    }))).toBe(false)
  })

  it('returns true for map with address', () => {
    expect(isWidgetConfigured(makeWidget({
      type: 'map',
      content: { address: '123 Main St' },
    }))).toBe(true)
  })

  it('returns true for map with lat/lng', () => {
    expect(isWidgetConfigured(makeWidget({
      type: 'map',
      content: { latitude: 48.8566, longitude: 2.3522 },
    }))).toBe(true)
  })

  it('returns false for map without address or coordinates', () => {
    expect(isWidgetConfigured(makeWidget({
      type: 'map',
      content: {},
    }))).toBe(false)
  })

  it('returns true for gallery with images', () => {
    expect(isWidgetConfigured(makeWidget({
      type: 'gallery',
      content: { galleryImages: [{ src: 'img.png' }] },
    }))).toBe(true)
  })

  it('returns false for gallery with empty images', () => {
    expect(isWidgetConfigured(makeWidget({
      type: 'gallery',
      content: { galleryImages: [] },
    }))).toBe(false)
  })

  it('returns true for social with enabled link', () => {
    expect(isWidgetConfigured(makeWidget({
      type: 'social',
      content: {
        socialLinks: [
          { platform: 'facebook', url: 'https://facebook.com/test', enabled: true },
        ],
      },
    }))).toBe(true)
  })

  it('returns false for social with no enabled links', () => {
    expect(isWidgetConfigured(makeWidget({
      type: 'social',
      content: {
        socialLinks: [
          { platform: 'facebook', url: 'https://facebook.com/test', enabled: false },
        ],
      },
    }))).toBe(false)
  })

  it('returns true for scratch with both images', () => {
    expect(isWidgetConfigured(makeWidget({
      type: 'scratch',
      content: { scratchImageFg: 'fg.png', scratchImageBg: 'bg.png' },
    }))).toBe(true)
  })

  it('returns false for scratch with only foreground', () => {
    expect(isWidgetConfigured(makeWidget({
      type: 'scratch',
      content: { scratchImageFg: 'fg.png', scratchImageBg: '' },
    }))).toBe(false)
  })

  it('returns true for row with configured child', () => {
    expect(isWidgetConfigured(makeWidget({
      type: 'row',
      children: [makeWidget({ type: 'text' })],
    }))).toBe(true)
  })

  it('returns false for row with no children', () => {
    expect(isWidgetConfigured(makeWidget({
      type: 'row',
      children: [],
    }))).toBe(false)
  })
})

// =============================================================================
// hasConfiguredChildren
// =============================================================================

describe('hasConfiguredChildren', () => {
  it('returns false for widget with no children', () => {
    expect(hasConfiguredChildren(makeWidget({ type: 'row' }))).toBe(false)
  })

  it('returns false for widget with empty children array', () => {
    expect(hasConfiguredChildren(makeWidget({ type: 'row', children: [] }))).toBe(false)
  })

  it('returns true when at least one child is configured', () => {
    const widget = makeWidget({
      type: 'row',
      children: [
        makeWidget({ type: 'image', content: {} }),
        makeWidget({ type: 'text' }),
      ],
    })
    expect(hasConfiguredChildren(widget)).toBe(true)
  })

  it('returns false when all children are unconfigured', () => {
    const widget = makeWidget({
      type: 'row',
      children: [
        makeWidget({ type: 'image', content: { src: '' } }),
        makeWidget({ type: 'video', content: {} }),
      ],
    })
    expect(hasConfiguredChildren(widget)).toBe(false)
  })
})

// =============================================================================
// filterConfiguredWidgets
// =============================================================================

describe('filterConfiguredWidgets', () => {
  it('filters out unconfigured widgets', () => {
    const widgets = [
      makeWidget({ type: 'text' }),
      makeWidget({ type: 'image', content: {} }),
      makeWidget({ type: 'title' }),
    ]
    const result = filterConfiguredWidgets(widgets)
    expect(result).toHaveLength(2)
    expect(result[0].type).toBe('text')
    expect(result[1].type).toBe('title')
  })

  it('returns empty array for empty input', () => {
    expect(filterConfiguredWidgets([])).toEqual([])
  })
})
