import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createResolver, defineNuxtModule, addImportsDir } from '@nuxt/kit'

const currentDir = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  modules: [
    defineNuxtModule({
      meta: { name: '@wellpack/targeting' },
      setup() {
        const { resolve } = createResolver(import.meta.url)
        addImportsDir(resolve('./composables'))
        addImportsDir(resolve('./types'))
        addImportsDir(resolve('./utils'))
      },
    }),
  ],

  components: [
    {
      path: join(currentDir, './components'),
      pathPrefix: false,
    },
  ],
})
