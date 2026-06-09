<template>
  <div class="webos-tv-player" v-if="playbackSession">
    <div v-if="showFullscreen" class="webos-tv-player-fullscreen">
      <div class="webos-tv-player-bg" :style="{ backgroundColor: coverRgb }" />
      <div class="webos-tv-player-gradient" />

      <div class="webos-tv-player-top">
        <div class="webos-tv-player-top-left">
          <span class="webos-tv-player-badge">{{ isDirectPlay ? 'Direct' : isLocalPlay ? 'Local' : 'Transcode' }}</span>
        </div>
        <div class="webos-tv-player-top-right">
          <button class="webos-tv-btn-icon" @click="$emit('showBookmarks')">
            <span class="material-symbols" :class="{ fill: bookmarks.length }">bookmark</span>
          </button>
          <button class="webos-tv-btn-icon" @click="$emit('selectPlaybackSpeed')">
            <span class="webos-tv-speed">{{ currentPlaybackRate }}x</span>
          </button>
          <button class="webos-tv-btn-icon" @click="$emit('showSleepTimer')">
            <span v-if="!sleepTimerRunning" class="material-symbols">bedtime</span>
            <span v-else class="webos-tv-timer-text">{{ sleepTimeRemainingPretty }}</span>
          </button>
          <button class="webos-tv-btn-icon" @click="$emit('showChapters')">
            <span class="material-symbols">format_list_bulleted</span>
          </button>
        </div>
      </div>

      <div class="webos-tv-player-cover">
        <covers-book-cover
          v-if="libraryItem || localLibraryItemCoverSrc"
          ref="cover"
          :library-item="libraryItem"
          :download-cover="localLibraryItemCoverSrc"
          :width="bookCoverWidth"
          :book-cover-aspect-ratio="bookCoverAspectRatio"
          raw
          @imageLoaded="coverImageLoaded"
        />
      </div>

      <div class="webos-tv-player-info">
        <p class="webos-tv-title">{{ title }}</p>
        <p class="webos-tv-author">{{ authorName }}</p>
      </div>

      <div class="webos-tv-player-controls">
        <div class="webos-tv-progress-container">
          <span class="webos-tv-time">{{ currentTimePretty }}</span>
          <div class="webos-tv-progress-bar" ref="track" @click="seekToPosition">
            <div class="webos-tv-progress-buffered" ref="bufferedTrack" />
            <div class="webos-tv-progress-played" ref="playedTrack" />
          </div>
          <span class="webos-tv-time">{{ timeRemainingPretty }}</span>
        </div>

        <div class="webos-tv-control-buttons">
          <button class="webos-tv-control-btn" data-focusable @click="jumpChapterStart">
            <span class="material-symbols">first_page</span>
          </button>
          <button class="webos-tv-control-btn" data-focusable @click="jumpBackwards">
            <span class="material-symbols">replay</span>
            <span class="webos-tv-jump-label">{{ jumpBackwardsLabel }}</span>
          </button>
          <button class="webos-tv-play-btn" data-focusable @click="playPauseClick">
            <span class="material-symbols fill">
              {{ seekLoading ? 'autorenew' : !isPlaying ? 'play_arrow' : 'pause' }}
            </span>
          </button>
          <button class="webos-tv-control-btn" data-focusable @click="jumpForward">
            <span class="material-symbols">forward_media</span>
            <span class="webos-tv-jump-label">{{ jumpForwardLabel }}</span>
          </button>
          <button class="webos-tv-control-btn" data-focusable @click="jumpNextChapter">
            <span class="material-symbols">last_page</span>
          </button>
        </div>
      </div>
    </div>

    <div v-else class="webos-tv-mini-player" @click="expandFullscreen">
      <covers-book-cover
        v-if="libraryItem"
        :library-item="libraryItem"
        :width="48"
        :book-cover-aspect-ratio="bookCoverAspectRatio"
        raw
      />
      <div class="webos-tv-mini-info">
        <p class="webos-tv-mini-title">{{ title }}</p>
        <p class="webos-tv-mini-time">{{ currentTimePretty }}</p>
      </div>
      <div class="webos-tv-mini-controls">
        <button class="webos-tv-mini-btn" @click.stop="playPauseClick">
          <span class="material-symbols">{{ isPlaying ? 'pause' : 'play_arrow' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    playbackSession: { type: Object, default: null },
    libraryItem: { type: Object, default: null },
    localLibraryItemCoverSrc: { type: String, default: null },
    isPlaying: { type: Boolean, default: false },
    currentTimePretty: { type: String, default: '0:00' },
    timeRemainingPretty: { type: String, default: '-0:00' },
    currentPlaybackRate: { type: Number, default: 1 },
    sleepTimerRunning: { type: Boolean, default: false },
    sleepTimeRemainingPretty: { type: String, default: '' },
    bookmarks: { type: Array, default: () => [] },
    seekLoading: { type: Boolean, default: false },
    jumpBackwardsLabel: { type: String, default: '10' },
    jumpForwardLabel: { type: String, default: '10' },
    title: { type: String, default: '' },
    authorName: { type: String, default: '' },
    bookCoverWidth: { type: Number, default: 300 },
    bookCoverAspectRatio: { type: Number, default: 1.6 },
    coverRgb: { type: String, default: '' },
    isDirectPlay: { type: Boolean, default: true },
    isLocalPlay: { type: Boolean, default: false },
    playedTrack: { type: Number, default: 0 },
    bufferedTrack: { type: Number, default: 0 }
  },
  data() {
    return {
      showFullscreen: true
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
      const { action } = e.detail
      if (action === 'playPause') this.playPauseClick()
      else if (action === 'next') this.jumpForward()
      else if (action === 'previous') this.jumpBackwards()
    },
    playPauseClick() {
      this.$emit('playPause')
    },
    jumpBackwards() {
      this.$emit('jumpBackwards')
    },
    jumpForward() {
      this.$emit('jumpForward')
    },
    jumpChapterStart() {
      this.$emit('jumpChapterStart')
    },
    jumpNextChapter() {
      this.$emit('jumpNextChapter')
    },
    expandFullscreen() {
      this.showFullscreen = true
    },
    collapseFullscreen() {
      this.showFullscreen = false
    },
    coverImageLoaded() {},
    seekToPosition(e) {
      if (!this.$refs.track) return
      const rect = this.$refs.track.getBoundingClientRect()
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      this.$emit('seek', pct)
    }
  }
}
</script>

