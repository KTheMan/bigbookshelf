<template>
  <div class="w-full h-full">
    <home-bookshelf-toolbar v-show="!hideToolbar" />
    <div id="bookshelf-wrapper" class="main-content overflow-y-auto overflow-x-hidden relative" :class="hideToolbar ? 'no-toolbar' : ''">
      <nuxt-child />
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {}
  },
  computed: {
    hideToolbar() {
      return this.isLatest || this.isPodcastSearch
    },
    isHome() {
      return this.$route.name === 'bookshelf'
    },
    isLatest() {
      return this.$route.name === 'bookshelf-latest'
    },
    isPodcastSearch() {
      return this.$route.name === 'bookshelf-add-podcast'
    }
  }
}
</script>

<style>
.main-content {
  height: calc(100% - 44px);
  max-height: calc(100% - 44px);
  min-height: calc(100% - 44px);
  max-width: 100vw;
}
.main-content.no-toolbar {
  height: 100%;
  max-height: 100%;
  min-height: 100%;
}

html[data-platform='webos'] .main-content {
  height: calc(100% - 56px);
  max-height: calc(100% - 56px);
  min-height: calc(100% - 56px);
}
html[data-platform='tizen'] .main-content {
  height: calc(100% - 56px);
  max-height: calc(100% - 56px);
  min-height: calc(100% - 56px);
}
html[data-platform='webos'] .main-content.no-toolbar {
  height: 100%;
  max-height: 100%;
  min-height: 100%;
}
html[data-platform='tizen'] .main-content.no-toolbar {
  height: 100%;
  max-height: 100%;
  min-height: 100%;
}
</style>
