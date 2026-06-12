<template>
  <div class="w-full h-full px-4 py-4 overflow-y-auto">
    <div class="flex gap-6">

      <!-- ── Left column: Display + Playback ───────────────────────────── -->
      <div class="flex-1 min-w-0">

        <!-- Display settings -->
        <p class="uppercase text-xs font-semibold text-fg-muted mb-1">{{ $strings.HeaderUserInterfaceSettings }}</p>
        <div class="flex items-center py-2">
          <div class="w-10 flex justify-center" @click="toggleEnableAltView">
            <ui-toggle-switch v-model="enableBookshelfView" @input="saveSettings" />
          </div>
          <p class="pl-4">{{ $strings.LabelUseBookshelfView }}</p>
        </div>
        <div class="py-2 flex items-center">
          <p class="pr-4 w-36">{{ $strings.LabelLanguage }}</p>
          <div @click.stop="showLanguageOptions">
            <ui-text-input :value="languageOption" readonly append-icon="expand_more" style="max-width: 200px" />
          </div>
        </div>
        <div class="py-2 flex items-center">
          <p class="pr-4 w-36">{{ $strings.LabelTheme }}</p>
          <div @click.stop="showThemeOptions">
            <ui-text-input :value="themeOption" readonly append-icon="expand_more" style="max-width: 200px" />
          </div>
        </div>
        <div class="py-2 flex items-center">
          <p class="pr-4 w-36">Zoom Level</p>
          <div @click.stop="showZoomOptions">
            <ui-text-input :value="zoomLevelOption" readonly append-icon="expand_more" style="max-width: 200px" />
          </div>
        </div>

        <!-- Playback settings -->
        <p class="uppercase text-xs font-semibold text-fg-muted mb-1 mt-6">{{ $strings.HeaderPlaybackSettings }}</p>
        <div class="py-2 flex items-center">
          <p class="pr-4 w-36">{{ $strings.LabelJumpBackwardsTime }}</p>
          <div @click.stop="showJumpBackwardsOptions">
            <ui-text-input :value="jumpBackwardsOption" readonly append-icon="expand_more" style="width: 145px; max-width: 145px" />
          </div>
        </div>
        <div class="py-2 flex items-center">
          <p class="pr-4 w-36">{{ $strings.LabelJumpForwardsTime }}</p>
          <div @click.stop="showJumpForwardOptions">
            <ui-text-input :value="jumpForwardOption" readonly append-icon="expand_more" style="width: 145px; max-width: 145px" />
          </div>
        </div>
        <div class="flex items-center py-2">
          <div class="w-10 flex justify-center" @click="toggleDisableAutoRewind">
            <ui-toggle-switch v-model="settings.disableAutoRewind" @input="saveSettings" />
          </div>
          <p class="pl-4">{{ $strings.LabelDisableAutoRewind }}</p>
        </div>
        <div v-if="!isiOS" class="flex items-center py-2">
          <div class="w-10 flex justify-center" @click="toggleEnableMp3IndexSeeking">
            <ui-toggle-switch v-model="settings.enableMp3IndexSeeking" @input="saveSettings" />
          </div>
          <p class="pl-4">{{ $strings.LabelEnableMp3IndexSeeking }}</p>
          <span class="material-symbols text-xl ml-2" @click.stop="showConfirmMp3IndexSeeking">info</span>
        </div>
        <div class="flex items-center py-2">
          <div class="w-10 flex justify-center" @click="toggleAllowSeekingOnMediaControls">
            <ui-toggle-switch v-model="settings.allowSeekingOnMediaControls" @input="saveSettings" />
          </div>
          <p class="pl-4">{{ $strings.LabelAllowSeekingOnMediaControls }}</p>
        </div>

      </div>

      <!-- ── Right column: Sleep Timer ─────────────────────────────────── -->
      <div class="flex-1 min-w-0">

        <p class="uppercase text-xs font-semibold text-fg-muted mb-1">{{ $strings.HeaderSleepTimerSettings }}</p>
        <div class="flex items-center py-2">
          <div class="w-10 flex justify-center" @click="toggleDisableSleepTimerFadeOut">
            <ui-toggle-switch v-model="settings.disableSleepTimerFadeOut" @input="saveSettings" />
          </div>
          <p class="pl-4">{{ $strings.LabelDisableAudioFadeOut }}</p>
          <span class="material-symbols text-xl ml-2" @click.stop="showInfo('disableSleepTimerFadeOut')">info</span>
        </div>
        <div class="flex items-center py-2">
          <div class="w-10 flex justify-center" @click="toggleSleepTimerAlmostDoneChime">
            <ui-toggle-switch v-model="settings.enableSleepTimerAlmostDoneChime" @input="saveSettings" />
          </div>
          <p class="pl-4">{{ $strings.LabelSleepTimerAlmostDoneChime }}</p>
          <span class="material-symbols text-xl ml-2" @click.stop="showInfo('enableSleepTimerAlmostDoneChime')">info</span>
        </div>
        <div class="flex items-center py-2">
          <div class="w-10 flex justify-center" @click="toggleAutoSleepTimer">
            <ui-toggle-switch v-model="settings.autoSleepTimer" @input="saveSettings" />
          </div>
          <p class="pl-4">{{ $strings.LabelAutoSleepTimer }}</p>
          <span class="material-symbols text-xl ml-2" @click.stop="showInfo('autoSleepTimer')">info</span>
        </div>
        <div v-if="settings.autoSleepTimer" class="py-2 flex items-center">
          <p class="pr-4 w-36">{{ $strings.LabelStartTime }}</p>
          <ui-text-input type="time" v-model="settings.autoSleepTimerStartTime" style="width: 145px; max-width: 145px" @input="autoSleepTimerTimeUpdated" />
        </div>
        <div v-if="settings.autoSleepTimer" class="py-2 flex items-center">
          <p class="pr-4 w-36">{{ $strings.LabelEndTime }}</p>
          <ui-text-input type="time" v-model="settings.autoSleepTimerEndTime" style="width: 145px; max-width: 145px" @input="autoSleepTimerTimeUpdated" />
        </div>
        <div v-if="settings.autoSleepTimer" class="py-2 flex items-center">
          <p class="pr-4 w-36">{{ $strings.LabelSleepTimer }}</p>
          <div @click.stop="showSleepTimerOptions">
            <ui-text-input :value="sleepTimerLengthOption" readonly append-icon="expand_more" style="width: 145px; max-width: 145px" />
          </div>
        </div>
        <div v-if="settings.autoSleepTimer" class="flex items-center py-2">
          <div class="w-10 flex justify-center" @click="toggleAutoSleepTimerAutoRewind">
            <ui-toggle-switch v-model="settings.autoSleepTimerAutoRewind" @input="saveSettings" />
          </div>
          <p class="pl-4">{{ $strings.LabelAutoSleepTimerAutoRewind }}</p>
          <span class="material-symbols text-xl ml-2" @click.stop="showInfo('autoSleepTimerAutoRewind')">info</span>
        </div>
        <div v-if="settings.autoSleepTimerAutoRewind" class="py-2 flex items-center">
          <p class="pr-4 w-36">{{ $strings.LabelAutoRewindTime }}</p>
          <div @click.stop="showAutoSleepTimerRewindOptions">
            <ui-text-input :value="autoSleepTimerRewindLengthOption" readonly append-icon="expand_more" style="width: 145px; max-width: 145px" />
          </div>
        </div>

      </div>
    </div>

    <div v-show="loading" class="w-full h-full absolute top-0 left-0 flex items-center justify-center z-10">
      <ui-loading-indicator />
    </div>

    <modals-dialog v-model="showMoreMenuDialog" :items="moreMenuItems" :selected="moreMenuSelected" @action="clickMenuAction" />
    <modals-sleep-timer-length-modal v-model="showSleepTimerLengthModal" @change="sleepTimerLengthModalSelection" />
    <modals-auto-sleep-timer-rewind-length-modal v-model="showAutoSleepTimerRewindLengthModal" @change="showAutoSleepTimerRewindLengthModalSelection" />
  </div>
