<template>
  <div class="bb-tv-toolbar-shell">
    <div id="bookshelf-toolbar" class="bb-tv-toolbar">
      <button type="button" class="bb-tv-toolbar-chip" @click="showSortFilterMenu = true">
        <span class="material-symbols">swap_vert</span>
        <span>Sort: {{ sortLabel }}</span>
        <span class="material-symbols">expand_more</span>
      </button>

      <button type="button" class="bb-tv-toolbar-chip" @click="showSortFilterMenu = true">
        <span class="material-symbols">filter_alt</span>
        <span>Filter: {{ filterLabel }}</span>
        <span v-show="hasFilters" class="bb-tv-toolbar-dot" />
      </button>

      <button v-if="page == 'library' || page == 'home' || seriesBookPage" type="button" class="bb-tv-toolbar-chip" @click="changeView">
        <span class="material-symbols">{{ !bookshelfListView ? 'grid_view' : 'view_list' }}</span>
        <span>{{ !bookshelfListView ? 'Grid View' : 'List View' }}</span>
      </button>

      <button v-if="seriesBookPage" type="button" class="bb-tv-toolbar-icon" aria-label="Download series" @click="downloadSeries">
        <span class="material-symbols">download</span>
      </button>

      <button v-if="(page == 'library' && isBookLibrary) || seriesBookPage" type="button" class="bb-tv-toolbar-icon" aria-label="More options" @click="showMoreMenuDialog = true">
        <span class="material-symbols">more_vert</span>
      </button>

      <div class="bb-tv-toolbar-spacer" />
      <p class="bb-tv-toolbar-count">{{ toolbarCountLabel }}</p>
    </div>

    <modals-order-modal v-model="showSortModal" :order-by.sync="settings.mobileOrderBy" :descending.sync="settings.mobileOrderDesc" @change="updateOrder" />
    <modals-filter-modal v-model="showFilterModal" :filter-by.sync="settings.mobileFilterBy" @change="updateFilter" />
    <modals-dialog v-model="showSortFilterMenu" :items="sortFilterMenuItems" @action="clickSortFilterAction" />
    <modals-dialog v-model="showMoreMenuDialog" :items="menuItems" @action="clickMenuAction" />
  </div>
</template>

