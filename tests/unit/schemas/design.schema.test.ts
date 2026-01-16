import { describe, expect, it } from 'vitest'
import {
  designDocumentSchema,
  globalStylesSchema,
  widgetSchema,
  widgetTypeSchema,
} from '~~/shared/schemas/design.schema'

describe('widgetTypeSchema', () => {
  it('accepts valid widget types', () => {
    const validTypes = [
      'title',
      'text',
      'image',
      'button',
      'separator',
      'spacer',
      'click-to-call',
      'row',
      'column',
      'form',
      'form-field',
      'video',
      'map',
      'social',
      'icon',
      'barcode',
      'store-locator',
      'drive',
      'scratch',
      'flipcard',
      'gallery',
      'slider',
      'link-image',
      'effect',
    ]

    for (const type of validTypes) {
      expect(() => widgetTypeSchema.parse(type)).not.toThrow()
    }
  })

  it('rejects invalid widget types', () => {
    expect(() => widgetTypeSchema.parse('invalid')).toThrow()
    expect(() => widgetTypeSchema.parse('')).toThrow()
    expect(() => widgetTypeSchema.parse(123)).toThrow()
    expect(() => widgetTypeSchema.parse(null)).toThrow()
  })
})

describe('widgetSchema', () => {
  it('validates a minimal widget', () => {
    const widget = {
      id: 'widget-1',
      type: 'title',
      order: 0,
    }
    expect(() => widgetSchema.parse(widget)).not.toThrow()
  })

  it('validates a widget with content and styles', () => {
    const widget = {
      id: 'widget-1',
      type: 'title',
      order: 0,
      content: { text: 'Hello World' },
      styles: { fontSize: '24px', color: '#000000' },
    }
    expect(() => widgetSchema.parse(widget)).not.toThrow()
  })

  it('validates a container widget with children', () => {
    const widget = {
      id: 'row-1',
      type: 'row',
      order: 0,
      content: { gap: '16px' },
      styles: {},
      children: [
        {
          id: 'col-1',
          type: 'column',
          order: 0,
          content: {},
          styles: {},
        },
        {
          id: 'col-2',
          type: 'column',
          order: 1,
          content: {},
          styles: {},
        },
      ],
    }
    expect(() => widgetSchema.parse(widget)).not.toThrow()
  })

  it('rejects widget without id', () => {
    const widget = {
      type: 'title',
      order: 0,
    }
    expect(() => widgetSchema.parse(widget)).toThrow()
  })

  it('rejects widget with empty id', () => {
    const widget = {
      id: '',
      type: 'title',
      order: 0,
    }
    expect(() => widgetSchema.parse(widget)).toThrow()
  })

  it('rejects widget without type', () => {
    const widget = {
      id: 'widget-1',
      order: 0,
    }
    expect(() => widgetSchema.parse(widget)).toThrow()
  })

  it('rejects widget with invalid type', () => {
    const widget = {
      id: 'widget-1',
      type: 'unknown-type',
      order: 0,
    }
    expect(() => widgetSchema.parse(widget)).toThrow()
  })

  it('rejects widget with negative order', () => {
    const widget = {
      id: 'widget-1',
      type: 'title',
      order: -1,
    }
    expect(() => widgetSchema.parse(widget)).toThrow()
  })
})

describe('globalStylesSchema', () => {
  it('validates minimal global styles', () => {
    const styles = {}
    const result = globalStylesSchema.parse(styles)
    expect(result.backgroundColor).toBe('#ffffff')
  })

  it('validates complete global styles', () => {
    const styles = {
      palette: 'turquoise',
      backgroundColor: '#f0f0f0',
      textColor: '#333333',
      fontFamily: 'Arial, sans-serif',
      maxWidth: 600,
    }
    expect(() => globalStylesSchema.parse(styles)).not.toThrow()
  })

  it('allows additional properties via passthrough', () => {
    const styles = {
      backgroundColor: '#ffffff',
      customProperty: 'custom-value',
    }
    const result = globalStylesSchema.parse(styles)
    expect(result.customProperty).toBe('custom-value')
  })
})

