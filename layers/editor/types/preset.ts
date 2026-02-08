import type { GlobalStyles, Widget } from './widget'

/**
 * Category for template classification
 */
export type TemplateCategory
  = 'marketing'
    | 'event'
    | 'product'
    | 'contact'
    | 'newsletter'

/**
 * Category for section classification
 */
export type SectionCategory
  = 'header'
    | 'hero'
    | 'features'
    | 'cta'
    | 'testimonial'
    | 'contact'
    | 'footer'
    | 'gallery'

/**
 * Base preset metadata shared by templates and sections
 */
export interface PresetMetadata {
  id: string
  name: string
  description: string
  thumbnail: string
  tags: string[]
}

/**
 * Landing page template preset with full page design
 */
export interface TemplatePreset extends PresetMetadata {
  category: TemplateCategory
  globalStyles: GlobalStyles
  widgets: Widget[]
}

/**
 * Reusable section preset (group of widgets)
 */
export interface SectionPreset extends PresetMetadata {
  category: SectionCategory
  widgets: Widget[]
}

/**
 * Template category with label for UI display
 */
export interface TemplateCategoryInfo {
  id: TemplateCategory
  label: string
  icon: string
}

/**
 * Section category with label for UI display
 */
export interface SectionCategoryInfo {
  id: SectionCategory
  label: string
  icon: string
}
