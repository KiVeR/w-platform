import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  // Modules required by the editor layer
  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],

  // Editor design tokens and animations
  css: [
    join(currentDir, './assets/css/tokens.css'),
    join(currentDir, './assets/css/animations.css'),
  ],

  // Alias — shared/ lives at the repo root, not inside the layer
  alias: {
    '#shared': resolve(currentDir, '../../shared'),
  },

  // Auto-import composables, stores, constants, services, config, and utils
  imports: {
    dirs: [
      'composables/**',
      'stores/**',
      'constants/**',
      'services/**',
      'config/**',
      'utils/**',
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
