import { describe, expect, it } from 'vitest'
import {
  getSectionById,
  getSectionsByCategory,
  getTemplateById,
  getTemplatesByCategory,
  searchSections,
  searchTemplates,
  sectionCategories,
  sectionPresets,
  templateCategories,
  templatePresets,
} from '@/config/presets'

// =============================================================================
// Template Presets Tests
// =============================================================================

describe('templatePresets', () => {
  it('has at least 3 templates', () => {
    expect(templatePresets.length).toBeGreaterThanOrEqual(3)
  })

  it('each template has required fields', () => {
    for (const template of templatePresets) {
      expect(template.id).toBeTruthy()
      expect(typeof template.id).toBe('string')

      expect(template.name).toBeTruthy()
      expect(typeof template.name).toBe('string')

      expect(template.description).toBeTruthy()
      expect(typeof template.description).toBe('string')

      expect(template.category).toBeTruthy()
      expect(typeof template.category).toBe('string')

      expect(template.thumbnail).toBeTruthy()
      expect(typeof template.thumbnail).toBe('string')

      expect(template.tags).toBeInstanceOf(Array)
      expect(template.tags.length).toBeGreaterThan(0)

      expect(template.widgets).toBeInstanceOf(Array)
      expect(template.globalStyles).toBeDefined()
    }
  })

  it('each template has valid category', () => {
    const validCategories = templateCategories.map(c => c.id)
    for (const template of templatePresets) {
      expect(validCategories).toContain(template.category)
    }
  })

  it('each template has at least one widget', () => {
    for (const template of templatePresets) {
      expect(template.widgets.length).toBeGreaterThan(0)
    }
  })

  it('each template widget has required fields', () => {
    for (const template of templatePresets) {
      for (const widget of template.widgets) {
        expect(widget.id).toBeTruthy()
        expect(widget.type).toBeTruthy()
        expect(typeof widget.order).toBe('number')
        expect(widget.content).toBeDefined()
        expect(widget.styles).toBeDefined()
      }
    }
  })

  it('each template has valid globalStyles', () => {
    for (const template of templatePresets) {
      expect(template.globalStyles.backgroundColor).toBeTruthy()
      expect(template.globalStyles.textColor).toBeTruthy()
    }
  })

  it('has unique template IDs', () => {
    const ids = templatePresets.map(t => t.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })
})

// =============================================================================
// Section Presets Tests
// =============================================================================

describe('sectionPresets', () => {
  it('has at least 5 sections', () => {
    expect(sectionPresets.length).toBeGreaterThanOrEqual(5)
  })

  it('each section has required fields', () => {
    for (const section of sectionPresets) {
      expect(section.id).toBeTruthy()
      expect(typeof section.id).toBe('string')

      expect(section.name).toBeTruthy()
      expect(typeof section.name).toBe('string')

      expect(section.description).toBeTruthy()
      expect(typeof section.description).toBe('string')

      expect(section.category).toBeTruthy()
      expect(typeof section.category).toBe('string')

      expect(section.thumbnail).toBeTruthy()
      expect(typeof section.thumbnail).toBe('string')

      expect(section.tags).toBeInstanceOf(Array)
      expect(section.tags.length).toBeGreaterThan(0)

      expect(section.widgets).toBeInstanceOf(Array)
    }
  })

  it('each section has valid category', () => {
    const validCategories = sectionCategories.map(c => c.id)
    for (const section of sectionPresets) {
      expect(validCategories).toContain(section.category)
    }
  })

  it('each section has at least one widget', () => {
    for (const section of sectionPresets) {
      expect(section.widgets.length).toBeGreaterThan(0)
    }
  })

  it('has unique section IDs', () => {
    const ids = sectionPresets.map(s => s.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })
})

// =============================================================================
// Template Categories Tests
// =============================================================================

describe('templateCategories', () => {
  it('has at least 3 categories', () => {
    expect(templateCategories.length).toBeGreaterThanOrEqual(3)
  })

  it('each category has required fields', () => {
    for (const category of templateCategories) {
      expect(category.id).toBeTruthy()
      expect(category.label).toBeTruthy()
      expect(category.icon).toBeTruthy()
    }
  })

  it('has unique category IDs', () => {
    const ids = templateCategories.map(c => c.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })
})

// =============================================================================
// Section Categories Tests
// =============================================================================

describe('sectionCategories', () => {
  it('has at least 5 categories', () => {
    expect(sectionCategories.length).toBeGreaterThanOrEqual(5)
  })

  it('each category has required fields', () => {
    for (const category of sectionCategories) {
      expect(category.id).toBeTruthy()
      expect(category.label).toBeTruthy()
      expect(category.icon).toBeTruthy()
    }
  })

  it('has unique category IDs', () => {
    const ids = sectionCategories.map(c => c.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })
})

// =============================================================================
// Helper Functions Tests
// =============================================================================

describe('getTemplatesByCategory', () => {
  it('filters templates by category', () => {
    const marketing = getTemplatesByCategory('marketing')
    expect(marketing.every(t => t.category === 'marketing')).toBe(true)
    expect(marketing.length).toBeGreaterThan(0)
  })

  it('returns empty array for unknown category', () => {
    const result = getTemplatesByCategory('unknown-category')
    expect(result).toEqual([])
  })

  it('returns all templates for a category that has templates', () => {
    const contact = getTemplatesByCategory('contact')
    const expectedCount = templatePresets.filter(t => t.category === 'contact').length
    expect(contact.length).toBe(expectedCount)
  })
})

describe('getSectionsByCategory', () => {
  it('filters sections by category', () => {
    const hero = getSectionsByCategory('hero')
    expect(hero.every(s => s.category === 'hero')).toBe(true)
    expect(hero.length).toBeGreaterThan(0)
  })

  it('returns empty array for unknown category', () => {
    const result = getSectionsByCategory('unknown-category')
    expect(result).toEqual([])
  })
})

describe('searchTemplates', () => {
  it('finds templates by name', () => {
    const results = searchTemplates('promo')
    expect(results.length).toBeGreaterThan(0)
    expect(results.some(t => t.name.toLowerCase().includes('promo'))).toBe(true)
  })

  it('finds templates by description', () => {
    const results = searchTemplates('promotion')
    expect(results.length).toBeGreaterThan(0)
  })

  it('finds templates by tag', () => {
    const results = searchTemplates('newsletter')
    expect(results.length).toBeGreaterThan(0)
  })

  it('is case insensitive', () => {
    const lower = searchTemplates('promo')
    const upper = searchTemplates('PROMO')
    const mixed = searchTemplates('Promo')
    expect(lower).toEqual(upper)
    expect(lower).toEqual(mixed)
  })

  it('returns empty array for no match', () => {
    const results = searchTemplates('xyznonexistent123')
    expect(results).toEqual([])
  })

  it('returns all templates for empty query', () => {
    const results = searchTemplates('')
    expect(results.length).toBe(templatePresets.length)
  })
})

describe('searchSections', () => {
  it('finds sections by name', () => {
    const results = searchSections('hero')
    expect(results.length).toBeGreaterThan(0)
    expect(results.some(s => s.name.toLowerCase().includes('hero'))).toBe(true)
  })

  it('finds sections by tag', () => {
    const results = searchSections('cta')
    expect(results.length).toBeGreaterThan(0)
  })

  it('is case insensitive', () => {
    const lower = searchSections('hero')
    const upper = searchSections('HERO')
    expect(lower).toEqual(upper)
  })

  it('returns empty array for no match', () => {
    const results = searchSections('xyznonexistent123')
    expect(results).toEqual([])
  })

  it('returns all sections for empty query', () => {
    const results = searchSections('')
    expect(results.length).toBe(sectionPresets.length)
  })
})

describe('getTemplateById', () => {
  it('returns correct template', () => {
    const template = getTemplateById('promo-flash')
    expect(template).toBeDefined()
    expect(template?.id).toBe('promo-flash')
  })

  it('returns undefined for unknown id', () => {
    const template = getTemplateById('unknown-id')
    expect(template).toBeUndefined()
  })
})

describe('getSectionById', () => {
  it('returns correct section', () => {
    const section = getSectionById('hero-image')
    expect(section).toBeDefined()
    expect(section?.id).toBe('hero-image')
  })

  it('returns undefined for unknown id', () => {
    const section = getSectionById('unknown-id')
    expect(section).toBeUndefined()
  })
})