</template>

<script>
import { Dialog } from '@capacitor/dialog'
import jumpLabelMixin from '@/mixins/jumpLabel'

export default {
  mixins: [jumpLabelMixin],
  data() {
    return {
      loading: false,
      deviceData: null,
      showMoreMenuDialog: false,
      showSleepTimerLengthModal: false,
      showAutoSleepTimerRewindLengthModal: false,
      moreMenuSetting: '',
      zoom: '1',
      settings: {
        disableAutoRewind: false,
        enableAltView: true,
        allowSeekingOnMediaControls: false,
        jumpForwardTime: 10,
        jumpBackwardsTime: 10,
        enableMp3IndexSeeking: false,
        disableShakeToResetSleepTimer: false,
        shakeSensitivity: 'MEDIUM',
        lockOrientation: 0,
        hapticFeedback: 'LIGHT',
        autoSleepTimer: false,
        autoSleepTimerStartTime: '22:00',
        autoSleepTimerEndTime: '06:00',
        sleepTimerLength: 900000,
        disableSleepTimerFadeOut: false,
        disableSleepTimerResetFeedback: false,
        enableSleepTimerAlmostDoneChime: false,
        autoSleepTimerAutoRewind: false,
        autoSleepTimerAutoRewindTime: 300000,
        languageCode: 'en-us',
        downloadUsingCellular: 'ALWAYS',
        streamingUsingCellular: 'ALWAYS',
        androidAutoBrowseLimitForGrouping: 100,
        androidAutoBrowseSeriesSequenceOrder: 'ASC'
      },
      theme: 'dark',
      lockCurrentOrientation: false,
      settingInfo: {
        disableShakeToResetSleepTimer: {
          name: this.$strings.LabelDisableShakeToReset,
          message: this.$strings.LabelDisableShakeToResetHelp
        },
        autoSleepTimer: {
          name: this.$strings.LabelAutoSleepTimer,
          message: this.$strings.LabelAutoSleepTimerHelp
        },
        disableSleepTimerFadeOut: {
          name: this.$strings.LabelDisableAudioFadeOut,
          message: this.$strings.LabelDisableAudioFadeOutHelp
        },
        disableSleepTimerResetFeedback: {
          name: this.$strings.LabelDisableVibrateOnReset,
          message: this.$strings.LabelDisableVibrateOnResetHelp
        },
        enableSleepTimerAlmostDoneChime: {
          name: this.$strings.LabelSleepTimerAlmostDoneChime,
          message: this.$strings.LabelSleepTimerAlmostDoneChimeHelp
        },
        autoSleepTimerAutoRewind: {
          name: this.$strings.LabelAutoSleepTimerAutoRewind,
          message: this.$strings.LabelAutoSleepTimerAutoRewindHelp
        },
        enableMp3IndexSeeking: {
          name: this.$strings.LabelEnableMp3IndexSeeking,
          message: this.$strings.LabelEnableMp3IndexSeekingHelp
        },
        androidAutoBrowseLimitForGrouping: {
          name: this.$strings.LabelAndroidAutoBrowseLimitForGrouping,
          message: this.$strings.LabelAndroidAutoBrowseLimitForGroupingHelp
        }
      },
      zoomLevelItems: [
        { text: '70%', value: '0.7' },
        { text: '80%', value: '0.8' },
        { text: '90%', value: '0.9' },
        { text: '100%', value: '1' },
        { text: '110%', value: '1.1' },
        { text: '125%', value: '1.25' }
      ]
    }
  },
  computed: {
    enableBookshelfView: {
      get() {
        return !this.settings.enableAltView
      },
      set(val) {
        this.settings.enableAltView = !val
      }
    },
    isiOS() {
      return this.$platform === 'ios'
    },
    jumpForwardSecondsOptions() {
      return this.$store.state.globals.jumpForwardSecondsOptions || []
    },
    jumpBackwardsSecondsOptions() {
      return this.$store.state.globals.jumpBackwardsSecondsOptions || []
    },
    languageOptionItems() {
      return this.$languageCodeOptions || []
    },
    jumpForwardOption() {
      return this.getJumpLabel(this.settings.jumpForwardTime)
    },
    jumpBackwardsOption() {
      return this.getJumpLabel(this.settings.jumpBackwardsTime)
    },
    themeOptionItems() {
      return [
        { text: this.$strings.LabelThemeBlack, value: 'black' },
        { text: this.$strings.LabelThemeDark, value: 'dark' },
        { text: this.$strings.LabelThemeLight, value: 'light' }
      ]
    },
    languageOption() {
      return this.languageOptionItems.find((i) => i.value === this.settings.languageCode)?.text || ''
    },
    themeOption() {
      return this.themeOptionItems.find((i) => i.value === this.theme)?.text || ''
    },
    zoomLevelOption() {
      return this.zoomLevelItems.find((i) => i.value === this.zoom)?.text || '100%'
    },
    sleepTimerLengthOption() {
      if (!this.settings.sleepTimerLength) return this.$strings.LabelEndOfChapter
      const minutes = Number(this.settings.sleepTimerLength) / 1000 / 60
      return `${minutes} min`
    },
    autoSleepTimerRewindLengthOption() {
      const minutes = Number(this.settings.autoSleepTimerAutoRewindTime) / 1000 / 60
      return `${minutes} min`
    },
    moreMenuItems() {
      if (this.moreMenuSetting === 'language') return this.languageOptionItems
      else if (this.moreMenuSetting === 'theme') return this.themeOptionItems
      else if (this.moreMenuSetting === 'zoom') return this.zoomLevelItems
      else if (this.moreMenuSetting === 'jumpForward')
        return this.jumpForwardSecondsOptions.map((value) => ({ text: this.getJumpLabel(value), value }))
      else if (this.moreMenuSetting === 'jumpBackwards')
        return this.jumpBackwardsSecondsOptions.map((value) => ({ text: this.getJumpLabel(value), value }))
      return []
    },
    moreMenuSelected() {
      if (this.moreMenuSetting === 'jumpForward') return this.settings.jumpForwardTime
      if (this.moreMenuSetting === 'jumpBackwards') return this.settings.jumpBackwardsTime
      if (this.moreMenuSetting === 'language') return this.settings.languageCode
      if (this.moreMenuSetting === 'theme') return this.theme
      if (this.moreMenuSetting === 'zoom') return this.zoom
      return null
    }
  },
  methods: {
    sleepTimerLengthModalSelection(value) {
      this.settings.sleepTimerLength = value
      this.saveSettings()
    },
    showAutoSleepTimerRewindLengthModalSelection(value) {
      this.settings.autoSleepTimerAutoRewindTime = value
      this.saveSettings()
    },
    showSleepTimerOptions() {
      this.showSleepTimerLengthModal = true
    },
    showAutoSleepTimerRewindOptions() {
      this.showAutoSleepTimerRewindLengthModal = true
    },
    showLanguageOptions() {
      this.moreMenuSetting = 'language'
      this.showMoreMenuDialog = true
    },
    showThemeOptions() {
      this.moreMenuSetting = 'theme'
      this.showMoreMenuDialog = true
    },
    showZoomOptions() {
      this.moreMenuSetting = 'zoom'
      this.showMoreMenuDialog = true
    },
    showJumpForwardOptions() {
      this.moreMenuSetting = 'jumpForward'
      this.showMoreMenuDialog = true
    },
    showJumpBackwardsOptions() {
      this.moreMenuSetting = 'jumpBackwards'
      this.showMoreMenuDialog = true
    },
    clickMenuAction(action) {
      this.showMoreMenuDialog = false
      if (this.moreMenuSetting === 'language') {
        this.settings.languageCode = action
        this.saveSettings()
      } else if (this.moreMenuSetting === 'theme') {
        this.theme = action
        this.saveTheme(action)
      } else if (this.moreMenuSetting === 'zoom') {
        this.zoom = action
        this.applyZoom(action)
        localStorage.setItem('webos-zoom', action)
      } else if (this.moreMenuSetting === 'jumpForward') {
        this.settings.jumpForwardTime = action
        this.saveSettings()
      } else if (this.moreMenuSetting === 'jumpBackwards') {
        this.settings.jumpBackwardsTime = action
        this.saveSettings()
      }
    },
    applyZoom(value) {
      // Scale the root font-size so all rem-based Tailwind utilities resize
      // proportionally within the fixed 1920×1080 viewport (same as browser zoom).
      // webOS base is 20px; multiplying keeps the same feel at 100%.
      document.documentElement.style.fontSize = (parseFloat(value) * 20) + 'px'
    },
    saveTheme(theme) {
      document.documentElement.dataset.theme = theme
      this.$localStore.setTheme(theme)
    },
    autoSleepTimerTimeUpdated(val) {
      if (!val) return
      this.saveSettings()
    },
    showInfo(setting) {
      if (this.settingInfo[setting]) {
        Dialog.alert({
          title: this.settingInfo[setting].name,
          message: this.settingInfo[setting].message
        })
      }
    },
    showConfirmMp3IndexSeeking() {
      if (this.settingInfo.enableMp3IndexSeeking) {
        Dialog.alert({
          title: this.settingInfo.enableMp3IndexSeeking.name,
          message: this.settingInfo.enableMp3IndexSeeking.message
        })
      }
    },
    toggleEnableMp3IndexSeeking() {
      this.settings.enableMp3IndexSeeking = !this.settings.enableMp3IndexSeeking
      this.saveSettings()
    },
    toggleAutoSleepTimer() {
      this.settings.autoSleepTimer = !this.settings.autoSleepTimer
      this.saveSettings()
    },
    toggleAutoSleepTimerAutoRewind() {
      this.settings.autoSleepTimerAutoRewind = !this.settings.autoSleepTimerAutoRewind
      this.saveSettings()
    },
    toggleDisableSleepTimerFadeOut() {
      this.settings.disableSleepTimerFadeOut = !this.settings.disableSleepTimerFadeOut
      this.saveSettings()
    },
    toggleSleepTimerAlmostDoneChime() {
      this.settings.enableSleepTimerAlmostDoneChime = !this.settings.enableSleepTimerAlmostDoneChime
      this.saveSettings()
    },
    toggleDisableAutoRewind() {
      this.settings.disableAutoRewind = !this.settings.disableAutoRewind
      this.saveSettings()
    },
    toggleEnableAltView() {
      this.settings.enableAltView = !this.settings.enableAltView
      this.saveSettings()
    },
    toggleAllowSeekingOnMediaControls() {
      this.settings.allowSeekingOnMediaControls = !this.settings.allowSeekingOnMediaControls
      this.saveSettings()
    },
    async saveSettings() {
      await this.$hapticsImpact()
      const updatedDeviceData = await this.$db.updateDeviceSettings({ ...this.settings })
      if (updatedDeviceData) {
        this.$store.commit('setDeviceData', updatedDeviceData)
        this.deviceData = updatedDeviceData
        this.$setLanguageCode(updatedDeviceData.deviceSettings?.languageCode || 'en-us')
        this.setDeviceSettings()
      }
    },
    setDeviceSettings() {
      const deviceSettings = this.deviceData.deviceSettings || {}
      this.settings.disableAutoRewind = !!deviceSettings.disableAutoRewind
      this.settings.enableAltView = !!deviceSettings.enableAltView
      this.settings.allowSeekingOnMediaControls = !!deviceSettings.allowSeekingOnMediaControls
      this.settings.jumpForwardTime = deviceSettings.jumpForwardTime || 10
      this.settings.jumpBackwardsTime = deviceSettings.jumpBackwardsTime || 10
      this.settings.enableMp3IndexSeeking = !!deviceSettings.enableMp3IndexSeeking
      this.settings.lockOrientation = deviceSettings.lockOrientation || 'NONE'
      this.lockCurrentOrientation = this.settings.lockOrientation !== 'NONE'
      this.settings.hapticFeedback = deviceSettings.hapticFeedback || 'LIGHT'
      this.settings.disableShakeToResetSleepTimer = !!deviceSettings.disableShakeToResetSleepTimer
      this.settings.shakeSensitivity = deviceSettings.shakeSensitivity || 'MEDIUM'
      this.settings.autoSleepTimer = !!deviceSettings.autoSleepTimer
      this.settings.autoSleepTimerStartTime = deviceSettings.autoSleepTimerStartTime || '22:00'
      this.settings.autoSleepTimerEndTime = deviceSettings.autoSleepTimerEndTime || '06:00'
      this.settings.sleepTimerLength = !isNaN(deviceSettings.sleepTimerLength) ? deviceSettings.sleepTimerLength : 900000
      this.settings.disableSleepTimerFadeOut = !!deviceSettings.disableSleepTimerFadeOut
      this.settings.disableSleepTimerResetFeedback = !!deviceSettings.disableSleepTimerResetFeedback
      this.settings.enableSleepTimerAlmostDoneChime = !!deviceSettings.enableSleepTimerAlmostDoneChime
      this.settings.autoSleepTimerAutoRewind = !!deviceSettings.autoSleepTimerAutoRewind
      this.settings.autoSleepTimerAutoRewindTime = !isNaN(deviceSettings.autoSleepTimerAutoRewindTime) ? deviceSettings.autoSleepTimerAutoRewindTime : 300000
      this.settings.languageCode = deviceSettings.languageCode || 'en-us'
      this.settings.downloadUsingCellular = deviceSettings.downloadUsingCellular || 'ALWAYS'
      this.settings.streamingUsingCellular = deviceSettings.streamingUsingCellular || 'ALWAYS'
      this.settings.androidAutoBrowseLimitForGrouping = deviceSettings.androidAutoBrowseLimitForGrouping
      this.settings.androidAutoBrowseSeriesSequenceOrder = deviceSettings.androidAutoBrowseSeriesSequenceOrder || 'ASC'
    },
    async init() {
      this.loading = true
      this.zoom = localStorage.getItem('webos-zoom') || '1'
      this.theme = (await this.$localStore.getTheme()) || 'dark'
      this.deviceData = await this.$db.getDeviceData()
      this.$store.commit('setDeviceData', this.deviceData)
      this.setDeviceSettings()
      this.loading = false
    }
  },
  mounted() {
    this.init()
  }
}
</script>
