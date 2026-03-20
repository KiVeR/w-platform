const DEFAULT_PRIMARY = '#14b8a6'

/**
 * Generates a full primary color scale (50-900) from a single hex color.
 * Uses HSL lightness offsets calibrated against Tailwind's shade scales.
 */
function generatePrimaryScale(hex: string): Record<string, string> {
  const { h, s, l: baseL } = hexToHSL(hex)

  // Lightness targets for each shade, relative to the base (500) lightness
  const shades: [number, number][] = [
    [50, Math.min(baseL + 45, 97)],
    [100, Math.min(baseL + 37, 94)],
    [200, Math.min(baseL + 28, 88)],
    [300, Math.min(baseL + 18, 78)],
    [400, Math.min(baseL + 9, 65)],
    [500, baseL],
    [600, Math.max(baseL - 7, 15)],
    [700, Math.max(baseL - 15, 12)],
    [800, Math.max(baseL - 22, 10)],
    [900, Math.max(baseL - 28, 8)],
  ]

  const result: Record<string, string> = {}
  for (const [shade, lightness] of shades) {
    result[`--color-primary-${shade}`] = hslToHex(h, s, lightness)
  }

  // Aliases
  result['--color-primary'] = result['--color-primary-500']!
  result['--color-primary-dark'] = result['--color-primary-600']!
  result['--color-primary-light'] = result['--color-primary-100']!

  return result
}

/**
 * Applies editor theme configuration as CSS custom properties on :root.
 *
 * @param config - Pass explicitly when calling from the same component that
 *   calls provideEditorConfig() (inject cannot read provide from the same scope).
 *   Falls back to inject() when omitted.
 */
export function useEditorTheme(config?: EditorConfig) {
  const resolvedConfig = config ?? useEditorConfig()

  const primaryColor = computed(() => resolvedConfig.theme?.primaryColor ?? DEFAULT_PRIMARY)
  const logo = computed(() => resolvedConfig.theme?.logo)
  const isCustomTheme = computed(() => !!resolvedConfig.theme?.primaryColor)

  const cssVariables = computed(() => generatePrimaryScale(primaryColor.value))

  if (import.meta.client) {
    const appliedProps: string[] = []

    const stopWatch = watchEffect(() => {
      const vars = cssVariables.value
      const el = document.documentElement
      for (const [prop, value] of Object.entries(vars)) {
        el.style.setProperty(prop, value)
      }
      appliedProps.length = 0
      appliedProps.push(...Object.keys(vars))
    })

    onScopeDispose(() => {
      stopWatch()
      const el = document.documentElement
      for (const prop of appliedProps) {
        el.style.removeProperty(prop)
      }
    })
  }

  return {
    primaryColor,
    logo,
    isCustomTheme,
    cssVariables,
  }
}
