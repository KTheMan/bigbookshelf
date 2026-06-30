<template>
  <nav
    id="side-drawer-panel"
    class="bb-tv-sidebar"
    :class="{ 'bb-tv-sidebar-expanded': show }"
    aria-label="Primary navigation"
    @focusin="expand"
    @mouseenter="expand"
  >
    <button type="button" class="bb-tv-sidebar-brand" aria-label="Toggle navigation" @click="toggle">
      <img src="Logo.png" alt="" />
      <span>Bigbookshelf</span>
    </button>

    <div class="bb-tv-sidebar-items">
      <template v-for="item in navItems">
        <button
          v-if="item.action"
          :key="item.text"
          type="button"
          class="bb-tv-sidebar-item"
          :title="item.text"
          @click="clickAction(item.action)"
        >
          <span class="material-symbols" :class="{ fill: !item.iconOutlined }">{{ item.icon }}</span>
          <span class="bb-tv-sidebar-label">{{ item.text }}</span>
        </button>
        <nuxt-link
          v-else
          :key="item.text"
          :to="item.to"
          class="bb-tv-sidebar-item"
          :class="{ 'bb-tv-sidebar-item-active': isActive(item) }"
          :title="item.text"
          @click.native="collapse"
        >
          <span v-if="item.iconPack === 'abs-icons'" class="abs-icons" :class="`icon-${item.icon}`" />
          <span v-else class="material-symbols" :class="{ fill: !item.iconOutlined }">{{ item.icon }}</span>
          <span class="bb-tv-sidebar-label">{{ item.text }}</span>
        </nuxt-link>
      </template>
    </div>

    <div class="bb-tv-sidebar-footer">
      <p v-if="serverConnectionConfig" class="bb-tv-sidebar-server">{{ serverConnectionConfig.address }}</p>
      <button v-if="user" type="button" class="bb-tv-sidebar-disconnect" @click="disconnect">
        <span class="material-symbols">cloud_off</span>
        <span class="bb-tv-sidebar-label">{{ $strings.ButtonDisconnect }}</span>
      </button>
      <p class="bb-tv-sidebar-version">{{ $config.version }}</p>
    </div>
  </nav>
</template>

<script>
export default {
  computed: {
    show: {
      get() {
        return this.$store.state.showSideDrawer
      },
      set(val) {
        this.$store.commit('setShowSideDrawer', val)
      }
    },
    user() {
      return this.$store.state.user.user
    },
    serverConnectionConfig() {
      return this.$store.state.user.serverConnectionConfig
    },
    userIsAdminOrUp() {
      return this.$store.getters['user/getIsAdminOrUp']
    },
    currentLibrary() {
      return this.$store.getters['libraries/getCurrentLibrary']
    },
    currentLibraryIcon() {
      return this.currentLibrary?.icon || 'database'
    },
    currentLibraryMediaType() {
      return this.$store.getters['libraries/getCurrentLibraryMediaType']
    },
    isPodcast() {
      return this.currentLibraryMediaType === 'podcast'
    },
    userHasPlaylists() {
      return this.$store.state.libraries.numUserPlaylists
    },
    navItems() {
      let items = []

      if (!this.serverConnectionConfig) {
        items.push({
          icon: 'cloud',
          text: this.$strings.ButtonConnectToServer,
          to: '/connect'
        })
      }

      items.push({
        iconPack: 'abs-icons',
        icon: 'home',
        text: this.$strings.ButtonHome,
        to: '/bookshelf',
        exact: true
      })

      if (this.isPodcast) {
        items.push({
          iconPack: 'abs-icons',
          icon: 'list',
          text: this.$strings.ButtonLatest,
          to: '/bookshelf/latest'
        })
        items.push({
          iconPack: 'abs-icons',
          icon: this.currentLibraryIcon,
          text: this.$strings.ButtonLibrary,
          to: '/bookshelf/library'
        })
        if (this.userIsAdminOrUp) {
          items.push({
            icon: 'podcasts',
            text: this.$strings.ButtonAdd,
            to: '/bookshelf/add-podcast'
          })
        }
      } else {
        items.push({
          iconPack: 'abs-icons',
          icon: this.currentLibraryIcon,
          text: this.$strings.ButtonLibrary,
          to: '/bookshelf/library'
        })
        items.push({
          iconPack: 'abs-icons',
          icon: 'columns',
          text: this.$strings.ButtonSeries,
          to: '/bookshelf/series'
        })
        items.push({
          icon: 'collections_bookmark',
          text: this.$strings.ButtonCollections,
          to: '/bookshelf/collections'
        })
        items.push({
          iconPack: 'abs-icons',
          icon: 'authors',
          text: this.$strings.ButtonAuthors,
          to: '/bookshelf/authors'
        })
      }

      if (this.userHasPlaylists) {
        items.push({
          icon: 'queue_music',
          text: this.$strings.ButtonPlaylists,
          to: '/bookshelf/playlists'
        })
      }

      items.push({
        icon: 'search',
        text: this.$strings.ButtonSearch || 'Search',
        to: '/search'
      })

      if (this.serverConnectionConfig) {
        items.push({
          icon: 'person',
          text: this.$strings.HeaderAccount,
          to: '/account'
        })
        items.push({
          icon: 'equalizer',
          text: this.$strings.ButtonUserStats,
          to: '/stats'
        })
      }

      items.push({
        icon: 'settings',
        text: this.$strings.HeaderSettings,
        to: '/settings'
      })
      items.push({
        icon: 'bug_report',
        iconOutlined: true,
        text: this.$strings.ButtonLogs,
        to: '/logs'
      })

      if (this.serverConnectionConfig) {
        items.push({
          icon: 'login',
          text: this.$strings.ButtonSwitchServerUser,
          action: 'logout'
        })
      }

      return items
    }
  },
  methods: {
    isActive(item) {
      if (item.exact) return this.$route.path === item.to
      return this.$route.path === item.to || this.$route.path.startsWith(item.to + '/')
    },
    expand() {
      if (!this.show) this.show = true
    },
    collapse() {
      this.show = false
    },
    toggle() {
      this.show = !this.show
    },
    async clickAction(action) {
      await this.$hapticsImpact()
      if (action === 'logout') {
        await this.logout()
        this.$router.push('/connect')
      }
      this.collapse()
    },
    async logout() {
      await this.$store.dispatch('user/logout')
    },
    async disconnect() {
      await this.$hapticsImpact()
      await this.logout()

      if (this.$route.name !== 'bookshelf') {
        this.$router.replace('/bookshelf')
      }

      if (this.$store.getters['getIsPlayerOpen']) {
        this.$eventBus.$emit('close-stream')
      }

      this.collapse()
    }
  }
}
</script>

