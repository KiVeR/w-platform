import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

const currentDir = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@/': `${resolve(currentDir)}/`,
      '~/': `${resolve(currentDir)}/`,
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'happy-dom',
  },
})
