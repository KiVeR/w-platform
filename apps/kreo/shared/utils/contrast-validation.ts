/**
 * WCAG Contrast Validation for AI-generated designs
 *
 * Validates text color contrast against backgrounds and auto-fixes violations.
 * Uses WCAG 2.1 AA standard: minimum 4.5:1 ratio for normal text.
 */

export interface ContrastViolation {
  widgetId: string
  widgetType: string
  property: string
  textColor: string
  backgroundColor: string
  contrastRatio: number
  recommendation: string
}

export interface ContrastValidationResult {
  valid: boolean
  violations: ContrastViolation[]
  passRate: number
}

/** WCAG AA minimum contrast ratio for normal text */
const WCAG_AA_RATIO = 4.5

/** Convert hex color to RGB array */
function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '').toLowerCase()
  const full = normalized.length === 3
    ? normalized.split('').map(c => c + c).join('')
    : normalized

  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ]
}

/** WCAG relative luminance calculation */
function getLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const srgb = c / 255
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Calculate contrast ratio between two colors (WCAG formula) */
export function getContrastRatio(foreground: string, background: string): number {
  const l1 = getLuminance(foreground)
  const l2 = getLuminance(background)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/** Check if a hex color represents a light background */
export function isLightBackground(hex: string): boolean {
  return getLuminance(hex) > 0.5
}

/** Suggest a contrasting text color for a given background */
export function suggestContrastingColor(backgroundColor: string): string {
  return isLightBackground(backgroundColor) ? '#1a1a1a' : '#ffffff'
}

/** Check if a string is a valid hex color */
function isValidHexColor(value: unknown): value is string {
  if (typeof value !== 'string')
    return false
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)
}

interface WidgetLike {
  id: string
  type: string
  content?: Record<string, unknown>
  styles?: Record<string, unknown>
  children?: WidgetLike[]
}

interface GlobalStylesLike {
  backgroundColor?: string
  textColor?: string
  primaryColor?: string
}

/** Text color properties to check on widgets */
const TEXT_COLOR_PROPERTIES = ['color', 'titleColor', 'subtitleColor', 'labelColor']

/**
 * Validate all widgets in a design for contrast issues
 */
export function validateDesignContrast(
  widgets: WidgetLike[],
  globalStyles: GlobalStylesLike,
): ContrastValidationResult {
  const violations: ContrastViolation[] = []
  const globalBg = globalStyles.backgroundColor || '#ffffff'
  let totalChecked = 0

  function checkWidget(widget: WidgetLike, inheritedBg: string) {
    // Determine effective background for this widget
    const widgetBg = widget.styles?.backgroundColor
    const effectiveBg = isValidHexColor(widgetBg) ? widgetBg : inheritedBg

    // Check text color properties in styles
    for (const prop of TEXT_COLOR_PROPERTIES) {
      const color = widget.styles?.[prop]
      if (isValidHexColor(color)) {
        totalChecked++
        const ratio = getContrastRatio(color, effectiveBg)
        if (ratio < WCAG_AA_RATIO) {
          violations.push({
            widgetId: widget.id,
            widgetType: widget.type,
            property: `styles.${prop}`,
            textColor: color,
            backgroundColor: effectiveBg,
            contrastRatio: Math.round(ratio * 100) / 100,
            recommendation: suggestContrastingColor(effectiveBg),
          })
        }
      }
    }

    // Check text color properties in content (some widgets store color in content)
    for (const prop of TEXT_COLOR_PROPERTIES) {
      const color = widget.content?.[prop]
      if (isValidHexColor(color)) {
        totalChecked++
        const ratio = getContrastRatio(color, effectiveBg)
        if (ratio < WCAG_AA_RATIO) {
          violations.push({
            widgetId: widget.id,
            widgetType: widget.type,
            property: `content.${prop}`,
            textColor: color,
            backgroundColor: effectiveBg,
            contrastRatio: Math.round(ratio * 100) / 100,
            recommendation: suggestContrastingColor(effectiveBg),
          })
        }
      }
    }

    // Recurse into children with the effective background
    if (widget.children) {
      for (const child of widget.children) {
        checkWidget(child, effectiveBg)
      }
    }
  }

  for (const widget of widgets) {
    checkWidget(widget, globalBg)
  }

  const passRate = totalChecked > 0
    ? Math.round((1 - violations.length / totalChecked) * 100)
    : 100

  return {
    valid: violations.length === 0,
    violations,
    passRate,
  }
}

/**
 * Auto-fix contrast violations in a design by replacing problematic colors
 */
export function autoFixContrast(
  widgets: WidgetLike[],
  violations: ContrastViolation[],
): WidgetLike[] {
  // Build a map for quick lookup: "widgetId:property" -> recommendation
  const fixMap = new Map<string, string>()
  for (const v of violations) {
    fixMap.set(`${v.widgetId}:${v.property}`, v.recommendation)
  }

  function fixWidget(widget: WidgetLike): WidgetLike {
    const fixed: WidgetLike = {
      ...widget,
      styles: widget.styles ? { ...widget.styles } : undefined,
      content: widget.content ? { ...widget.content } : undefined,
    }

    // Fix styles properties
    for (const prop of TEXT_COLOR_PROPERTIES) {
      const key = `${widget.id}:styles.${prop}`
      const fix = fixMap.get(key)
      if (fix && fixed.styles) {
        (fixed.styles as Record<string, unknown>)[prop] = fix
      }
    }

    // Fix content properties
    for (const prop of TEXT_COLOR_PROPERTIES) {
      const key = `${widget.id}:content.${prop}`
      const fix = fixMap.get(key)
      if (fix && fixed.content) {
        (fixed.content as Record<string, unknown>)[prop] = fix
      }
    }

    // Recurse into children
    if (widget.children) {
      fixed.children = widget.children.map(fixWidget)
    }

    return fixed
  }

  return widgets.map(fixWidget)
}
