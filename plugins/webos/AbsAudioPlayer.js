import { registerPlugin, WebPlugin } from '@capacitor/core'
import { AbsLogger } from './AbsLogger'
function nanoid(size = 21) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let id = ''
  const bytes = crypto.getRandomValues(new Uint8Array(size))
  for (let i = 0; i < size; i++) id += chars[bytes[i] % chars.length]
  return id
}
const { PlayerState } = require('../constants')

var $axios = null
var vuexStore = null

class AbsAudioPlayerWeb extends WebPlugin {
  constructor() {
    super()

    this.player = null
    this.playWhenReady = false
    this.playableMimeTypes = {}
    this.playbackSession = null
    this.playbackRate = 1
    this.audioTracks = []
    this.startTime = 0
    this.trackStartTime = 0
    this.useChapterTrack = false

    // Sleep timer state (webOS/Tizen have no native player, so it's implemented here)
    this._sleepTimer = null
    this._sleepTimerRemaining = 0 // seconds
    this._sleepTimerEndPos = null // absolute book position (seconds) for chapter-end timers
    this._sleepTimerIsChapter = false
  }

  get currentTrackIndex() {
    return Math.max(
      0,
      this.audioTracks.findIndex((t) => Math.floor(t.startOffset) <= this.startTime && Math.floor(t.startOffset + t.duration) > this.startTime)
    )
  }
  get currentTrack() {
    return this.audioTracks[this.currentTrackIndex]
  }
  get playerCurrentTime() {
    return this.player ? this.player.currentTime : 0
  }
  get currentTrackStartOffset() {
    return this.currentTrack ? this.currentTrack.startOffset : 0
  }
  get overallCurrentTime() {
    return this.currentTrackStartOffset + this.playerCurrentTime
  }
  get totalDuration() {
    var total = 0
    this.audioTracks.forEach((at) => (total += at.duration))
    return total
  }
  get playerPlaying() {
    return this.player && !this.player.paused
  }

  getDeviceId() {
    let deviceId = localStorage.getItem('absDeviceId')
    if (!deviceId) {
      deviceId = nanoid()
      localStorage.setItem('absDeviceId', deviceId)
    }
    return deviceId
  }

  async prepareLibraryItem({ libraryItemId, episodeId, playWhenReady, startTime, playbackRate }) {
    console.log('[AbsAudioPlayer] Prepare library item', libraryItemId)

    if (!isNaN(playbackRate) && playbackRate) this.playbackRate = playbackRate

    if (libraryItemId.startsWith('local_')) {
    } else {
      const route = !episodeId ? `/api/items/${libraryItemId}/play` : `/api/items/${libraryItemId}/play/${episodeId}`
      const deviceInfo = {
        deviceId: this.getDeviceId()
      }
      const reqBody = {
        deviceInfo,
        mediaPlayer: 'html5-' + (document.documentElement.dataset.platform || 'webos'),
        forceDirectPlay: true
      }
      const playbackSession = await $axios.$post(route, reqBody)
      if (playbackSession) {
        if (startTime !== undefined && startTime !== null) playbackSession.currentTime = startTime
        this.setAudioPlayer(playbackSession, playWhenReady)
      }
    }
    return false
  }

  async playPause() {
    if (!this.player) return
    if (this.player.ended) {
      this.startTime = 0
      this.playWhenReady = true
      this.loadCurrentTrack()
      return
    }

    AbsLogger.info({ tag: 'AbsAudioPlayer', message: 'playPause' })

    if (this.player.paused) this.player.play()
    else this.player.pause()
    return {
      playing: !this.player.paused
    }
  }

  playPlayer() {
    if (this.player) this.player.play()
  }

  pausePlayer() {
    if (this.player) this.player.pause()
  }

  async closePlayback() {
    this._clearSleepInterval()
    this._sleepTimerRemaining = 0
    this._sleepTimerEndPos = null
    this._sleepTimerIsChapter = false
    this.playbackSession = null
    this.audioTracks = []
    this.playWhenReady = false
    if (this.player) {
      this.player.remove()
      this.player = null
    }
    this.notifyListeners('onClosePlayback')
  }

  // ── Sleep timer ────────────────────────────────────────────────────────────
  // time is milliseconds. When isChapterTime is true, `time` is the absolute
  // position in the book (ms) at which to stop; otherwise it's a countdown
  // duration from now. The UI listens for onSleepTimerSet ({ value } in seconds)
  // and onSleepTimerEnded ({ value } = stop position in seconds).

