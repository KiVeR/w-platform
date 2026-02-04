import type { DesignTokenCategory } from '#shared/constants/design-tokens'
import { DESIGN_TOKENS } from '#shared/constants/design-tokens'

export interface TokenViolation {
  widgetId: string
  property: string
  value: string
  nearestToken: string
  advisory?: boolean // True for new tokens (warnings only, doesn't affect valid flag)
}

export interface TokenValidationResult {
  valid: boolean
  violations: TokenViolation[]
  complianceRate: number
}

// Core tokens - validated strictly
const TOKEN_CHECKED_PROPERTIES: Record<string, DesignTokenCategory> = {
  fontSize: 'fontSize',
  fontWeight: 'fontWeight',
  lineHeight: 'lineHeight',
  borderRadius: 'borderRadius',
}

// New tokens - validated in advisory mode (warnings, not blocking)
const ADVISORY_TOKEN_PROPERTIES: Record<string, DesignTokenCategory> = {
  letterSpacing: 'letterSpacing',
  textTransform: 'textTransform',
  opacity: 'opacity',
}

const SPACING_PROPERTIES = ['padding', 'margin', 'gap', 'rowGap', 'columnGap']

/**
 * Parse a CSS value into numeric px value for nearest-token comparison.
 * Returns NaN for non-numeric values.
 */
function parsePxValue(value: string): number {
  return Number.parseFloat(value.replace('px', ''))
}

/**
 * Find the nearest token value from a scale for a given CSS value.
 */
export function snapToNearestToken(value: string, scale: readonly string[]): string {
  if (scale.includes(value))
    return value

  const numericValue = parsePxValue(value)
  if (Number.isNaN(numericValue))
    return value

  let nearest = scale[0]
  let minDiff = Infinity

  for (const token of scale) {
    const tokenValue = parsePxValue(token)
    const diff = Math.abs(tokenValue - numericValue)
    if (diff < minDiff) {
      minDiff = diff
      nearest = token
    }
  }

  return nearest
}

/**
 * Check if a single value is in a token scale.
 */
function isTokenCompliant(value: string, scale: readonly string[]): boolean {
  return scale.includes(value)
}

/**
 * Parse compound spacing values ("16px 24px", "8px 16px 8px 16px")
 * and check each component against the spacing token scale.
 */
function checkSpacingValue(value: string): boolean {
  const parts = value.trim().split(/\s+/)
  const scale = DESIGN_TOKENS.spacing

  return parts.every(part => isTokenCompliant(part, scale))
}

/**
 * Snap a compound spacing value to nearest tokens.
 */
export function snapSpacingToTokens(value: string): string {
  const parts = value.trim().split(/\s+/)
  return parts.map(part => snapToNearestToken(part, [...DESIGN_TOKENS.spacing])).join(' ')
}

interface WidgetLike {
  id?: string
  styles?: Record<string, string | undefined>
  children?: WidgetLike[]
}

/**
 * Validate that a design document's widget styles use design token values.
 * Advisory mode: returns violations without blocking.
 */
export function validateDesignTokens(widgets: WidgetLike[]): TokenValidationResult {
  const violations: TokenViolation[] = []
  let checkedCount = 0

  function checkWidget(widget: WidgetLike) {
    const styles = widget.styles
    if (!styles)
      return

    const widgetId = widget.id || 'unknown'

    // Check simple token properties (fontSize, fontWeight, lineHeight, borderRadius)
    for (const [prop, category] of Object.entries(TOKEN_CHECKED_PROPERTIES)) {
      const value = styles[prop]
      if (!value)
        continue

      checkedCount++
      const scale = DESIGN_TOKENS[category]
      if (!isTokenCompliant(value, scale)) {
        violations.push({
          widgetId,
          property: prop,
          value,
          nearestToken: snapToNearestToken(value, [...scale]),
        })
      }
    }

    // Check spacing properties (support compound values)
    for (const prop of SPACING_PROPERTIES) {
      const value = styles[prop]
      if (!value)
        continue

      checkedCount++
      if (!checkSpacingValue(value)) {
        violations.push({
          widgetId,
          property: prop,
          value,
          nearestToken: snapSpacingToTokens(value),
        })
      }
    }

    // Check advisory token properties (new tokens - warnings only)
    for (const [prop, category] of Object.entries(ADVISORY_TOKEN_PROPERTIES)) {
      const value = styles[prop]
      if (!value)
        continue

      // Advisory tokens don't count toward compliance rate
      const scale = DESIGN_TOKENS[category]
      if (!isTokenCompliant(value, scale)) {
        violations.push({
          widgetId,
          property: prop,
          value,
          nearestToken: snapToNearestToken(value, [...scale]),
          advisory: true,
        })
      }
    }

    // Recurse into children
    if (widget.children) {
      for (const child of widget.children) {
        checkWidget(child)
      }
    }
  }

  for (const widget of widgets) {
    checkWidget(widget)
  }

  // Only count non-advisory violations for compliance rate and validity
  const strictViolations = violations.filter(v => !v.advisory)
  const complianceRate = checkedCount === 0 ? 1 : (checkedCount - strictViolations.length) / checkedCount

  return {
    valid: strictViolations.length === 0,
    violations,
    complianceRate,
  }
}
