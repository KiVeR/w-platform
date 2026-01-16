import process from 'node:process'
import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: true },
  compatibilityDate: '2024-11-01',

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
    plugins: [tailwindcss()],
  },

  // CSS
  css: ['~/assets/css/tailwind.css'],

  // Runtime config (env variables)
  runtimeConfig: {
    // Server-only secrets
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
    databaseUrl: process.env.DATABASE_URL,

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
