module.exports = {
  /*
  ** Headers of the page
  */
  modules: [
    '@nuxtjs/axios',
  ],
  axios: {
    // API url
    baseURL: 'https://admin.pangea.global'
    // baseURL: 'http://localhost:3001'
  },
  head: {
    title: 'Translate request',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, height=device-height, initial-scale=1.0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0 ' },
      { hid: 'description', name: 'description', content: 'Nuxt.js project' },

    ],
    script: [
      { src: 'https://use.fontawesome.com/releases/v5.0.8/js/all.js' },
      { src: 'https://www.google.com/recaptcha/api.js?onload=vueRecaptchaApiLoaded&render=explicit'}
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      { href: "https://fonts.googleapis.com/css?family=Open+Sans:400,700", rel: "stylesheet" }
    ]
  },
  /*
  ** Customize the progress bar color
  */
  loading: { color: '#3B8070' },
  /*
  ** Build configuration
  */
  build: {
    extend(config, { isDev, isClient }) {
      if (isDev && isClient) {
        config.module.rules.push({
          enforce: 'pre',
          test: /\.(js|vue)$/,
          loader: 'eslint-loader',
          exclude: /(node_modules)/
        })
      }
    }
  }
}
