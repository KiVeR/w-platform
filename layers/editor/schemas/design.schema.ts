import { z } from 'zod'

// =============================================================================
// SECURITY LIMITS
// =============================================================================

/** Maximum number of widgets in a design document */
export const MAX_WIDGETS = 500

/** Maximum depth of widget tree nesting */
export const MAX_NESTING_DEPTH = 10

/** Maximum length for string content values */
export const MAX_STRING_LENGTH = 50000

/** Maximum length for style values */
export const MAX_STYLE_VALUE_LENGTH = 1000

/** Maximum number of children per container widget */
export const MAX_CHILDREN_PER_WIDGET = 50

/** Maximum payload size in bytes (5MB) */
export const MAX_PAYLOAD_SIZE = 5 * 1024 * 1024

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

interface WidgetNode {
  id: string
  type: string
  children?: WidgetNode[]
}

// Parent-child constraints based on widget configuration
const PARENT_CHILD_CONSTRAINTS: Record<string, { allowed?: string[], disallowed?: string[] }> = {
  row: { allowed: ['column'] },
  column: { disallowed: ['row', 'column'] },
  form: { disallowed: ['form'] },
}

/**
 * Validates parent-child constraints in the widget tree
 * - row can only contain column
 * - column cannot contain row or column (prevents infinite nesting)
 * - form cannot contain nested form
 */
function validateParentChildConstraints(widgets: WidgetNode[]): { valid: boolean, error?: string } {
  function validate(nodes: WidgetNode[], parentType?: string): { valid: boolean, error?: string } {
    for (const widget of nodes) {
      // Check if this widget is allowed as a child of its parent
      if (parentType) {
        const constraints = PARENT_CHILD_CONSTRAINTS[parentType]
        if (constraints) {
          if (constraints.allowed && !constraints.allowed.includes(widget.type)) {
            return {
              valid: false,
              error: `Widget "${parentType}" only accepts [${constraints.allowed.join(', ')}] as children, got "${widget.type}"`,
            }
          }
          if (constraints.disallowed && constraints.disallowed.includes(widget.type)) {
            return {
              valid: false,
              error: `Widget "${parentType}" cannot contain "${widget.type}"`,
            }
          }
        }
      }

      // Recursively validate children
      if (widget.children && widget.children.length > 0) {
        const childResult = validate(widget.children, widget.type)
        if (!childResult.valid) {
          return childResult
        }
      }
    }
    return { valid: true }
  }

  return validate(widgets)
}

/**
 * Validates that all widget IDs are unique across the entire tree
 */
function validateUniqueIds(widgets: WidgetNode[]): { valid: boolean, error?: string, duplicates?: string[] } {
  const ids = new Set<string>()
  const duplicates: string[] = []

  function collect(nodes: WidgetNode[]): void {
    for (const widget of nodes) {
      if (ids.has(widget.id)) {
        duplicates.push(widget.id)
      }
      else {
        ids.add(widget.id)
      }
      if (widget.children) {
        collect(widget.children)
      }
    }
  }

  collect(widgets)

  if (duplicates.length > 0) {
    return {
      valid: false,
      error: `Duplicate widget IDs found: ${[...new Set(duplicates)].join(', ')}`,
      duplicates: [...new Set(duplicates)],
    }
  }

  return { valid: true }
}

/**
 * Validates that the widget tree doesn't exceed maximum nesting depth
 */
function validateNestingDepth(widgets: WidgetNode[], maxDepth: number = MAX_NESTING_DEPTH): { valid: boolean, error?: string } {
  function checkDepth(nodes: WidgetNode[], currentDepth: number): { valid: boolean, error?: string } {
    if (currentDepth > maxDepth) {
      return {
        valid: false,
        error: `Widget tree exceeds maximum nesting depth of ${maxDepth}`,
      }
    }

    for (const widget of nodes) {
      if (widget.children && widget.children.length > 0) {
        const result = checkDepth(widget.children, currentDepth + 1)
        if (!result.valid) {
          return result
        }
      }
    }

    return { valid: true }
  }

  return checkDepth(widgets, 1)
}

/**
 * Counts total widgets in the tree (including nested)
 */
function countWidgets(widgets: WidgetNode[]): number {
  let count = 0
  for (const widget of widgets) {
    count++
    if (widget.children) {
      count += countWidgets(widget.children)
    }
  }
  return count
}

/**
 * Validates that total widget count doesn't exceed maximum
 */
function validateWidgetCount(widgets: WidgetNode[], maxWidgets: number = MAX_WIDGETS): { valid: boolean, error?: string, count?: number } {
  const count = countWidgets(widgets)
  if (count > maxWidgets) {
    return {
      valid: false,
      error: `Design contains ${count} widgets, exceeding maximum of ${maxWidgets}`,
      count,
    }
  }
  return { valid: true, count }
}

// =============================================================================
// SCHEMAS
// =============================================================================

