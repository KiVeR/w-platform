import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  imports: {
    dirs: [
      'composables/**',
      'types/**',
      'utils/**',
    ],
  },

  components: [
    {
      path: join(currentDir, './components'),
      pathPrefix: false,
    },
  ],
})
