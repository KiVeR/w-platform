const BORDER_SIDES = ['borderLeft', 'borderRight', 'borderTop', 'borderBottom'] as const

const borderSideChips = [
  { key: 'borderLeft', label: '←', title: 'Gauche' },
  { key: 'borderRight', label: '→', title: 'Droite' },
  { key: 'borderTop', label: '↑', title: 'Haut' },
  { key: 'borderBottom', label: '↓', title: 'Bas' },
] as const

export function useContainerBorders(
  widgetStyles: ComputedRef<Record<string, string | undefined>>,
  updateStyle: (key: string, value: string | undefined) => void,
) {
  function getActiveBorderSides(): string[] {
    return BORDER_SIDES.filter(side => widgetStyles.value[side])
  }

  function isBorderSideActive(side: string): boolean {
    return !!widgetStyles.value[side]
  }

  function getBorderWidth(): string {
    const firstActive = getActiveBorderSides()[0]
    if (!firstActive) {
      return '3'
    }
    return widgetStyles.value[firstActive]?.match(/^(\d+)px/)?.[1] || '3'
  }

  function getBorderColor(): string {
    const firstActive = getActiveBorderSides()[0]
    if (!firstActive) {
      return '#d4a041'
    }
    return widgetStyles.value[firstActive]?.match(/(#[0-9a-f]{3,8})/i)?.[1] || '#d4a041'
  }

  function toggleBorderSide(side: string) {
    if (isBorderSideActive(side)) {
      updateStyle(side, undefined)
    }
    else {
      const width = getBorderWidth()
      const color = getBorderColor()
      updateStyle(side, `${width}px solid ${color}`)
    }
  }

  function toggleAllBorders() {
    const activeSides = getActiveBorderSides()
    if (activeSides.length === BORDER_SIDES.length) {
      for (const side of BORDER_SIDES) {
        updateStyle(side, undefined)
      }
    }
    else {
      const width = getBorderWidth()
      const color = getBorderColor()
      for (const side of BORDER_SIDES) {
        if (!widgetStyles.value[side]) {
          updateStyle(side, `${width}px solid ${color}`)
        }
      }
    }
  }

  function updateBorderWidth(width: string) {
    const color = getBorderColor()
    for (const side of getActiveBorderSides()) {
      updateStyle(side, `${width}px solid ${color}`)
    }
  }

  function updateBorderColor(color: string) {
    const width = getBorderWidth()
    for (const side of getActiveBorderSides()) {
      updateStyle(side, `${width}px solid ${color}`)
    }
  }

  return {
    BORDER_SIDES,
    borderSideChips,
    getActiveBorderSides,
    isBorderSideActive,
    getBorderWidth,
    getBorderColor,
    toggleBorderSide,
    toggleAllBorders,
    updateBorderWidth,
    updateBorderColor,
  }
}
