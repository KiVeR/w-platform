import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  alias: {
    '#operations': currentDir,
  },

  imports: {
    dirs: [
      join(currentDir, './composables'),
      join(currentDir, './types'),
    ],
  },

  components: [
    {
      path: join(currentDir, './components'),
      pathPrefix: false,
    },
  ],
})