<script>
export default {
  data() {
    return {
      showSortModal: false,
      showFilterModal: false,
      showSortFilterMenu: false,
      settings: {},
      totalEntities: 0,
      showMoreMenuDialog: false
    }
  },
  computed: {
    bookshelfListView: {
      get() {
        return this.$store.state.globals.bookshelfListView
      },
      set(val) {
        this.$localStore.setBookshelfListView(val)
        this.$store.commit('globals/setBookshelfListView', val)
      }
    },
    currentLibraryMediaType() {
      return this.$store.getters['libraries/getCurrentLibraryMediaType']
    },
    isBookLibrary() {
      return this.currentLibraryMediaType === 'book'
    },
    hasFilters() {
      const filter = this.$store.getters['user/getUserSetting']('mobileFilterBy')
      return !!filter && filter !== 'all'
    },
    page() {
      var routeName = this.$route.name || ''
      return routeName === 'bookshelf' ? 'home' : routeName.split('-')[1]
    },
    seriesBookPage() {
      return this.$route.name == 'bookshelf-series-id'
    },
    routeQuery() {
      return this.$route.query || {}
    },
    entityTitle() {
      if (this.page === 'home') {
        return 'items'
      } else if (this.page === 'library') {
        return this.isPodcast ? this.$strings.LabelPodcasts : this.$strings.LabelBooks
      } else if (this.page === 'playlists') {
        return this.$strings.ButtonPlaylists
      } else if (this.page === 'series') {
        return this.$strings.LabelSeries
      } else if (this.page === 'collections') {
        return this.$strings.ButtonCollections
      } else if (this.page === 'authors') {
        return this.$strings.LabelAuthors
      }
      return ''
    },
    sortLabel() {
      if (!this.settings.mobileOrderBy) return 'Recently Added'
      if (this.settings.mobileOrderBy === 'addedAt') return 'Recently Added'
      if (this.settings.mobileOrderBy === 'media.metadata.title') return 'Title'
      if (this.settings.mobileOrderBy === 'media.metadata.authorNameLF') return 'Author'
      if (this.settings.mobileOrderBy === 'media.duration') return 'Duration'
      return 'Custom'
    },
    filterLabel() {
      if (!this.settings.mobileFilterBy || this.settings.mobileFilterBy === 'all') return 'All'
      return String(this.settings.mobileFilterBy).replace(/_/g, ' ')
    },
    toolbarCountLabel() {
      if (this.selectedSeriesName) return `${this.selectedSeriesName} (${this.$formatNumber(this.totalEntities)})`
      if (this.totalEntities) return `${this.$formatNumber(this.totalEntities)} ${this.entityTitle || 'items'}`
      return this.entityTitle || 'Bookshelf'
    },
    selectedSeriesName() {
      if (this.page === 'series' && this.$route.params.id && this.$store.state.globals.series) {
        return this.$store.state.globals.series.name
      }
      return null
    },
    isPodcast() {
      return this.$store.getters['libraries/getCurrentLibraryMediaType'] === 'podcast'
    },
    sortFilterMenuItems() {
      const items = [
        { text: this.$strings.LabelSortBy || 'Sort by…', value: 'show_sort', icon: 'sort' },
        { text: this.$strings.LabelFilterBy || 'Filter by…', value: 'show_filter', icon: 'filter_alt' }
      ]
      if (this.settings.mobileOrderDesc !== undefined) {
        items.push({
          text: this.settings.mobileOrderDesc ? (this.$strings.LabelDescending || 'Descending') : (this.$strings.LabelAscending || 'Ascending'),
          value: 'toggle_dir',
          icon: this.settings.mobileOrderDesc ? 'south' : 'north'
        })
      }
      return items
    },
    menuItems() {
      if (!this.isBookLibrary) return []

      if (this.seriesBookPage) {
        return [
          {
            text: this.$strings.LabelCollapseSeries,
            value: 'collapse_subseries',
            icon: this.settings.collapseBookSeries ? 'check_box' : 'check_box_outline_blank'
          }
        ]
      } else {
        return [
          {
            text: this.$strings.LabelCollapseSeries,
            value: 'collapse_series',
            icon: this.settings.collapseSeries ? 'check_box' : 'check_box_outline_blank'
          }
        ]
      }
    }
  },
  methods: {
    clickSortFilterAction(action) {
      this.showSortFilterMenu = false
      if (action === 'show_sort') {
        this.showSortModal = true
      } else if (action === 'show_filter') {
        this.showFilterModal = true
      } else if (action === 'toggle_dir') {
        this.settings.mobileOrderDesc = !this.settings.mobileOrderDesc
        this.saveSettings()
      }
    },
    clickMenuAction(action) {
      this.showMoreMenuDialog = false
      if (action === 'collapse_series') {
        this.settings.collapseSeries = !this.settings.collapseSeries
        this.saveSettings()
      } else if (action === 'collapse_subseries') {
        this.settings.collapseBookSeries = !this.settings.collapseBookSeries
        this.saveSettings()
      }
    },
    updateOrder() {
      this.saveSettings()
    },
    updateFilter() {
      this.saveSettings()
    },
    saveSettings() {
      this.$store.dispatch('user/updateUserSettings', this.settings)
    },
    async init() {
      this.bookshelfListView = await this.$localStore.getBookshelfListView()
      this.settings = { ...this.$store.state.user.settings }
      this.bookshelfReady = true
    },
    settingsUpdated(settings) {
      for (const key in settings) {
        this.settings[key] = settings[key]
      }
    },
    setTotalEntities(total) {
      this.totalEntities = total
    },
    async changeView() {
      this.bookshelfListView = !this.bookshelfListView
      await this.$hapticsImpact()
    },
    downloadSeries() {
      console.log('Download Series click')
      this.$eventBus.$emit('download-series-click')
    }
  },
  mounted() {
    this.init()
    this.$eventBus.$on('bookshelf-total-entities', this.setTotalEntities)
    this.$eventBus.$on('user-settings', this.settingsUpdated)
  },
  beforeDestroy() {
    this.$eventBus.$off('bookshelf-total-entities', this.setTotalEntities)
    this.$eventBus.$off('user-settings', this.settingsUpdated)
  }
}
</script>

<style>
.bb-tv-toolbar-shell {
  width: 100%;
  height: 56px;
  background: #383838;
  position: relative;
  z-index: 20;
}

.bb-tv-toolbar {
  width: 100%;
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 32px;
}

.bb-tv-toolbar-chip,
.bb-tv-toolbar-icon {
  height: 35px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 2px solid transparent;
  background: rgba(255, 255, 255, 0.07);
  color: rgba(255, 255, 255, 0.86);
  cursor: pointer;
  outline: none;
  font-size: 13px;
  line-height: 18px;
  font-weight: 600;
  position: relative;
}

.bb-tv-toolbar-chip {
  padding: 0 12px;
  margin-right: 12px;
}

.bb-tv-toolbar-chip .material-symbols,
.bb-tv-toolbar-icon .material-symbols {
  font-size: 18px;
  line-height: 1;
}

.bb-tv-toolbar-chip .material-symbols:first-child {
  margin-right: 8px;
}

.bb-tv-toolbar-chip .material-symbols:last-child {
  margin-left: 8px;
}

.bb-tv-toolbar-icon {
  width: 35px;
  margin-right: 12px;
}

.bb-tv-toolbar-chip:focus,
.bb-tv-toolbar-chip.webos-focused,
.bb-tv-toolbar-icon:focus,
.bb-tv-toolbar-icon.webos-focused {
  border-color: #1ad691;
  box-shadow: 0 0 0 4px rgba(26, 214, 145, 0.18);
}

.bb-tv-toolbar-dot {
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background: #1ad691;
  margin-left: 8px;
  flex-shrink: 0;
}

.bb-tv-toolbar-spacer {
  flex: 1;
}

.bb-tv-toolbar-count {
  color: rgba(255, 255, 255, 0.62);
  font-size: 12px;
  line-height: 16px;
  font-weight: 600;
  white-space: nowrap;
}
</style>
