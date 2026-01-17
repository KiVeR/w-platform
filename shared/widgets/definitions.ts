import { z } from 'zod'

// =============================================================================
// SINGLE SOURCE OF TRUTH - Widget Type Definitions
// =============================================================================
// All widget types are defined here ONCE.
// TypeScript types and Zod schemas are derived from this single source.
// =============================================================================

/**
 * All available widget types in Kreo.
 * This is the SINGLE SOURCE OF TRUTH for widget types.
 *
 * To add a new widget:
 * 1. Add the type string to this array
 * 2. Add configuration in src/config/widgets.ts
 * 3. Create renderer in src/components/widgets/registry/
 */
export const WIDGET_TYPES = [
  // Base
  'title',
  'text',
  'image',
  'button',
  'separator',
  'spacer',
  'click-to-call',
  // Structure
  'row',
  'column',
  // Forms
  'form',
  'form-field',
  // Media
  'video',
  'map',
  'social',
  'icon',
  // Wellpack
  'barcode',
  'store-locator',
  'drive',
  'scratch',
  'flipcard',
  // Advanced
  'gallery',
  'slider',
  'link-image',
  'effect',
] as const

/**
 * Zod schema for widget types - derived from WIDGET_TYPES
 */
export const widgetTypeSchema = z.enum(WIDGET_TYPES)

/**
 * TypeScript type for widget types - inferred from Zod schema
 */
export type WidgetType = z.infer<typeof widgetTypeSchema>

/**
 * Widget categories for organization in the UI palette
 */
export const WIDGET_CATEGORIES = [
  'content',
  'actions',
  'layout',
  'media',
  'interactive',
] as const

export const widgetCategorySchema = z.enum(WIDGET_CATEGORIES)
export type WidgetCategory = z.infer<typeof widgetCategorySchema>
