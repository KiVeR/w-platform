import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  alias: {
    '#targeting': currentDir,
  },

  vite: {
    optimizeDeps: {
      include: ['@vue-leaflet/vue-leaflet', 'leaflet', 'reka-ui', 'reka-ui/date', '@internationalized/date'],
    },
  },

  imports: {
    dirs: [
      join(currentDir, './composables'),
      join(currentDir, './types'),
      join(currentDir, './utils'),
    ],
  },

  components: [
    {
      path: join(currentDir, './components'),
      pathPrefix: false,
    },
  ],
})
