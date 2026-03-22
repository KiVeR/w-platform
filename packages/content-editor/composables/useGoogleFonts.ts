const loadedFonts = new Set<string>()

/** Extract font name from a CSS fontFamily value (e.g. "Playfair Display, serif" → "Playfair Display") */
export function parseFontName(cssValue: string): string {
  return (cssValue.split(',')[0] ?? '').trim().replace(/['"]/g, '')
}

/** Build Google Fonts URL for a given font name */
function buildGoogleFontsUrl(fontName: string): string | null {
  if (SYSTEM_FONTS.includes(fontName))
    return null
  const def = FONT_CATALOG.find(f => f.name === fontName)
  if (!def)
    return null
  const weights = def.weights.join(';')
  const family = fontName.replace(/ /g, '+')
  return `https://fonts.googleapis.com/css2?family=${family}:wght@${weights}&display=swap`
}

/** Load a Google Font by name or CSS value. Idempotent (internal cache). */
export function loadFont(cssValueOrName: string): void {
  const fontName = cssValueOrName.includes(',') ? parseFontName(cssValueOrName) : cssValueOrName
  if (loadedFonts.has(fontName))
    return
  const url = buildGoogleFontsUrl(fontName)
  if (!url)
    return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = url
  link.dataset.googleFont = fontName
  document.head.appendChild(link)
  loadedFonts.add(fontName)
}

/** Composable: watch reactive refs and load fonts automatically */
export function useGoogleFonts(...fontRefs: Array<{ value: string }>) {
  function loadAll() {
    for (const ref of fontRefs) {
      if (ref.value)
        loadFont(ref.value)
    }
  }
  loadAll()
  watch(fontRefs, loadAll, { deep: true })
}