describe('designDocumentSchema', () => {
  it('validates a minimal design document', () => {
    const design = {
      globalStyles: {},
      widgets: [],
    }
    expect(() => designDocumentSchema.parse(design)).not.toThrow()
  })

  it('validates a design with version', () => {
    const design = {
      version: '1.0',
      globalStyles: { backgroundColor: '#ffffff' },
      widgets: [],
    }
    expect(() => designDocumentSchema.parse(design)).not.toThrow()
  })

  it('validates a design with widgets', () => {
    const design = {
      globalStyles: { backgroundColor: '#ffffff' },
      widgets: [
        {
          id: 'title-1',
          type: 'title',
          order: 0,
          content: { text: 'Welcome' },
          styles: { fontSize: '32px' },
        },
        {
          id: 'text-1',
          type: 'text',
          order: 1,
          content: { text: 'Lorem ipsum' },
          styles: {},
        },
      ],
    }
    expect(() => designDocumentSchema.parse(design)).not.toThrow()
  })

  it('validates a design with nested widgets', () => {
    const design = {
      globalStyles: {},
      widgets: [
        {
          id: 'row-1',
          type: 'row',
          order: 0,
          content: {},
          styles: {},
          children: [
            {
              id: 'col-1',
              type: 'column',
              order: 0,
              content: {},
              styles: {},
              children: [
                {
                  id: 'text-1',
                  type: 'text',
                  order: 0,
                  content: { text: 'Column 1' },
                  styles: {},
                },
              ],
            },
          ],
        },
      ],
    }
    expect(() => designDocumentSchema.parse(design)).not.toThrow()
  })

  it('rejects design without globalStyles', () => {
    const design = {
      widgets: [],
    }
    expect(() => designDocumentSchema.parse(design)).toThrow()
  })

  it('rejects design without widgets', () => {
    const design = {
      globalStyles: {},
    }
    expect(() => designDocumentSchema.parse(design)).toThrow()
  })

  it('rejects design with invalid widget', () => {
    const design = {
      globalStyles: {},
      widgets: [
        {
          id: '',
          type: 'title',
          order: 0,
        },
      ],
    }
    expect(() => designDocumentSchema.parse(design)).toThrow()
  })
})

describe('designDocumentSchema - parent-child validation', () => {
  it('accepts row with column children', () => {
    const design = {
      globalStyles: {},
      widgets: [
        {
          id: 'row-1',
          type: 'row',
          order: 0,
          content: {},
          styles: {},
          children: [
            { id: 'col-1', type: 'column', order: 0, content: {}, styles: {} },
            { id: 'col-2', type: 'column', order: 1, content: {}, styles: {} },
          ],
        },
      ],
    }
    expect(() => designDocumentSchema.parse(design)).not.toThrow()
  })

  it('rejects row with non-column children', () => {
    const design = {
      globalStyles: {},
      widgets: [
        {
          id: 'row-1',
          type: 'row',
          order: 0,
          content: {},
          styles: {},
          children: [
            { id: 'text-1', type: 'text', order: 0, content: {}, styles: {} },
          ],
        },
      ],
    }
    expect(() => designDocumentSchema.parse(design)).toThrow(/only accepts/)
  })

  it('rejects column with row child (prevents infinite nesting)', () => {
    const design = {
      globalStyles: {},
      widgets: [
        {
          id: 'row-1',
          type: 'row',
          order: 0,
          content: {},
          styles: {},
          children: [
            {
              id: 'col-1',
              type: 'column',
              order: 0,
              content: {},
              styles: {},
              children: [
                { id: 'row-2', type: 'row', order: 0, content: {}, styles: {} },
              ],
            },
          ],
        },
      ],
    }
    expect(() => designDocumentSchema.parse(design)).toThrow(/cannot contain/)
  })

  it('rejects column with column child', () => {
    const design = {
      globalStyles: {},
      widgets: [
        {
          id: 'row-1',
          type: 'row',
          order: 0,
          content: {},
          styles: {},
          children: [
            {
              id: 'col-1',
              type: 'column',
              order: 0,
              content: {},
              styles: {},
              children: [
                { id: 'col-2', type: 'column', order: 0, content: {}, styles: {} },
              ],
            },
          ],
        },
      ],
    }
    expect(() => designDocumentSchema.parse(design)).toThrow(/cannot contain/)
  })

  it('rejects nested form inside form', () => {
    const design = {
      globalStyles: {},
      widgets: [
        {
          id: 'form-1',
          type: 'form',
          order: 0,
          content: {},
          styles: {},
          children: [
            { id: 'form-2', type: 'form', order: 0, content: {}, styles: {} },
          ],
        },
      ],
    }
    expect(() => designDocumentSchema.parse(design)).toThrow(/cannot contain/)
  })

  it('accepts form with form-field children', () => {
    const design = {
      globalStyles: {},
      widgets: [
        {
          id: 'form-1',
          type: 'form',
          order: 0,
          content: {},
          styles: {},
          children: [
            { id: 'field-1', type: 'form-field', order: 0, content: {}, styles: {} },
            { id: 'field-2', type: 'form-field', order: 1, content: {}, styles: {} },
          ],
        },
      ],
    }
    expect(() => designDocumentSchema.parse(design)).not.toThrow()
  })
})

