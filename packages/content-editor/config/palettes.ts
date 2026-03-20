export interface Palette {
  name: string
  label: string
  primary: string
  primaryDark: string
  background: string
  text: string
  isDark?: boolean
}

export const palettes: Palette[] = [
  {
    name: 'turquoise',
    label: 'Turquoise',
    primary: '#14b8a6',
    primaryDark: '#0d9488',
    background: '#ffffff',
    text: '#1e293b',
  },
  {
    name: 'sunset',
    label: 'Coucher de soleil',
    primary: '#f97316',
    primaryDark: '#ea580c',
    background: '#fffbeb',
    text: '#1e293b',
  },
  {
    name: 'ocean',
    label: 'Océan',
    primary: '#0ea5e9',
    primaryDark: '#0284c7',
    background: '#f0f9ff',
    text: '#0f172a',
  },
  {
    name: 'forest',
    label: 'Forêt',
    primary: '#22c55e',
    primaryDark: '#16a34a',
    background: '#f0fdf4',
    text: '#14532d',
  },
  {
    name: 'lavender',
    label: 'Lavande',
    primary: '#8b5cf6',
    primaryDark: '#7c3aed',
    background: '#faf5ff',
    text: '#1e1b4b',
  },
  {
    name: 'rose',
    label: 'Rose',
    primary: '#f43f5e',
    primaryDark: '#e11d48',
    background: '#fff1f2',
    text: '#1e1b4b',
  },
  {
    name: 'midnight',
    label: 'Minuit',
    primary: '#14b8a6',
    primaryDark: '#0d9488',
    background: '#0f172a',
    text: '#f8fafc',
    isDark: true,
  },
  {
    name: 'charcoal',
    label: 'Charbon',
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    background: '#18181b',
    text: '#fafafa',
    isDark: true,
  },
]

export function getPaletteByName(name: string): Palette | undefined {
  return palettes.find(p => p.name === name)
}
