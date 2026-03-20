export function useGlobalStyles() {
  const editorStore = useEditorStore()

  const globals = computed(() => editorStore.globalStyles)

  // Typography
  const fontFamily = computed(() => globals.value.fontFamily ?? 'Inter, system-ui, sans-serif')
  const headingFontFamily = computed(() => globals.value.headingFontFamily ?? fontFamily.value)
  const baseFontSize = computed(() => globals.value.baseFontSize ?? '16px')
  const lineHeight = computed(() => globals.value.lineHeight ?? '1.6')

  // Brand colors
  const primaryColor = computed(() => globals.value.primaryColor ?? '#14b8a6')
  const secondaryColor = computed(() => globals.value.secondaryColor ?? '#0d9488')
  const backgroundColor = computed(() => globals.value.backgroundColor ?? '#ffffff')
  const textColor = computed(() => globals.value.textColor ?? '#1e293b')

  // Layout
  const contentPadding = computed(() => globals.value.contentPadding ?? '16px')
  const widgetGap = computed(() => globals.value.widgetGap ?? '12px')
  const borderRadius = computed(() => globals.value.borderRadius ?? '8px')

  /**
   * Get effective style value: widget value > global default > fallback
   */
  function getEffectiveStyle<T>(
    widgetValue: T | undefined,
    globalValue: T,
    fallback: T,
  ): T {
    if (widgetValue !== undefined && widgetValue !== null && widgetValue !== '') {
      return widgetValue
    }
    return globalValue ?? fallback
  }

  /**
   * Check if a widget is using a global color (no custom value set)
   */
  function isUsingGlobalColor(widgetValue: string | undefined): boolean {
    return !widgetValue
  }

  return {
    globals,
    // Typography
    fontFamily,
    headingFontFamily,
    baseFontSize,
    lineHeight,
    // Brand colors
    primaryColor,
    secondaryColor,
    backgroundColor,
    textColor,
    // Layout
    contentPadding,
    widgetGap,
    borderRadius,
    // Utility
    getEffectiveStyle,
    isUsingGlobalColor,
  }
}
