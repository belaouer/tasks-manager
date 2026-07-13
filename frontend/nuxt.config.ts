// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
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