<style scoped>
.bb-tv-sidebar {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 112px;
  background: #111315;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  z-index: 60;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.18s ease-out, box-shadow 0.18s ease-out;
}

.bb-tv-sidebar-expanded {
  width: 344px;
  box-shadow: 22px 0 70px rgba(0, 0, 0, 0.36);
}

.bb-tv-sidebar-brand {
  height: 96px;
  width: 100%;
  display: flex;
  align-items: center;
  padding: 0 28px;
  color: #ffffff;
  cursor: pointer;
  outline: none;
}

.bb-tv-sidebar-brand img {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  flex-shrink: 0;
}

.bb-tv-sidebar-brand span {
  margin-left: 18px;
  font-size: 22px;
  line-height: 28px;
  font-weight: 700;
  opacity: 0;
  white-space: nowrap;
  transition: opacity 0.12s ease-out;
}

.bb-tv-sidebar-expanded .bb-tv-sidebar-brand span {
  opacity: 1;
}

.bb-tv-sidebar-items {
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px 20px;
}

.bb-tv-sidebar-item,
.bb-tv-sidebar-disconnect {
  width: 100%;
  min-height: 68px;
  display: flex;
  align-items: center;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.68);
  text-decoration: none;
  cursor: pointer;
  outline: none;
  border: 2px solid transparent;
  padding: 0 20px;
  margin-bottom: 8px;
  background: transparent;
}

.bb-tv-sidebar-item .material-symbols,
.bb-tv-sidebar-item .abs-icons,
.bb-tv-sidebar-disconnect .material-symbols {
  width: 36px;
  min-width: 36px;
  text-align: center;
  font-size: 28px;
  line-height: 1;
}

.bb-tv-sidebar-label {
  margin-left: 20px;
  font-size: 20px;
  line-height: 26px;
  font-weight: 600;
  opacity: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: opacity 0.12s ease-out;
}

.bb-tv-sidebar-expanded .bb-tv-sidebar-label {
  opacity: 1;
}

.bb-tv-sidebar-item-active {
  color: #1ad691;
  background: rgba(26, 214, 145, 0.12);
}

.bb-tv-sidebar-item:focus,
.bb-tv-sidebar-item.webos-focused,
.bb-tv-sidebar-disconnect:focus,
.bb-tv-sidebar-disconnect.webos-focused,
.bb-tv-sidebar-brand:focus,
.bb-tv-sidebar-brand.webos-focused {
  color: #ffffff;
  border-color: #1ad691;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 4px rgba(26, 214, 145, 0.18);
}

.bb-tv-sidebar-item-active:focus,
.bb-tv-sidebar-item-active.webos-focused {
  color: #1ad691;
  background: rgba(26, 214, 145, 0.18);
}

.bb-tv-sidebar-footer {
  padding: 10px 14px 24px;
  color: rgba(255, 255, 255, 0.48);
  flex-shrink: 0;
}

.bb-tv-sidebar-server,
.bb-tv-sidebar-version {
  padding: 0 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bb-tv-sidebar-server {
  font-size: 12px;
  line-height: 16px;
  margin-bottom: 10px;
  opacity: 0;
}

.bb-tv-sidebar-version {
  font-size: 13px;
  line-height: 18px;
}

.bb-tv-sidebar-expanded .bb-tv-sidebar-server {
  opacity: 1;
}
</style>
