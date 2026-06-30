const tvPlatform = require('./tv.platform.config')

export default {
  ssr: false,
  target: 'static',
  modern: false,
  telemetry: false,
  env: {
    PROD: '1',
    WEBOS_APP: '1'
  },

  publicRuntimeConfig: {
    version: tvPlatform.version
  },

  head: {
    title: 'Bigbookshelf',
    htmlAttrs: {
      lang: 'en'
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=1920, height=1080, user-scalable=no' },
      { hid: 'description', name: 'description', content: 'Bigbookshelf - Self-hosted audiobook and podcast client for Smart TVs' },
      { name: 'format-detection', content: 'telephone=no' }
    ],
    script: [],
    link: [{ rel: 'icon', type: 'image/x-icon', href: 'favicon.ico' }]
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
    transpile: [
      'vue-toastification',
      'socket.io-client',
      'engine.io-client',
      'engine.io-parser',
      'socket.io-parser',
      '@socket.io/component-emitter',
      'component-emitter',
      'epubjs',
      'xmldom',
      '@teckel/vue-pdf',
      'pdfjs-dist',
      'libarchive.js'
    ],
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
        '@capacitor/core': stubs + '/Core.js',
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
      const { prepareTvDist } = require('./scripts/prepare-tv-dist')
      prepareTvDist(generator.distPath)
    }
  },

  router: {
    base: '/'
  }
}
