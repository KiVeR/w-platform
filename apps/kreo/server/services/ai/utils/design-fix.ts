/**
 * Shared design fix utilities for AI drivers
 *
 * Fixes common LLM generation issues: parent-child constraints, IDs, ordering,
 * missing form buttons, JSON parsing, schema validation, and contrast.
 */
import type { AIStreamChunk } from '#shared/types/ai'
import { designDocumentSchema } from '#shared/schemas/design.schema'
import { autoFixContrast, validateDesignContrast } from '#shared/utils/contrast-validation'

/**
 * Fix parent-child constraint violations in the widget tree.
 *
 * - Column cannot contain row or column -> flatten the illegal child's children
 * - Row can only contain column -> wrap non-column children in a column
 */
export function fixParentChildConstraints(children: unknown[], parentType?: string): unknown[] {
  const result: unknown[] = []

  for (const child of children) {
    if (!child || typeof child !== 'object') {
      result.push(child)
      continue
    }

    const w = child as Record<string, unknown>
    const type = w.type as string

    // Column cannot contain row or column — flatten the illegal child's children
    if (parentType === 'column' && (type === 'row' || type === 'column')) {
      console.warn(`[AI Fix] Flattening illegal "${type}" inside column`)
      if (Array.isArray(w.children)) {
        for (const grandchild of w.children) {
          if (!grandchild || typeof grandchild !== 'object') {
            continue
          }
          const gc = grandchild as Record<string, unknown>
          // If row's children are columns, extract those columns' children
          if (type === 'row' && gc.type === 'column' && Array.isArray(gc.children)) {
            result.push(...fixParentChildConstraints(gc.children, parentType))
          }
          else {
            result.push(...fixParentChildConstraints([gc], parentType))
          }
        }
      }
      continue
    }

    // Row can only contain column — wrap non-column children in a column
    if (parentType === 'row' && type !== 'column') {
      console.warn(`[AI Fix] Wrapping "${type}" in column inside row`)
      result.push({
        id: `widget_fix_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'column',
        order: result.length,
        content: { columnWidth: '100%' },
        styles: {},
        children: [w],
      })
      continue
    }

    // Recursively fix children
    if (Array.isArray(w.children)) {
      w.children = fixParentChildConstraints(w.children, type)
    }

    result.push(w)
  }

  return result
}

/**
 * Fix widget IDs and order fields.
 *
 * - Ensures each widget has a unique string ID
 * - Resets order to match array index
 * - Ensures content and styles objects exist
 * - Recurses into children
 */
export function fixWidgetIdsAndOrder(widgets: unknown[]): unknown[] {
  let idCounter = 1

  const fix = (items: unknown[]): unknown[] => {
    return items.map((widget, index) => {
      if (!widget || typeof widget !== 'object')
        return widget

      const w = widget as Record<string, unknown>

      if (!w.id || typeof w.id !== 'string' || (w.id as string).startsWith('widget_fix_')) {
        w.id = `widget_${idCounter++}`
      }
      else {
        idCounter++
      }

      w.order = index

      if (!w.content || typeof w.content !== 'object') {
        w.content = {}
      }

      if (!w.styles || typeof w.styles !== 'object') {
        w.styles = {}
      }

      if (Array.isArray(w.children)) {
        w.children = fix(w.children)
      }

      return w
    })
  }

  return fix(widgets)
}

/**
 * Ensure every form widget has a submit button as its last child.
 *
 * If a form's children don't end with a button widget, a default submit button is appended.
 */
export function ensureFormSubmitButton(widgets: unknown[]): unknown[] {
  const walk = (items: unknown[]): unknown[] => {
    return items.map((widget) => {
      if (!widget || typeof widget !== 'object')
        return widget

      const w = widget as Record<string, unknown>

      if (Array.isArray(w.children)) {
        w.children = walk(w.children)
      }

      if (w.type === 'form' && Array.isArray(w.children)) {
        const children = w.children as Record<string, unknown>[]
        const lastChild = children[children.length - 1]
        const hasButton = lastChild && typeof lastChild === 'object' && (lastChild as Record<string, unknown>).type === 'button'

        if (!hasButton) {
          console.warn('[AI Fix] Adding missing submit button to form widget')
          children.push({
            id: `widget_form_btn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            type: 'button',
            order: children.length,
            content: { text: 'Envoyer', url: '' },
            styles: { margin: '8px' },
          })
        }
      }

      return w
    })
  }

  return walk(widgets)
}

