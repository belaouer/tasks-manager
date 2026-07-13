// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000'
    }
  },
  app: {
    head: {
      title: 'Tasks Manager Frontend',
      meta: [
        {
          name: 'description',
          content:
            'Frontend Nuxt du projet Tasks Manager avec base UI responsive et architecture maintenable.'
        }
      ]
    }
  }
})
