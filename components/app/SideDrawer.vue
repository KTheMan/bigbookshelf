<template>
  <div class="bb-tv-sidebar-root" :class="{ 'bb-tv-sidebar-root-open': show }">
    <button v-show="show" type="button" class="bb-tv-sidebar-scrim" aria-label="Close navigation" @click="collapse" />
    <nav
      id="side-drawer-panel"
      class="bb-tv-sidebar"
      :class="{ 'bb-tv-sidebar-expanded': show }"
      :aria-hidden="!show"
      aria-label="Primary navigation"
    >
      <div class="bb-tv-sidebar-header">
        <p class="bb-tv-sidebar-welcome">Welcome, {{ displayName }}</p>
        <p class="bb-tv-sidebar-email">{{ displayEmail }}</p>
      </div>

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
        <p class="bb-tv-sidebar-version">v{{ $config.version }}{{ serverVersion ? ` · Server v${serverVersion}` : '' }}</p>
      </div>
    </nav>
  </div>
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
    serverVersion() {
      return this.$store.state.serverSettings?.version || this.serverConnectionConfig?.version || ''
    },
    displayName() {
      return this.user?.username || this.user?.name || this.serverConnectionConfig?.username || 'Guest'
    },
    displayEmail() {
      return this.user?.email || this.serverConnectionConfig?.address || 'Not connected'
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
          icon: 'bar_chart',
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
          icon: 'swap_horiz',
          text: this.$strings.ButtonSwitchServerUser,
          action: 'logout'
        })
        items.push({
          icon: 'logout',
          text: this.$strings.ButtonDisconnect || 'Sign Out',
          action: 'disconnect'
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
    collapse() {
      this.show = false
    },
    async clickAction(action) {
      await this.$hapticsImpact()
      if (action === 'logout') {
        await this.logout()
        this.$router.push('/connect')
      } else if (action === 'disconnect') {
        await this.disconnect()
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
.bb-tv-sidebar-root {
  pointer-events: none;
}

.bb-tv-sidebar-root-open {
  pointer-events: auto;
}

.bb-tv-sidebar-scrim {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  z-index: 55;
  cursor: pointer;
}

.bb-tv-sidebar {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 384px;
  background: #383838;
  z-index: 60;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform: translateX(100%);
  transition: transform 0.18s ease-out, box-shadow 0.18s ease-out;
}

.bb-tv-sidebar-expanded {
  transform: translateX(0);
  box-shadow: -22px 0 70px rgba(0, 0, 0, 0.36);
}

.bb-tv-sidebar-header {
  height: 100px;
  width: 100%;
  padding: 25px 32px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
  flex-shrink: 0;
}

.bb-tv-sidebar-welcome {
  color: #ffffff;
  font-size: 18px;
  line-height: 23px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bb-tv-sidebar-email {
  margin-top: 6px;
  color: rgba(255, 255, 255, 0.58);
  font-size: 12px;
  line-height: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bb-tv-sidebar-brand {
  height: 64px;
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
  padding: 0;
}

.bb-tv-sidebar-item,
.bb-tv-sidebar-disconnect {
  width: 100%;
  height: 52px;
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.68);
  text-decoration: none;
  cursor: pointer;
  outline: none;
  border: 2px solid transparent;
  padding: 0 32px;
  margin: 0;
  background: transparent;
}

.bb-tv-sidebar-item .material-symbols,
.bb-tv-sidebar-item .abs-icons,
.bb-tv-sidebar-disconnect .material-symbols {
  width: 36px;
  min-width: 36px;
  text-align: left;
  font-size: 24px;
  line-height: 1;
}

.bb-tv-sidebar-label {
  margin-left: 4px;
  font-size: 16px;
  line-height: 19px;
  font-weight: 600;
  opacity: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  height: 100px;
  padding: 16px 32px 0;
  color: rgba(255, 255, 255, 0.48);
  flex-shrink: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
}

.bb-tv-sidebar-server,
.bb-tv-sidebar-version {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bb-tv-sidebar-server {
  font-size: 12px;
  line-height: 15px;
  margin-bottom: 4px;
}

.bb-tv-sidebar-version {
  font-size: 12px;
  line-height: 14px;
}
</style>