/**
 * Apply all design fixes in the correct order.
 *
 * 1. Fix parent-child constraints
 * 2. Ensure form submit buttons
 * 3. Fix IDs and order
 */
export function applyAllDesignFixes(widgets: unknown[]): unknown[] {
  let fixed = fixParentChildConstraints(widgets, undefined)
  fixed = ensureFormSubmitButton(fixed)
  fixed = fixWidgetIdsAndOrder(fixed)
  return fixed
}

/**
 * Parse design JSON from raw LLM response text.
 *
 * Strips markdown code fences and locates the outermost JSON object.
 */
export function parseDesignResponse(response: string, driverName = 'AI'): unknown {
  let jsonStr = response.trim()

  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7)
  }
  else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3)
  }

  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3)
  }

  jsonStr = jsonStr.trim()

  const startIdx = jsonStr.indexOf('{')
  const endIdx = jsonStr.lastIndexOf('}')

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    jsonStr = jsonStr.slice(startIdx, endIdx + 1)
  }

  try {
    return JSON.parse(jsonStr)
  }
  catch {
    console.error(`[${driverName}] Failed to parse JSON:`, jsonStr.substring(0, 200))
    return null
  }
}

/**
 * Attempt to fix common schema validation issues in a parsed design object.
 *
 * Ensures version, globalStyles, and widgets exist, then applies structural fixes.
 */
export function attemptDesignFix(design: unknown): unknown {
  if (!design || typeof design !== 'object')
    return design

  const doc = design as Record<string, unknown>

  if (!doc.version) {
    doc.version = '1.0'
  }

  if (!doc.globalStyles || typeof doc.globalStyles !== 'object') {
    doc.globalStyles = {
      backgroundColor: '#ffffff',
      textColor: '#1e293b',
      primaryColor: '#3b82f6',
    }
  }

  if (!Array.isArray(doc.widgets)) {
    doc.widgets = []
  }

  doc.widgets = applyAllDesignFixes(doc.widgets as unknown[])

  return doc
}

type WidgetCastArray = {
  id: string
  type: string
  content?: Record<string, unknown>
  styles?: Record<string, unknown>
  children?: unknown[]
}[]

/**
 * Validate contrast on parsed design widgets and auto-fix violations.
 */
function validateAndFixContrast(
  widgets: WidgetCastArray,
  globalStyles: Record<string, unknown>,
  driverName: string,
): WidgetCastArray {
  const result = validateDesignContrast(widgets, globalStyles)

  if (result.valid) {
    return widgets
  }

  console.warn(`[${driverName}] Contrast violations detected: ${result.violations.length}`)
  for (const v of result.violations) {
    console.warn(`  - ${v.widgetId} (${v.widgetType}): ${v.property} ${v.textColor} on ${v.backgroundColor} = ${v.contrastRatio}:1`)
  }

  const fixed = autoFixContrast(widgets, result.violations)
  console.warn(`[${driverName}] Contrast auto-fixed for ${result.violations.length} widgets`)
  return fixed
}

/**
 * Validate a parsed design against the schema, fix issues, and validate contrast.
 *
 * Returns an AIStreamChunk -- either a 'design' chunk on success or an 'error' chunk on failure.
 */
export function validateDesignAndEmitChunk(design: unknown, driverName = 'AI'): AIStreamChunk {
  const parseResult = designDocumentSchema.safeParse(design)

  if (parseResult.success) {
    const finalWidgets = validateAndFixContrast(
      parseResult.data.widgets as WidgetCastArray,
      parseResult.data.globalStyles,
      driverName,
    )
    return {
      type: 'design',
      content: { ...parseResult.data, widgets: finalWidgets },
    }
  }

  // Try to fix common issues and retry
  const fixedDesign = attemptDesignFix(design)
  const retryResult = designDocumentSchema.safeParse(fixedDesign)

  if (retryResult.success) {
    const retryWidgets = validateAndFixContrast(
      retryResult.data.widgets as WidgetCastArray,
      retryResult.data.globalStyles,
      driverName,
    )
    return {
      type: 'design',
      content: { ...retryResult.data, widgets: retryWidgets },
    }
  }

  return {
    type: 'error',
    content: `Design validation failed: ${parseResult.error.errors.map(e => e.message).join(', ')}`,
    code: 'GENERATION_FAILED',
  }
}
