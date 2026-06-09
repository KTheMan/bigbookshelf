<template>
  <div class="webos-tv-bookshelf">
    <div v-if="title" class="webos-tv-section-title">{{ title }}</div>
    <div class="webos-tv-grid" ref="grid">
      <div
        v-for="(item, index) in items"
        :key="item.id"
        class="webos-tv-card"
        :class="{ 'webos-tv-card-active': activeIndex === index }"
        :data-index="index"
        data-focusable
        @click="$emit('select', item)"
        @focus="activeIndex = index"
      >
        <div class="webos-tv-card-cover">
          <covers-book-cover
            :library-item="item"
            :width="180"
            :book-cover-aspect-ratio="bookCoverAspectRatio"
            raw
          />
          <div v-if="item.progress" class="webos-tv-card-progress">
            <div class="webos-tv-card-progress-bar" :style="{ width: (item.progress * 100) + '%' }" />
          </div>
        </div>
        <div class="webos-tv-card-info">
          <p class="webos-tv-card-title">{{ item.media?.metadata?.title || item.title }}</p>
          <p class="webos-tv-card-author">{{ item.media?.metadata?.authorName || '' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    items: { type: Array, default: () => [] },
    title: { type: String, default: '' },
    bookCoverAspectRatio: { type: Number, default: 1.6 }
  },
  data() {
    return {
      activeIndex: -1
    }
  },
  mounted() {
    window.addEventListener('webos-media-key', this.handleMediaKey)
  },
  beforeDestroy() {
    window.removeEventListener('webos-media-key', this.handleMediaKey)
  },
  methods: {
    handleMediaKey(e) {
      if (e.detail.action === 'next') {
        this.activeIndex = Math.min(this.activeIndex + 1, this.items.length - 1)
        this.scrollToActive()
      } else if (e.detail.action === 'previous') {
        this.activeIndex = Math.max(this.activeIndex - 1, 0)
        this.scrollToActive()
      }
    },
    scrollToActive() {
      this.$nextTick(() => {
        const el = this.$refs.grid?.querySelector(`[data-index="${this.activeIndex}"]`)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      })
    }
  }
}
</script>

<style scoped>
.webos-tv-bookshelf {
  padding: 20px 60px;
}

.webos-tv-section-title {
  color: white;
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 24px;
}

.webos-tv-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 30px;
}

.webos-tv-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border-radius: 12px;
  padding: 12px;
  background: rgba(255,255,255,0.05);
}

.webos-tv-card:focus,
.webos-tv-card.webos-focused,
.webos-tv-card-active {
  outline: none;
  transform: scale(1.08);
  box-shadow: 0 0 0 3px #1ad691, 0 12px 40px rgba(0,0,0,0.4);
  background: rgba(255,255,255,0.1);
  z-index: 10;
  position: relative;
}

.webos-tv-card-cover {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
}

.webos-tv-card-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(0,0,0,0.5);
}

.webos-tv-card-progress-bar {
  height: 100%;
  background: #1ad691;
  transition: width 0.3s;
}

.webos-tv-card-title {
  color: white;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.webos-tv-card-author {
  color: rgba(255,255,255,0.6);
  font-size: 14px;
  margin-top: 4px;
}
</style>
