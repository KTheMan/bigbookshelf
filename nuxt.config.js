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
    title: 'Audiobookshelf',
    htmlAttrs: {
      lang: 'en'
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=1920, height=1080, user-scalable=no' },
      { hid: 'description', name: 'description', content: 'Audiobookshelf - Self-hosted audiobook and podcast server client for LG webOS TV' },
      { name: 'format-detection', content: 'telephone=no' }
    ],
    script: [
      {
        src: 'libs/sortable.js'
      }
    ],
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

  hooks: {
    'generate:page'(page) {
      // webOS loads apps via file:// so absolute paths like /_nuxt/ resolve
      // to the filesystem root instead of the app directory. Strip <base href>
      // and rewrite /_nuxt/ script srcs to relative paths.
      page.html = page.html
        .replace(/<base[^>]*href="[^"]*"[^>]*>/i, '')
        .replace(/(<script[^>]+src=")\/(_nuxt\/)/g, '$1./$2')
        .replace(/(<link[^>]+href=")\/(_nuxt\/)/g, '$1./$2')
    },
    async 'generate:done'(generator) {
      // Nuxt's webpack builder strips leading './' from publicPath (converts
      // './_nuxt/' to '/_nuxt/'), so the webpack runtime always has an absolute
      // publicPath that breaks file:// loads on webOS. Patch it here to './_nuxt/'.
      const fs = require('fs')
      const path = require('path')
      const nuxtDir = path.join(generator.distPath, '_nuxt')
      const files = fs.readdirSync(nuxtDir).filter(f => f.endsWith('.js') && !f.endsWith('.worker.js'))
      let patched = 0
      for (const file of files) {
        const fp = path.join(nuxtDir, file)
        const src = fs.readFileSync(fp, 'utf8')
        // Only the webpack runtime has o.p="/_nuxt/" or similar single-assignment
        if (src.includes('.p="/_nuxt/"')) {
          const fixed = src.replace(/\.p="\/(_nuxt\/)"/g, '.p="./$1"')
          if (fixed !== src) {
            fs.writeFileSync(fp, fixed)
            patched++
          }
        }
      }
      console.log(`[webOS] Patched webpack publicPath in ${patched} file(s)`)
    }
  },

  build: {
    publicPath: './_nuxt/',
    // Use stable filenames (no content hashes) so pulls overwrite the same
    // files instead of leaving stale chunks alongside newly-named ones.
    // HTTP caching is irrelevant for a file:// webOS app.
    filenames: {
      app: '[name].js',
      chunk: '[name].js',
      css: '[name].css',
      img: 'img/[name].[ext]',
      font: 'fonts/[name].[ext]',
      video: 'video/[name].[ext]'
    },
    postcss: {
      postcssOptions: {
        plugins: {
          tailwindcss: {},
          autoprefixer: {}
        }
      }
    },
    babel: {
      presets: [
        ['@babel/preset-env', {
          targets: { chrome: '38' },
          useBuiltIns: false
        }]
      ],
      plugins: [
        ['@babel/plugin-transform-optional-chaining', { loose: true }],
        ['@babel/plugin-proposal-private-property-in-object', { loose: true }]
      ]
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

  router: {
    base: '/',
    mode: 'hash'
  }
}