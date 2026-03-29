import process from 'node:process'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // Extend the editor layer (shared editor core)
  extends: ['@wellpack/content-editor'],

  ssr: false,
  devtools: { enabled: true },
  compatibilityDate: '2025-01-01',

  // App configuration
  app: {
    head: {
      title: 'Kreo',
      titleTemplate: '%s — Kreo',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
      ],
    },
  },

  // Nuxt 4 auto-detects app/ as srcDir and server/ as serverDir

  // Modules
  modules: [
    '@pinia/nuxt',
  ],

  // Vite configuration for Tailwind v4
  vite: {
    plugins: [
      tailwindcss(),
      ...(process.env.ANALYZE
        ? [visualizer({ filename: 'dist/stats.html', open: true, gzipSize: true, brotliSize: true })]
        : []),
    ],
    optimizeDeps: {
      include: ['vuedraggable'],
    },
    build: {
      rollupOptions: {
        external: ['@anthropic-ai/sdk', 'openai', 'bcryptjs', 'jsonwebtoken', '@prisma/client'],
      },
    },
  },

  // CSS
  css: ['~/assets/css/tailwind.css'],

  // Runtime config (env variables)
  runtimeConfig: {
    // Public (exposed to client — set via NUXT_PUBLIC_PLATFORM_API_URL)
    public: {
      platformApiUrl: '',
    },
  },

  // TypeScript
  typescript: {
    strict: true,
    shim: false,
  },

  // Nitro server config
  nitro: {
    // Enable experimental tasks for background jobs
    experimental: {
      tasks: true,
    },
  },

  // Dev server
  devServer: {
    port: Number(process.env.KREO_PORT || '3000'),
  },

  // Auto-imports
  imports: {
    dirs: [
      'composables/**',
      'stores/**',
    ],
  },

  // Components auto-import
  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],

  // Pinia
  pinia: {
    storesDirs: ['./app/stores/**'],
  },
})
