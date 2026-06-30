<template>
  <header id="appbar" class="bb-tv-topbar">
    <div class="bb-tv-title-block">
      <button v-if="showBack" type="button" aria-label="Back" class="bb-tv-back-btn" @click="back">
        <span class="material-symbols">arrow_back</span>
        <span>Back</span>
      </button>
      <div v-else>
        <p class="bb-tv-eyebrow">{{ sectionLabel }}</p>
        <h1 class="bb-tv-title">{{ pageTitle }}</h1>
      </div>
    </div>

    <div class="bb-tv-topbar-actions">
      <button v-if="user && currentLibrary" type="button" aria-label="Show library modal" class="bb-tv-library-pill" @click="clickShowLibraryModal">
        <ui-library-icon :icon="currentLibraryIcon" :size="5" font-size="base" />
        <span>{{ currentLibraryName }}</span>
      </button>

      <widgets-connection-indicator />
      <widgets-download-progress-indicator />

      <button type="button" aria-label="Cast" v-show="isCastAvailable && user" class="bb-tv-icon-btn" @click="castClick">
        <span class="material-symbols">{{ isCasting ? 'cast_connected' : 'cast' }}</span>
      </button>

      <nuxt-link v-if="user" class="bb-tv-icon-btn" to="/search" aria-label="Search">
        <span class="material-symbols">search</span>
      </nuxt-link>

      <button type="button" aria-label="Toggle navigation" class="bb-tv-icon-btn bb-tv-icon-btn-primary" @click="clickShowSideDrawer">
        <span class="material-symbols">{{ showSideDrawer ? 'menu_open' : 'menu' }}</span>
      </button>
    </div>
  </header>
</template>

<script>
import { AbsAudioPlayer } from '@/plugins/webos'

export default {
  data() {
    return {
      onCastAvailableUpdateListener: null
    }
  },
  computed: {
    isCastAvailable: {
      get() {
        return this.$store.state.isCastAvailable
      },
      set(val) {
        this.$store.commit('setCastAvailable', val)
      }
    },
    showSideDrawer() {
      return this.$store.state.showSideDrawer
    },
    currentLibrary() {
      return this.$store.getters['libraries/getCurrentLibrary']
    },
    currentLibraryName() {
      return this.currentLibrary?.name || ''
    },
    currentLibraryIcon() {
      return this.currentLibrary?.icon || 'database'
    },
    showBack() {
      if (!this.$route.name) return false
      return this.$route.name !== 'index' && !this.$route.name.startsWith('bookshelf')
    },
    user() {
      return this.$store.state.user.user
    },
    isCasting() {
      return this.$store.state.isCasting
    },
    pageTitle() {
      const routeName = this.$route.name || ''
      if (routeName === 'bookshelf') return 'Home'
      if (routeName === 'bookshelf-library') return this.$strings.ButtonLibrary || 'Library'
      if (routeName === 'bookshelf-series') return this.$strings.ButtonSeries || 'Series'
      if (routeName === 'bookshelf-collections') return this.$strings.ButtonCollections || 'Collections'
      if (routeName === 'bookshelf-authors') return this.$strings.ButtonAuthors || 'Authors'
      if (routeName === 'bookshelf-playlists') return this.$strings.ButtonPlaylists || 'Playlists'
      if (routeName === 'bookshelf-latest') return this.$strings.ButtonLatest || 'Latest'
      if (routeName === 'search') return this.$strings.ButtonSearch || 'Search'
      if (routeName === 'settings') return this.$strings.HeaderSettings || 'Settings'
      if (routeName === 'stats') return this.$strings.ButtonUserStats || 'Stats'
      if (routeName === 'account') return this.$strings.HeaderAccount || 'Account'
      if (routeName === 'logs') return this.$strings.ButtonLogs || 'Logs'
      if (routeName === 'connect') return this.$strings.ButtonConnectToServer || 'Connect'
      return 'Bigbookshelf'
    },
    sectionLabel() {
      if (!this.user) return 'Offline library'
      return this.currentLibraryName || 'Bigbookshelf'
    }
  },
  methods: {
    castClick() {
      if (this.$store.getters['getIsCurrentSessionLocal']) {
        this.$eventBus.$emit('cast-local-item')
        return
      }
      AbsAudioPlayer.requestSession()
    },
    clickShowSideDrawer() {
      this.$store.commit('setShowSideDrawer', !this.showSideDrawer)
    },
    clickShowLibraryModal() {
      this.$store.commit('libraries/setShowModal', true)
    },
    back() {
      window.history.back()
    },
    onCastAvailableUpdate(data) {
      this.isCastAvailable = data && data.value
    }
  },
  async mounted() {
    AbsAudioPlayer.getIsCastAvailable().then((data) => {
      this.isCastAvailable = data && data.value
    })
    this.onCastAvailableUpdateListener = await AbsAudioPlayer.addListener('onCastAvailableUpdate', this.onCastAvailableUpdate)
  },
  beforeDestroy() {
    this.onCastAvailableUpdateListener?.remove()
  }
}
</script>

<style scoped>
.bb-tv-topbar {
  height: 96px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px 0 36px;
  background: #202123;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: relative;
  z-index: 20;
}

.bb-tv-title-block {
  min-width: 0;
}

.bb-tv-eyebrow {
  color: rgba(255, 255, 255, 0.55);
  font-size: 14px;
  line-height: 18px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.bb-tv-title {
  color: #ffffff;
  font-size: 36px;
  line-height: 42px;
  font-weight: 700;
}

.bb-tv-topbar-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.bb-tv-topbar-actions > * + * {
  margin-left: 14px;
}

.bb-tv-library-pill,
.bb-tv-icon-btn,
.bb-tv-back-btn {
  height: 56px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 28px;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.07);
  border: 2px solid transparent;
  cursor: pointer;
  outline: none;
}

.bb-tv-library-pill {
  max-width: 300px;
  padding: 0 22px;
  font-size: 18px;
  font-weight: 600;
}

.bb-tv-library-pill > * + * {
  margin-left: 12px;
}

.bb-tv-library-pill span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bb-tv-icon-btn {
  width: 56px;
}

.bb-tv-icon-btn .material-symbols {
  font-size: 30px;
  line-height: 1;
}

.bb-tv-icon-btn-primary {
  color: #111315;
  background: #1ad691;
}

.bb-tv-back-btn {
  padding: 0 24px 0 18px;
  color: #111315;
  background: #1ad691;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.bb-tv-back-btn .material-symbols {
  font-size: 28px;
  margin-right: 8px;
}

.bb-tv-library-pill:focus,
.bb-tv-library-pill.webos-focused,
.bb-tv-icon-btn:focus,
.bb-tv-icon-btn.webos-focused,
.bb-tv-back-btn:focus,
.bb-tv-back-btn.webos-focused {
  border-color: #1ad691;
  box-shadow: 0 0 0 4px rgba(26, 214, 145, 0.24);
}
</style>
