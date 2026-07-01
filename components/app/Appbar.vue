<template>
  <header id="appbar" class="bb-tv-topbar">
    <div class="bb-tv-brand">
      <button v-if="showBack" type="button" aria-label="Back" class="bb-tv-back-btn" @click="back">
        <span class="material-symbols">arrow_back</span>
        <span>Back</span>
      </button>
      <div v-else class="bb-tv-brand-mark">
        <img src="Logo.png" alt="" />
        <span>Bigbookshelf</span>
      </div>
    </div>

    <div class="bb-tv-library-switcher" aria-label="Library media type">
      <button
        type="button"
        class="bb-tv-library-chip"
        :class="{ 'bb-tv-library-chip-active': !isPodcastLibrary }"
        @click="clickShowLibraryModal"
      >
        <span class="material-symbols fill">menu_book</span>
        <span>Books</span>
      </button>
      <div class="bb-tv-library-divider" />
      <button
        type="button"
        class="bb-tv-library-chip"
        :class="{ 'bb-tv-library-chip-active': isPodcastLibrary }"
        @click="clickShowLibraryModal"
      >
        <span class="material-symbols fill">podcasts</span>
        <span>Podcasts</span>
      </button>
    </div>

    <div class="bb-tv-topbar-actions">
      <button v-if="user && currentLibrary" type="button" aria-label="Change library" class="bb-tv-icon-btn" @click="clickShowLibraryModal">
        <ui-library-icon :icon="currentLibraryIcon" :size="5" font-size="base" />
      </button>

      <nuxt-link v-if="user" class="bb-tv-icon-btn" to="/downloads" aria-label="Downloads">
        <span class="material-symbols">download</span>
      </nuxt-link>

      <nuxt-link v-if="user" class="bb-tv-icon-btn" to="/search" aria-label="Search">
        <span class="material-symbols">search</span>
      </nuxt-link>

      <nuxt-link v-else class="bb-tv-icon-btn" to="/connect" aria-label="Connect">
        <span class="material-symbols">cloud</span>
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
    isPodcastLibrary() {
      return this.$store.getters['libraries/getCurrentLibraryMediaType'] === 'podcast'
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
  height: 64px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  background: #383838;
  position: relative;
  z-index: 20;
}

.bb-tv-brand {
  width: 284px;
  min-width: 0;
  display: flex;
  align-items: center;
}

.bb-tv-brand-mark {
  display: flex;
  align-items: center;
  height: 36px;
}

.bb-tv-brand-mark img {
  width: 36px;
  height: 36px;
  border-radius: 18px;
  flex-shrink: 0;
}

.bb-tv-brand-mark span {
  margin-left: 10px;
  color: #ffffff;
  font-size: 18px;
  line-height: 25px;
  font-weight: 700;
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

.bb-tv-library-switcher {
  position: absolute;
  left: 50%;
  top: 11px;
  transform: translateX(-50%);
  height: 42px;
  display: flex;
  align-items: center;
}

.bb-tv-library-chip {
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 18px;
  border-radius: 8px;
  border: 2px solid transparent;
  color: rgba(255, 255, 255, 0.72);
  font-size: 15px;
  line-height: 20px;
  font-weight: 600;
  cursor: pointer;
  outline: none;
}

.bb-tv-library-chip .material-symbols {
  margin-right: 8px;
  font-size: 20px;
  line-height: 1;
}

.bb-tv-library-chip-active {
  background: #232323;
  color: #1ad691;
}

.bb-tv-library-divider {
  width: 1px;
  height: 32px;
  margin: 0 24px;
  background: rgba(255, 255, 255, 0.18);
}

.bb-tv-topbar-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.bb-tv-topbar-actions > * + * {
  margin-left: 16px;
}

.bb-tv-library-pill,
.bb-tv-icon-btn,
.bb-tv-back-btn {
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
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
  width: 50px;
}

.bb-tv-icon-btn .material-symbols {
  font-size: 24px;
  line-height: 1;
}

.bb-tv-icon-btn-primary {
  color: #111315;
  background: #1ad691;
}

.bb-tv-back-btn {
  padding: 0 18px 0 14px;
  color: #111315;
  background: #1ad691;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.bb-tv-back-btn .material-symbols {
  font-size: 24px;
  margin-right: 8px;
}

.bb-tv-library-chip:focus,
.bb-tv-library-chip.webos-focused,
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