  async setSleepTimer({ time, isChapterTime }) {
    const ms = Number(time)
    if (isNaN(ms) || ms <= 0) return { success: false }
    this._clearSleepInterval()
    this._sleepTimerIsChapter = !!isChapterTime
    if (isChapterTime) {
      this._sleepTimerEndPos = ms / 1000
      this._sleepTimerRemaining = Math.max(0, Math.round(this._sleepTimerEndPos - this.overallCurrentTime))
    } else {
      this._sleepTimerEndPos = null
      this._sleepTimerRemaining = Math.round(ms / 1000)
    }
    this._startSleepInterval()
    this.notifyListeners('onSleepTimerSet', { value: this._sleepTimerRemaining, isAuto: false })
    return { success: true }
  }

  async cancelSleepTimer() {
    this._clearSleepInterval()
    this._sleepTimerRemaining = 0
    this._sleepTimerEndPos = null
    this._sleepTimerIsChapter = false
    this.notifyListeners('onSleepTimerSet', { value: 0, isAuto: false })
    return { success: true }
  }

  async increaseSleepTime({ time }) {
    const ms = Number(time)
    if (isNaN(ms)) return { success: false }
    // Bumping the time converts a chapter-end timer into a plain countdown
    this._sleepTimerIsChapter = false
    this._sleepTimerEndPos = null
    this._sleepTimerRemaining = Math.max(0, this._sleepTimerRemaining) + Math.round(ms / 1000)
    if (!this._sleepTimer) this._startSleepInterval()
    this.notifyListeners('onSleepTimerSet', { value: this._sleepTimerRemaining, isAuto: false })
    return { success: true }
  }

  async decreaseSleepTime({ time }) {
    const ms = Number(time)
    if (isNaN(ms)) return { success: false }
    this._sleepTimerIsChapter = false
    this._sleepTimerEndPos = null
    this._sleepTimerRemaining = Math.max(0, this._sleepTimerRemaining - Math.round(ms / 1000))
    this.notifyListeners('onSleepTimerSet', { value: this._sleepTimerRemaining, isAuto: false })
    if (this._sleepTimerRemaining <= 0) this._sleepTimerExpired()
    return { success: true }
  }

  _startSleepInterval() {
    this._clearSleepInterval()
    this._sleepTimer = setInterval(() => {
      if (this._sleepTimerIsChapter && this._sleepTimerEndPos != null) {
        // Recompute from the live playback position so seeks / playback rate are honored
        this._sleepTimerRemaining = Math.max(0, Math.round(this._sleepTimerEndPos - this.overallCurrentTime))
      } else if (this.playerPlaying) {
        // Only count down while actually playing
        this._sleepTimerRemaining -= 1
      }
      this.notifyListeners('onSleepTimerSet', { value: Math.max(0, this._sleepTimerRemaining), isAuto: false })
      if (this._sleepTimerRemaining <= 0) this._sleepTimerExpired()
    }, 1000)
  }

  _sleepTimerExpired() {
    this._clearSleepInterval()
    const stopPosition = this.overallCurrentTime
    this.pausePlayer()
    this._sleepTimerRemaining = 0
    this._sleepTimerEndPos = null
    this._sleepTimerIsChapter = false
    this.notifyListeners('onSleepTimerSet', { value: 0, isAuto: false })
    this.notifyListeners('onSleepTimerEnded', { value: stopPosition })
  }

  _clearSleepInterval() {
    if (this._sleepTimer) {
      clearInterval(this._sleepTimer)
      this._sleepTimer = null
    }
  }

  seekToTime(newTime) {
    const targetTrackIndex = Math.max(
      0,
      this.audioTracks.findIndex((t) => Math.floor(t.startOffset) <= newTime && Math.floor(t.startOffset + t.duration) > newTime)
    )
    this.startTime = newTime
    if (this.player && targetTrackIndex === this.currentTrackIndex) {
      const trackTime = Math.max(0, newTime - (this.currentTrack.startOffset || 0))
      this.player.currentTime = trackTime
      this.sendPlaybackMetadata(PlayerState.READY)
    } else {
      this.playWhenReady = this.playerPlaying
      this.loadCurrentTrack()
    }
  }

  seek({ value }) {
    this.seekToTime(value)
  }

  seekForward({ value }) {
    this.seekToTime(Math.min(this.overallCurrentTime + value, this.totalDuration))
  }

  seekBackward({ value }) {
    this.seekToTime(Math.max(0, this.overallCurrentTime - value))
  }

  setPlaybackSpeed({ value }) {
    this.playbackRate = value
    if (this.player) this.player.playbackRate = value
  }

