import { registerPlugin, Capacitor, WebPlugin } from '@capacitor/core'

class AbsDatabaseWeb extends WebPlugin {
  constructor() {
    super()
  }

  async getDeviceData() {
    var dd = localStorage.getItem('device')
    if (dd) {
      return JSON.parse(dd)
    }
    const deviceData = {
      serverConnectionConfigs: [],
      lastServerConnectionConfigId: null,
      currentLocalPlaybackSession: null,
      deviceSettings: {}
    }
    return deviceData
  }

  async setCurrentServerConnectionConfig(serverConnectionConfig) {
    var deviceData = await this.getDeviceData()

    var ssc = deviceData.serverConnectionConfigs.find((_ssc) => _ssc.id == serverConnectionConfig.id)
    if (ssc) {
      deviceData.lastServerConnectionConfigId = ssc.id
      ssc.name = `${ssc.address} (${serverConnectionConfig.username})`
      ssc.token = serverConnectionConfig.token
      ssc.userId = serverConnectionConfig.userId
      ssc.username = serverConnectionConfig.username
      ssc.version = serverConnectionConfig.version
      ssc.customHeaders = serverConnectionConfig.customHeaders || {}

      if (serverConnectionConfig.refreshToken) {
        console.log('[AbsDatabase] Updating refresh token...')
        localStorage.setItem(`refresh_token_${ssc.id}`, serverConnectionConfig.refreshToken)
      }

      localStorage.setItem('device', JSON.stringify(deviceData))
    } else {
      ssc = {
        id: encodeURIComponent(btoa(serverConnectionConfig.address + '@' + serverConnectionConfig.username)),
        index: deviceData.serverConnectionConfigs.length,
        name: `${serverConnectionConfig.address} (${serverConnectionConfig.username})`,
        userId: serverConnectionConfig.userId,
        username: serverConnectionConfig.username,
        address: serverConnectionConfig.address,
        token: serverConnectionConfig.token,
        version: serverConnectionConfig.version,
        customHeaders: serverConnectionConfig.customHeaders || {}
      }

      if (serverConnectionConfig.refreshToken) {
        console.log('[AbsDatabase] Setting refresh token...')
        localStorage.setItem(`refresh_token_${ssc.id}`, serverConnectionConfig.refreshToken)
      }

      deviceData.serverConnectionConfigs.push(ssc)
      deviceData.lastServerConnectionConfigId = ssc.id
      localStorage.setItem('device', JSON.stringify(deviceData))
    }
    return ssc
  }

  async getRefreshToken({ serverConnectionConfigId }) {
    console.log('[AbsDatabase] Getting refresh token...', serverConnectionConfigId)
    const refreshToken = localStorage.getItem(`refresh_token_${serverConnectionConfigId}`)
    return refreshToken ? { refreshToken } : null
  }

  async clearRefreshToken({ serverConnectionConfigId }) {
    console.log('[AbsDatabase] Clearing refresh token...', serverConnectionConfigId)
    localStorage.removeItem(`refresh_token_${serverConnectionConfigId}`)
  }

  async removeServerConnectionConfig(serverConnectionConfigCallObject) {
    var serverConnectionConfigId = serverConnectionConfigCallObject.serverConnectionConfigId
    var deviceData = await this.getDeviceData()
    deviceData.serverConnectionConfigs = deviceData.serverConnectionConfigs.filter((ssc) => ssc.id != serverConnectionConfigId)
    if (deviceData.lastServerConnectionConfigId === serverConnectionConfigId) {
      deviceData.lastServerConnectionConfigId = deviceData.serverConnectionConfigs[0]?.id || null
    }
    localStorage.removeItem(`refresh_token_${serverConnectionConfigId}`)
    localStorage.setItem('device', JSON.stringify(deviceData))
  }

  async logout() {
    console.log('[AbsDatabase] Logging out...')
    var deviceData = await this.getDeviceData()
    deviceData.lastServerConnectionConfigId = null
    localStorage.setItem('device', JSON.stringify(deviceData))
  }

  async getLocalFolders() {
    return {
      value: []
    }
  }

  async getLocalFolder({ folderId }) {
    return null
  }

  async getLocalLibraryItems(payload) {
    return {
      value: []
    }
  }

  async getLocalLibraryItemsInFolder({ folderId }) {
    return this.getLocalLibraryItems()
  }

  async getLocalLibraryItem({ id }) {
    return null
  }

  async getLocalLibraryItemByLId({ libraryItemId }) {
    return null
  }

  async getAllLocalMediaProgress() {
    return {
      value: []
    }
  }

  async removeLocalMediaProgress({ localMediaProgressId }) {
    return null
  }

  async syncLocalSessionsWithServer({ isFirstSync }) {
    return null
  }

  async syncServerMediaProgressWithLocalMediaProgress(payload) {
    return null
  }

  async updateLocalTrackOrder({ localLibraryItemId, tracks }) {
    return []
  }

  async updateLocalMediaProgressFinished(payload) {
    return null
  }

  async updateDeviceSettings(payload) {
    const deviceData = await this.getDeviceData()
    deviceData.deviceSettings = payload
    localStorage.setItem('device', JSON.stringify(deviceData))
    return deviceData
  }

  async getMediaItemHistory({ mediaId }) {
    console.log('Get media item history', mediaId)
    return {
      id: mediaId,
      mediaDisplayTitle: '',
      libraryItemId: mediaId,
      episodeId: null,
      isLocal: false,
      serverConnectionConfigId: null,
      serverAddress: null,
      createdAt: Date.now(),
      events: []
    }
  }
}

const AbsDatabase = registerPlugin('AbsDatabase', {
  web: () => new AbsDatabaseWeb()
})

export { AbsDatabase }
