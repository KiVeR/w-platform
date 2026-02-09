import process from 'node:process'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // Extend the editor layer (shared editor core)
  extends: ['./layers/editor'],

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

  // Source directory (existing Vue components)
  srcDir: 'src/',

  // Server directory (explicitly set since srcDir is customized)
  serverDir: 'server/',

  // Modules
  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],

  // Vite configuration for Tailwind v4
  vite: {
    plugins: [
      tailwindcss(),
      ...(process.env.ANALYZE
        ? [visualizer({ filename: 'dist/stats.html', open: true, gzipSize: true, brotliSize: true })]
        : []),
    ],
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
    // Server-only secrets
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
    jwtAccessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    databaseUrl: process.env.DATABASE_URL,
    triggerApiUrl: process.env.TRIGGER_API_URL || '',
    triggerApiClientId: process.env.TRIGGER_API_CLIENT_ID || '',
    triggerApiClientSecret: process.env.TRIGGER_API_CLIENT_SECRET || '',

    // Public (exposed to client)
    public: {
      apiBase: '/api/v1',
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
    port: 5174,
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
    storesDirs: ['./src/stores/**'],
  },
})
