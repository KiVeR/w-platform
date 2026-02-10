import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  // Modules required by the editor layer
  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],

  // Note: tokens.css and animations.css are NOT loaded here.
  // The consuming app must @import them AFTER @import "tailwindcss"
  // to ensure Kreo design tokens override Tailwind v4 defaults
  // (--font-sans, --text-*, --radius-*, --shadow-*, --color-neutral-*).

  // Auto-import composables, stores, constants, services, config, utils, types, and schemas
  imports: {
    dirs: [
      'composables/**',
      'stores/**',
      'constants/**',
      'services/**',
      'config/**',
      'utils/**',
      'types/**',
      'schemas/**',
    ],
  },

  // Auto-import components without path prefix
  components: [
    {
      path: join(currentDir, './components'),
      pathPrefix: false,
    },
  ],

  // Pinia store discovery
  pinia: {
    storesDirs: [join(currentDir, './stores/**')],
  },
})