<style scoped>
.webos-tv-player-fullscreen {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 40px 80px;
}

.webos-tv-player-bg {
  position: absolute;
  inset: 0;
}

.webos-tv-player-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.7) 100%);
}

.webos-tv-player-top {
  position: absolute;
  top: 30px;
  left: 60px;
  right: 60px;
  display: flex;
  justify-content: space-between;
  z-index: 10;
}

.webos-tv-player-top-right {
  display: flex;
  gap: 20px;
}

.webos-tv-btn-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,0.15);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 24px;
}

.webos-tv-btn-icon:focus, .webos-tv-btn-icon.webos-focused {
  outline: none;
  box-shadow: 0 0 0 3px #1ad691;
  transform: scale(1.1);
}

.webos-tv-badge {
  background: rgba(255,255,255,0.2);
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  letter-spacing: 1px;
}

.webos-tv-player-cover {
  position: relative;
  z-index: 5;
  width: 300px;
  height: 300px;
  margin-bottom: 30px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
}

.webos-tv-player-info {
  position: relative;
  z-index: 5;
  text-align: center;
  margin-bottom: 40px;
}

.webos-tv-title {
  color: white;
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
  text-shadow: 0 2px 8px rgba(0,0,0,0.5);
}

.webos-tv-author {
  color: rgba(255,255,255,0.7);
  font-size: 20px;
}

.webos-tv-player-controls {
  position: relative;
  z-index: 5;
  width: 100%;
  max-width: 900px;
}

.webos-tv-progress-container {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}

.webos-tv-progress-bar {
  flex: 1;
  height: 8px;
  background: rgba(255,255,255,0.2);
  border-radius: 4px;
  position: relative;
  cursor: pointer;
  transition: height 0.15s;
}

.webos-tv-progress-bar:hover {
  height: 12px;
}

.webos-tv-progress-buffered, .webos-tv-progress-played {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  border-radius: 4px;
}

.webos-tv-progress-buffered {
  background: rgba(255,255,255,0.3);
  width: 60%;
}

.webos-tv-progress-played {
  background: #1ad691;
}

.webos-tv-time {
  color: rgba(255,255,255,0.7);
  font-family: 'Ubuntu Mono', monospace;
  font-size: 16px;
  min-width: 60px;
}

.webos-tv-control-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
}

.webos-tv-control-btn {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.webos-tv-control-btn:focus, .webos-tv-control-btn.webos-focused {
  outline: none;
  box-shadow: 0 0 0 3px #1ad691;
  background: rgba(255,255,255,0.2);
}

.webos-tv-control-btn .material-symbols {
  font-size: 36px;
}

.webos-tv-jump-label {
  font-size: 11px;
  color: rgba(255,255,255,0.5);
  margin-top: 2px;
}

.webos-tv-play-btn {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  border: none;
  background: #1ad691;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.webos-tv-play-btn:focus, .webos-tv-play-btn.webos-focused {
  outline: none;
  box-shadow: 0 0 0 4px rgba(26, 214, 145, 0.4);
  transform: scale(1.05);
}

.webos-tv-play-btn .material-symbols {
  font-size: 48px;
}

.webos-tv-speed {
  color: white;
  font-size: 18px;
  font-family: 'Ubuntu Mono', monospace;
}

.webos-tv-timer-text {
  color: #4CAF50;
  font-size: 18px;
  font-family: 'Ubuntu Mono', monospace;
}

/* Mini player */
.webos-tv-mini-player {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: rgba(38, 38, 38, 0.95);
  display: flex;
  align-items: center;
  padding: 0 30px;
  gap: 20px;
  z-index: 90;
  cursor: pointer;
}

.webos-tv-mini-info {
  flex: 1;
}

.webos-tv-mini-title {
  color: white;
  font-size: 18px;
  font-weight: 500;
}

.webos-tv-mini-time {
  color: rgba(255,255,255,0.6);
  font-size: 14px;
  font-family: 'Ubuntu Mono', monospace;
}

.webos-tv-mini-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: #1ad691;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.webos-tv-mini-btn:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(26, 214, 145, 0.4);
}
</style>
