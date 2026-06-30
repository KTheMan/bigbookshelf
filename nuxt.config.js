const pkg = require('./package.json')

export default {
  ssr: false,
  target: 'static',
  telemetry: false,
  env: {
    PROD: '1',
    WEBOS_APP: '1'
  },

  publicRuntimeConfig: {
    version: pkg.version
  },

  head: {
    title: 'Bigbookshelf',
    htmlAttrs: {
      lang: 'en'
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=1920, height=1080, user-scalable=no' },
      { hid: 'description', name: 'description', content: 'Bigbookshelf - Self-hosted audiobook and podcast client for LG webOS TV' },
      { name: 'format-detection', content: 'telephone=no' }
    ],
    script: [],
    link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }]
  },

  css: ['@/assets/tailwind.css', '@/assets/app.css', '@/assets/webos.css'],

  plugins: [
    '@/plugins/webos/polyfills.js',
    '@/plugins/server.js',
    '@/plugins/db.js',
    '@/plugins/localStore.js',
    '@/plugins/init.client.js',
    '@/plugins/axios.js',
    '@/plugins/webos/index.js',
    '@/plugins/webos/AbsAudioPlayer.js',
    '@/plugins/webos/TVRemoteHandler.js',
    '@/plugins/nativeHttp.js',
    '@/plugins/toast.js',
    '@/plugins/constants.js',
    '@/plugins/haptics.js',
    '@/plugins/i18n.js'
  ],

  components: true,

  modules: ['@nuxtjs/axios'],

  axios: {},

  build: {
    // Use relative publicPath so assets load via file:// on webOS
    publicPath: './_nuxt/',
    postcss: {
      postcssOptions: {
        plugins: {
          tailwindcss: {},
          autoprefixer: {}
        }
      }
    },
    babel: {
      plugins: [['@babel/plugin-proposal-private-property-in-object', { loose: true }]]
    },
    extend(config) {
      const stubs = __dirname + '/plugins/webos/capacitor-stubs'

      Object.assign(config.resolve.alias, {
        '@capacitor/dialog': stubs + '/Dialog.js',
        '@capacitor/network': stubs + '/Network.js',
        '@capacitor/app': stubs + '/App.js',
        '@capacitor/status-bar': stubs + '/StatusBar.js',
        '@capacitor/clipboard': stubs + '/Clipboard.js',
        '@capacitor/browser': stubs + '/Browser.js',
        '@capacitor/preferences': stubs + '/Preferences.js',
        '@capacitor/haptics': stubs + '/Haptics.js',
        '@capacitor-community/volume-buttons': stubs + '/VolumeButtons.js',
        '@capacitor-community/keep-awake': stubs + '/KeepAwake.js',
        '@webnativellc/capacitor-filesharer': stubs + '/FileSharer.js'
      })
    }
  },

  generate: {
    dir: 'dist',
    fallback: true
  },

  hooks: {
    'generate:done'(generator) {
      // Fix base href for webOS file:// protocol — absolute paths break asset loading
      const fs = require('fs')
      const path = require('path')
      const indexPath = path.join(generator.distPath, 'index.html')
      let html = fs.readFileSync(indexPath, 'utf8')
      html = html.replace('<base href="/">', '<base href="./">')
      fs.writeFileSync(indexPath, html)
      console.log('[webOS] Fixed <base href> for file:// protocol')
    }
  },

  router: {
    base: '/'
  }
}