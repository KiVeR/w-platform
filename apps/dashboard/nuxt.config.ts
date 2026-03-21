import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  // Extend shared layers (visual editor + SMS, targeting/geo)
  extends: ['@wellpack/content-editor', '@wellpack/targeting', '@wellpack/operations', '@wellpack/billing'],

  // SPA mode — auth-first dashboard, pas de SEO nécessaire
  ssr: false,

  devtools: { enabled: true },

  modules: [
    'shadcn-nuxt',
    '@pinia/nuxt',
    '@nuxtjs/i18n',
    '@vueuse/nuxt',
  ],

  css: ['~/assets/css/main.css', 'vue-sonner/style.css', 'leaflet/dist/leaflet.css'],

  vite: {
    resolve: {
      preserveSymlinks: true,
    },
    plugins: [tailwindcss() as never],
  },

  typescript: {
    tsConfig: {
      compilerOptions: {
        preserveSymlinks: true,
      },
    },
  },

  runtimeConfig: {
    public: {
      apiUrl: 'http://localhost:8000',
      googleClientId: '',
      pusher: {
        appKey: process.env.NUXT_PUBLIC_PUSHER_APP_KEY || '',
        cluster: process.env.NUXT_PUBLIC_PUSHER_CLUSTER || 'eu',
        host: process.env.NUXT_PUBLIC_PUSHER_HOST || '',
        port: Number(process.env.NUXT_PUBLIC_PUSHER_PORT || '443'),
        scheme: process.env.NUXT_PUBLIC_PUSHER_SCHEME || 'https',
        enabled: process.env.NUXT_PUBLIC_PUSHER_ENABLED || 'false',
        logToConsole: process.env.NUXT_PUBLIC_PUSHER_LOG_TO_CONSOLE || 'false',
      },
    },
  },

  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },

  i18n: {
    locales: [
      { code: 'fr', name: 'Français', file: 'fr.json' },
      { code: 'en', name: 'English', file: 'en.json' },
    ],
    defaultLocale: 'fr',
    langDir: 'locales',
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      title: 'Wellpack Dashboard',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=Inter:wght@600;700&family=JetBrains+Mono:wght@400;500;600&display=swap' },
      ],
    },
  },
})
