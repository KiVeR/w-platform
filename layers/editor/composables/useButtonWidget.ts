import type { Widget } from '../types/widget'

export function useButtonWidget(widget: Ref<Widget> | ComputedRef<Widget>) {
  const { primaryColor, borderRadius } = useGlobalStyles()

  const isFullWidth = computed(() => toValue(widget).styles.widthMode !== 'auto')

  const wrapperStyles = computed(() => ({
    padding: toValue(widget).styles.padding,
    margin: toValue(widget).styles.margin,
    textAlign: toValue(widget).styles.textAlign || 'center',
  }))

  const buttonStyles = computed(() => ({
    backgroundColor: toValue(widget).styles.backgroundColor || primaryColor.value,
    color: toValue(widget).styles.color || '#ffffff',
    fontSize: toValue(widget).styles.fontSize,
    fontWeight: toValue(widget).styles.fontWeight,
    fontFamily: toValue(widget).styles.fontFamily,
    borderRadius: toValue(widget).styles.borderRadius || borderRadius.value,
    boxShadow: toValue(widget).styles.boxShadow,
    letterSpacing: toValue(widget).styles.letterSpacing,
    textTransform: toValue(widget).styles.textTransform,
  }))

  const iconSize = computed(() => {
    const fontSizeStr = toValue(widget).styles.fontSize || '16px'
    const fontSize = Number.parseFloat(fontSizeStr)
    return Math.round(fontSize * 1.1)
  })

  return { isFullWidth, wrapperStyles, buttonStyles, iconSize }
}
