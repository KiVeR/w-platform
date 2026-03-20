import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  // Note: tokens.css and animations.css are NOT loaded here.
  // The consuming app must @import them AFTER @import "tailwindcss"
  // to ensure Kreo design tokens override Tailwind v4 defaults
  // (--font-sans, --text-*, --radius-*, --shadow-*, --color-neutral-*).

  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],

  imports: {
    dirs: [
      join(currentDir, './composables'),
      join(currentDir, './stores'),
      join(currentDir, './constants'),
      join(currentDir, './services'),
      join(currentDir, './config'),
      join(currentDir, './utils'),
      join(currentDir, './types'),
      join(currentDir, './schemas'),
    ],
  },

  components: [
    {
      path: join(currentDir, './components'),
      pathPrefix: false,
    },
  ],

  pinia: {
    storesDirs: [join(currentDir, './stores/**')],
  },
})
