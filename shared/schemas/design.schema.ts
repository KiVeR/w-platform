import { z } from 'zod'
import { widgetTypeSchema } from '../widgets/definitions'

// Re-export for convenience
export { widgetTypeSchema }
export type { WidgetType } from '../widgets/definitions'

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

// =============================================================================
// SCHEMAS
// =============================================================================

// Widget content - flexible object to allow all widget-specific properties
export const widgetContentSchema = z.record(z.unknown()).optional()

// Widget styles - flexible object for CSS properties
export const widgetStylesSchema = z.record(z.string().optional()).optional()

// Recursive widget schema
export const widgetSchema: z.ZodType<{
  id: string
  type: string
  order: number
  content?: Record<string, unknown>
  styles?: Record<string, string | undefined>
  children?: unknown[]
}> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    type: widgetTypeSchema,
    order: z.number().int().min(0),
    content: widgetContentSchema,
    styles: widgetStylesSchema,
    children: z.array(widgetSchema).optional(),
  }),
)

// Global styles
export const globalStylesSchema = z.object({
  palette: z.string().optional(),
  backgroundColor: z.string().default('#ffffff'),
  textColor: z.string().optional(),
  fontFamily: z.string().optional(),
  maxWidth: z.number().optional(),
}).passthrough() // Allow additional properties

// Base design document schema (without validation refinements)
const baseDesignDocumentSchema = z.object({
  version: z.string().optional(),
  globalStyles: globalStylesSchema,
  widgets: z.array(widgetSchema),
})

// Design document with structural validations
export const designDocumentSchema = baseDesignDocumentSchema
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
