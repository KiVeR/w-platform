export interface Palette {
  name: string
  label: string
  primary: string
  secondary: string
  background: string
  text: string
}

export const palettes: Palette[] = [
  {
    name: 'turquoise',
    label: 'Turquoise',
    primary: '#14b8a6',
    secondary: '#0d9488',
    background: '#ffffff',
    text: '#1e293b'
  },
  {
    name: 'coral',
    label: 'Corail',
    primary: '#f97316',
    secondary: '#ea580c',
    background: '#ffffff',
    text: '#1e293b'
  },
  {
    name: 'violet',
    label: 'Violet',
    primary: '#8b5cf6',
    secondary: '#7c3aed',
    background: '#ffffff',
    text: '#1e293b'
  },
  {
    name: 'blue',
    label: 'Bleu',
    primary: '#3b82f6',
    secondary: '#2563eb',
    background: '#ffffff',
    text: '#1e293b'
  },
  {
    name: 'pink',
    label: 'Rose',
    primary: '#ec4899',
    secondary: '#db2777',
    background: '#ffffff',
    text: '#1e293b'
  },
  {
    name: 'dark',
    label: 'Sombre',
    primary: '#14b8a6',
    secondary: '#0d9488',
    background: '#1e293b',
    text: '#f8fafc'
  }
]

export const getPalette = (name: string): Palette | undefined => {
  return palettes.find(p => p.name === name)
}
