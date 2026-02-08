export interface FontDefinition {
  /** Nom Google Fonts (ex: "Playfair Display") */
  name: string
  /** Catégorie CSS fallback */
  category: 'serif' | 'sans-serif' | 'display' | 'monospace'
  /** Usage recommandé */
  usage: 'display' | 'body' | 'both'
  /** Weights à charger */
  weights: number[]
}

export const FONT_CATALOG: FontDefinition[] = [
  // --- Sans-serif (body & display) ---
  { name: 'Inter', category: 'sans-serif', usage: 'both', weights: [400, 500, 600, 700] },
  { name: 'DM Sans', category: 'sans-serif', usage: 'body', weights: [400, 500, 600, 700] },
  { name: 'Source Sans Pro', category: 'sans-serif', usage: 'body', weights: [400, 500, 600, 700] },
  { name: 'Open Sans', category: 'sans-serif', usage: 'body', weights: [400, 500, 600, 700] },
  { name: 'Work Sans', category: 'sans-serif', usage: 'body', weights: [400, 500, 600, 700] },
  { name: 'Karla', category: 'sans-serif', usage: 'body', weights: [400, 500, 600, 700] },
  { name: 'Fira Sans', category: 'sans-serif', usage: 'body', weights: [400, 500, 600, 700] },
  { name: 'Outfit', category: 'sans-serif', usage: 'body', weights: [400, 500, 600, 700] },
  { name: 'Nunito', category: 'sans-serif', usage: 'body', weights: [400, 500, 600, 700] },
  { name: 'Lato', category: 'sans-serif', usage: 'body', weights: [400, 500, 600, 700] },
  { name: 'Roboto', category: 'sans-serif', usage: 'body', weights: [400, 500, 600, 700] },
  { name: 'Poppins', category: 'sans-serif', usage: 'both', weights: [400, 500, 600, 700] },
  { name: 'Montserrat', category: 'sans-serif', usage: 'both', weights: [400, 500, 600, 700] },
  { name: 'Raleway', category: 'sans-serif', usage: 'both', weights: [400, 500, 600, 700] },

  // --- Sans-serif (display/headings) ---
  { name: 'Oswald', category: 'sans-serif', usage: 'display', weights: [400, 500, 600, 700] },
  { name: 'Bebas Neue', category: 'sans-serif', usage: 'display', weights: [400] },
  { name: 'Archivo Black', category: 'sans-serif', usage: 'display', weights: [400] },

  // --- Serif (body) ---
  { name: 'Lora', category: 'serif', usage: 'body', weights: [400, 500, 600, 700] },
  { name: 'Merriweather', category: 'serif', usage: 'body', weights: [400, 700] },

  // --- Serif (display/headings) ---
  { name: 'Playfair Display', category: 'serif', usage: 'display', weights: [400, 500, 600, 700] },
  { name: 'DM Serif Display', category: 'serif', usage: 'display', weights: [400] },
  { name: 'Cormorant Garamond', category: 'serif', usage: 'display', weights: [400, 500, 600, 700] },
  { name: 'Fraunces', category: 'serif', usage: 'display', weights: [400, 500, 600, 700] },

  // --- System (no Google Fonts loading needed) ---
  { name: 'Georgia', category: 'serif', usage: 'both', weights: [400, 700] },
]

/** Fonts that don't need Google Fonts loading */
export const SYSTEM_FONTS = ['Georgia']

/** Generate CSS fontFamily value from a font name */
export function fontFamilyValue(name: string): string {
  const font = FONT_CATALOG.find(f => f.name === name)
  if (!font)
    return `${name}, sans-serif`
  return `${name}, ${font.category}`
}

/** Generate options for UI font selectors */
export function getFontOptions(): { value: string, label: string }[] {
  return FONT_CATALOG.map(f => ({
    value: fontFamilyValue(f.name),
    label: f.name,
  }))
}