// Widget content - object with string values limited in length
// We use z.record with transformation to handle unknown content shapes
export const widgetContentSchema = z.record(z.unknown()).transform((obj) => {
  // Validate string values don't exceed max length
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && value.length > MAX_STRING_LENGTH) {
      throw new Error(`Content field "${key}" exceeds maximum length of ${MAX_STRING_LENGTH}`)
    }
  }
  return obj
}).optional()

// Widget styles - object with CSS values limited in length
export const widgetStylesSchema = z.record(
  z.string().max(MAX_STYLE_VALUE_LENGTH).optional(),
).optional()

// Recursive widget schema with security limits
export const widgetSchema: z.ZodType<{
  id: string
  type: string
  order: number
  content?: Record<string, unknown>
  styles?: Record<string, string | undefined>
  children?: unknown[]
}> = z.lazy(() =>
  z.object({
    id: z.string().min(1).max(100), // Limit ID length
    type: widgetTypeSchema,
    order: z.number().int().min(0),
    content: widgetContentSchema,
    styles: widgetStylesSchema,
    children: z.array(widgetSchema).max(MAX_CHILDREN_PER_WIDGET).optional(),
  }),
)

// Reusable base schemas for global styles
const colorValueSchema = z.string().max(50).optional()
const cssValueSchema = z.string().max(50).optional()
const fontFamilySchema = z.string().max(200).optional()

// Global styles with secure limits
// NOTE: Using strict() to prevent unknown properties. Add new properties explicitly.
export const globalStylesSchema = z.object({
  palette: z.string().max(100).optional(),
  backgroundColor: z.string().max(50).default('#ffffff'),
  textColor: colorValueSchema,
  primaryColor: colorValueSchema,
  secondaryColor: colorValueSchema,
  fontFamily: fontFamilySchema,
  headingFontFamily: fontFamilySchema,
  baseFontSize: z.string().max(20).optional(),
  lineHeight: z.string().max(20).optional(),
  maxWidth: z.number().min(0).max(10000).optional(),
  contentPadding: cssValueSchema,
  widgetGap: cssValueSchema,
  borderRadius: cssValueSchema,
  pageTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
  linkColor: colorValueSchema,
  buttonStyle: cssValueSchema,
}).strict()

// Base design document schema (without validation refinements)
const baseDesignDocumentSchema = z.object({
  version: z.string().optional(),
  globalStyles: globalStylesSchema,
  widgets: z.array(widgetSchema),
})

// Design document with structural validations
export const designDocumentSchema = baseDesignDocumentSchema
  // Validate total widget count
  .refine(
    (data) => {
      const result = validateWidgetCount(data.widgets as WidgetNode[])
      return result.valid
    },
    (data) => {
      const result = validateWidgetCount(data.widgets as WidgetNode[])
      return { message: result.error ?? `Design exceeds maximum of ${MAX_WIDGETS} widgets` }
    },
  )
  // Validate nesting depth
  .refine(
    (data) => {
      const result = validateNestingDepth(data.widgets as WidgetNode[])
      return result.valid
    },
    (data) => {
      const result = validateNestingDepth(data.widgets as WidgetNode[])
      return { message: result.error ?? `Widget tree exceeds maximum nesting depth of ${MAX_NESTING_DEPTH}` }
    },
  )
  // Validate unique IDs
  .refine(
    (data) => {
      const result = validateUniqueIds(data.widgets as WidgetNode[])
      return result.valid
    },
    (data) => {
      const result = validateUniqueIds(data.widgets as WidgetNode[])
      return { message: result.error ?? 'Duplicate widget IDs found' }
    },
  )
  // Validate parent-child constraints
  .refine(
    (data) => {
      const result = validateParentChildConstraints(data.widgets as WidgetNode[])
      return result.valid
    },
    (data) => {
      const result = validateParentChildConstraints(data.widgets as WidgetNode[])
      return { message: result.error ?? 'Invalid parent-child widget structure' }
    },
  )

// Save design request body
export const saveDesignSchema = z.object({
  design: designDocumentSchema,
  createVersion: z.boolean().default(true), // Whether to create a new version or update latest
})

// Infer types (WidgetType is re-exported from definitions.ts)
export type WidgetSchema = z.infer<typeof widgetSchema>
export type GlobalStylesSchema = z.infer<typeof globalStylesSchema>
export type DesignDocumentSchema = z.infer<typeof designDocumentSchema>
export type SaveDesignInput = z.infer<typeof saveDesignSchema>

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

/**
 * Count total widgets in a design document (exported for use in metadata)
 */
export function getWidgetCount(widgets: WidgetNode[]): number {
  return countWidgets(widgets)
}

/**
 * Validate payload size before processing
 * @param body - The request body to validate
 * @returns { valid: true } or { valid: false, error: string, size: number }
 */
export function validatePayloadSize(body: unknown): { valid: boolean, error?: string, size?: number } {
  const size = JSON.stringify(body).length
  if (size > MAX_PAYLOAD_SIZE) {
    return {
      valid: false,
      error: `Payload size (${Math.round(size / 1024 / 1024 * 100) / 100}MB) exceeds maximum of ${MAX_PAYLOAD_SIZE / 1024 / 1024}MB`,
      size,
    }
  }
  return { valid: true, size }
}