  setChapterTrack({ enabled }) {
    this.useChapterTrack = enabled
  }

  async getCurrentTime() {
    return {
      value: this.overallCurrentTime,
      bufferedTime: 0
    }
  }

  async getIsCastAvailable() {
    return false
  }

  initializePlayer() {
    if (document.getElementById('audio-player')) {
      document.getElementById('audio-player').remove()
    }
    var audioEl = document.createElement('audio')
    audioEl.id = 'audio-player'
    audioEl.style.display = 'none'
    document.body.appendChild(audioEl)
    this.player = audioEl

    this.player.addEventListener('play', this.evtPlay.bind(this))
    this.player.addEventListener('pause', this.evtPause.bind(this))
    this.player.addEventListener('progress', this.evtProgress.bind(this))
    this.player.addEventListener('ended', this.evtEnded.bind(this))
    this.player.addEventListener('error', this.evtError.bind(this))
    this.player.addEventListener('loadedmetadata', this.evtLoadedMetadata.bind(this))
    this.player.addEventListener('timeupdate', this.evtTimeupdate.bind(this))

    var mimeTypes = ['audio/flac', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/aac', 'audio/wav']
    mimeTypes.forEach((mt) => {
      this.playableMimeTypes[mt] = this.player.canPlayType(mt)
    })
    console.log(`[LocalPlayer] Supported mime types`, this.playableMimeTypes)
  }

  evtPlay() {
    this.notifyListeners('onPlayingUpdate', { value: true })
  }
  evtPause() {
    this.notifyListeners('onPlayingUpdate', { value: false })
  }
  evtProgress() {}
  evtEnded() {
    if (this.currentTrackIndex < this.audioTracks.length - 1) {
      console.log(`[AbsAudioPlayer] Track ended - loading next track ${this.currentTrackIndex + 1}`)
      var nextTrack = this.audioTracks[this.currentTrackIndex + 1]
      this.playWhenReady = true
      this.startTime = Math.floor(nextTrack.startOffset)
      this.loadCurrentTrack()
    } else {
      console.log(`[LocalPlayer] Ended`)
      this.sendPlaybackMetadata(PlayerState.ENDED)
    }
  }
  evtError(error) {
    console.error('Player error', error)
  }
  evtLoadedMetadata(data) {
    console.log(`[AbsAudioPlayer] Loaded metadata`, data)
    if (!this.player) {
      console.error('[AbsAudioPlayer] evtLoadedMetadata player not set')
      return
    }
    this.player.currentTime = this.trackStartTime

    this.sendPlaybackMetadata(PlayerState.READY)
    if (this.playWhenReady) {
      this.player.play()
    }
  }
  evtTimeupdate() {}

  sendPlaybackMetadata(playerState) {
    this.notifyListeners('onMetadata', {
      duration: this.totalDuration,
      currentTime: this.overallCurrentTime,
      playerState
    })
  }

  loadCurrentTrack() {
    if (!this.currentTrack) return
    this.trackStartTime = Math.max(0, this.startTime - (this.currentTrack.startOffset || 0))
    const serverAddressUrl = new URL(vuexStore.getters['user/getServerAddress'])
    const serverHost = `${serverAddressUrl.protocol}//${serverAddressUrl.host}`

    let sessionTrackUrl = null
    if (this.currentTrack.contentUrl?.startsWith('/hls')) {
      sessionTrackUrl = this.currentTrack.contentUrl
    } else {
      sessionTrackUrl = `/public/session/${this.playbackSession.id}/track/${this.currentTrack.index || 1}`
    }

    this.player.src = `${serverHost}${sessionTrackUrl}`
    console.log(`[AbsAudioPlayer] Loading track src ${this.player.src}`)
    this.player.load()
    this.player.playbackRate = this.playbackRate
  }

  setAudioPlayer(playbackSession, playWhenReady = false) {
    if (!this.player) {
      this.initializePlayer()
    }

    this.notifyListeners('onPlaybackSession', playbackSession)

    this.playbackSession = playbackSession
    this.playWhenReady = playWhenReady
    this.audioTracks = playbackSession.audioTracks || []
    this.startTime = playbackSession.currentTime

    this.loadCurrentTrack()
  }
}

const AbsAudioPlayer = registerPlugin('AbsAudioPlayer', {
  web: () => new AbsAudioPlayerWeb()
})

export { AbsAudioPlayer }

export default ({ app, store }, inject) => {
  $axios = app.$axios
  vuexStore = store
}