describe('designDocumentSchema - unique ID validation', () => {
  it('accepts widgets with unique IDs', () => {
    const design = {
      globalStyles: {},
      widgets: [
        { id: 'widget-1', type: 'title', order: 0, content: {}, styles: {} },
        { id: 'widget-2', type: 'text', order: 1, content: {}, styles: {} },
        { id: 'widget-3', type: 'button', order: 2, content: {}, styles: {} },
      ],
    }
    expect(() => designDocumentSchema.parse(design)).not.toThrow()
  })

  it('rejects duplicate IDs at root level', () => {
    const design = {
      globalStyles: {},
      widgets: [
        { id: 'same-id', type: 'title', order: 0, content: {}, styles: {} },
        { id: 'same-id', type: 'text', order: 1, content: {}, styles: {} },
      ],
    }
    expect(() => designDocumentSchema.parse(design)).toThrow(/Duplicate/)
  })

  it('rejects duplicate IDs in nested structure', () => {
    const design = {
      globalStyles: {},
      widgets: [
        {
          id: 'row-1',
          type: 'row',
          order: 0,
          content: {},
          styles: {},
          children: [
            {
              id: 'col-1',
              type: 'column',
              order: 0,
              content: {},
              styles: {},
              children: [
                { id: 'text-1', type: 'text', order: 0, content: {}, styles: {} },
              ],
            },
          ],
        },
        { id: 'text-1', type: 'title', order: 1, content: {}, styles: {} }, // Duplicate of nested ID
      ],
    }
    expect(() => designDocumentSchema.parse(design)).toThrow(/Duplicate/)
  })

  it('accepts unique IDs across nested levels', () => {
    const design = {
      globalStyles: {},
      widgets: [
        {
          id: 'row-1',
          type: 'row',
          order: 0,
          content: {},
          styles: {},
          children: [
            {
              id: 'col-1',
              type: 'column',
              order: 0,
              content: {},
              styles: {},
              children: [
                { id: 'text-1', type: 'text', order: 0, content: {}, styles: {} },
              ],
            },
            {
              id: 'col-2',
              type: 'column',
              order: 1,
              content: {},
              styles: {},
              children: [
                { id: 'text-2', type: 'text', order: 0, content: {}, styles: {} },
              ],
            },
          ],
        },
      ],
    }
    expect(() => designDocumentSchema.parse(design)).not.toThrow()
  })
})
