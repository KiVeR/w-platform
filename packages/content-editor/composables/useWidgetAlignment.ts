export type Alignment = 'left' | 'center' | 'right'
export type WidthMode = 'auto' | 'full'

interface WidgetStyles {
  textAlign?: Alignment
  widthMode?: WidthMode
  [key: string]: unknown
}

interface AlignmentOptions {
  mode?: 'flex' | 'text'
  defaultAlign?: Alignment
  defaultWidth?: WidthMode
}

interface AlignmentResult {
  alignment: ComputedRef<Alignment>
  widthMode: ComputedRef<WidthMode>
  wrapperStyles: ComputedRef<Record<string, string>>
  contentStyles: ComputedRef<Partial<Record<string, string>>>
}

const JUSTIFY_MAP: Record<Alignment, string> = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
}

/** Composable for consistent widget alignment (flex or text mode). */
export function useWidgetAlignment(
  styles: ComputedRef<WidgetStyles> | WidgetStyles,
  options: AlignmentOptions = {},
): AlignmentResult {
  const {
    mode = 'flex',
    defaultAlign = 'center',
    defaultWidth = 'auto',
  } = options

  const normalizedStyles = computed(() => unref(styles))

  const alignment = computed<Alignment>(() =>
    normalizedStyles.value.textAlign ?? defaultAlign,
  )

  const widthMode = computed<WidthMode>(() =>
    normalizedStyles.value.widthMode ?? defaultWidth,
  )

  const wrapperStyles = computed<Record<string, string>>(() => {
    if (mode === 'flex') {
      if (widthMode.value === 'full') {
        const styles: Record<string, string> = { display: 'flex', justifyContent: 'flex-start', width: '100%' }
        return styles
      }
      const styles: Record<string, string> = { display: 'flex', justifyContent: JUSTIFY_MAP[alignment.value], width: '100%' }
      return styles
    }
    const styles: Record<string, string> = { textAlign: alignment.value, width: '100%' }
    return styles
  })

  const contentStyles = computed<Partial<Record<string, string>>>(() => {
    if (mode === 'flex' && widthMode.value === 'full') {
      return { width: '100%' }
    }
    return {}
  })

  return {
    alignment,
    widthMode,
    wrapperStyles,
    contentStyles,
  }
}
