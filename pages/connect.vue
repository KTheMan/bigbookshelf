<template>
  <div class="bb-connect">
    <div class="bb-connect-center">
      <!-- Brand -->
      <div class="bb-connect-brand">
        <div class="bb-connect-logo" aria-hidden="true" />
        <h1 class="bb-connect-title">Bigbookshelf</h1>
        <p class="bb-connect-subtitle">Self-hosted audiobook server for webOS TV</p>
      </div>

      <div class="bb-connect-spacer" />

      <!-- Saved servers card -->
      <div class="bb-connect-card bb-connect-card--servers">
        <p class="bb-connect-eyebrow">SAVED SERVERS</p>

        <ul class="bb-connect-servers">
          <li
            v-for="server in savedServers"
            :key="server.id"
            class="bb-connect-server-row"
            :class="{ 'bb-connect-server-row-active': focusedServerId === server.id }"
            data-focusable
            tabindex="-1"
            role="button"
            :aria-label="`Use ${server.name || defaultServerName(server.address)}`"
            :aria-pressed="focusedServerId === server.id ? 'true' : 'false'"
            @click="selectServer(server)"
            @focus="selectServer(server, { silent: true })"
          >
            <div class="bb-connect-server-meta">
              <div class="bb-connect-server-name">{{ server.name || defaultServerName(server.address) }}</div>
              <div class="bb-connect-server-address">{{ server.address }}</div>
            </div>
            <button
              type="button"
              class="bb-connect-server-remove"
              data-tv-skip
              tabindex="-1"
              aria-label="Remove server"
              @click.stop="removeServer(server)"
            >
              ✕
            </button>
          </li>
        </ul>

        <button type="button" class="bb-connect-add-server" @click="addNewServer">
          <span class="material-symbols" style="font-size:16px;color:rgb(var(--color-accent))">add</span>
          <span>ADD NEW SERVER</span>
        </button>
      </div>

      <div class="bb-connect-spacer" />

      <!-- Sign in card -->
      <div class="bb-connect-card bb-connect-card--signin">
        <p class="bb-connect-eyebrow">SIGN IN</p>

        <form @submit.prevent="submit">
          <div class="bb-connect-field">
            <label class="bb-connect-label" for="connect-address">Server Address</label>
            <div
              ref="addressControl"
              class="bb-connect-input-control"
              :class="inputControlClass('address', { error: addressError })"
              data-focusable
              data-tv-input-control
              tabindex="-1"
              role="button"
              aria-label="Edit server address"
              @focus="focusedField = 'address'"
              @click="activateInput('address')"
            >
              <input
                id="connect-address"
                ref="addressInput"
                v-model="address"
                type="text"
                class="bb-connect-input"
                data-tv-skip
                tabindex="-1"
                placeholder="http://192.168.1.100:13378"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="none"
                @focus="beginEditing('address')"
                @blur="endEditing('address')"
                @keydown.enter.prevent="finishEditing('address')"
                @keydown.esc.prevent="finishEditing('address')"
                @keydown.stop
              />
            </div>
            <p v-if="addressError" class="bb-connect-field-error">{{ addressError }}</p>
          </div>

          <div class="bb-connect-row">
            <div class="bb-connect-field">
              <label class="bb-connect-label" for="connect-username">Username</label>
              <div
                ref="usernameControl"
                class="bb-connect-input-control"
                :class="inputControlClass('username')"
                data-focusable
                data-tv-input-control
                tabindex="-1"
                role="button"
                aria-label="Edit username"
                @focus="focusedField = 'username'"
                @click="activateInput('username')"
              >
                <input
                  id="connect-username"
                  ref="usernameInput"
                  v-model="username"
                  type="text"
                  class="bb-connect-input"
                  data-tv-skip
                  tabindex="-1"
                  autocomplete="off"
                  autocorrect="off"
                  autocapitalize="none"
                  @focus="beginEditing('username')"
                  @blur="endEditing('username')"
                  @keydown.enter.prevent="finishEditing('username')"
                  @keydown.esc.prevent="finishEditing('username')"
                  @keydown.stop
                />
              </div>
            </div>
            <div class="bb-connect-field">
              <label class="bb-connect-label" for="connect-password">Password</label>
              <div
                ref="passwordControl"
                class="bb-connect-input-control"
                :class="inputControlClass('password')"
                data-focusable
                data-tv-input-control
                tabindex="-1"
                role="button"
                aria-label="Edit password"
                @focus="focusedField = 'password'"
                @click="activateInput('password')"
              >
                <input
                  id="connect-password"
                  ref="passwordInput"
                  v-model="password"
                  type="password"
                  class="bb-connect-input"
                  data-tv-skip
                  tabindex="-1"
                  autocomplete="current-password"
                  @focus="beginEditing('password')"
                  @blur="endEditing('password')"
                  @keydown.enter.prevent="finishEditing('password')"
                  @keydown.esc.prevent="finishEditing('password')"
                  @keydown.stop
                />
              </div>
            </div>
          </div>

          <div class="bb-connect-form-footer">
            <button
              type="button"
              class="bb-connect-save-toggle"
              role="checkbox"
              :aria-checked="saveCredentials ? 'true' : 'false'"
              @click="saveCredentials = !saveCredentials"
            >
              <span class="bb-connect-save-box">
                <span v-if="saveCredentials" class="material-symbols">check</span>
              </span>
              <span>SAVE CREDENTIALS</span>
            </button>

            <button type="submit" class="bb-connect-signin-btn" :disabled="loading || resumingSession">
              {{ loading || resumingSession ? 'CONNECTING...' : 'SIGN IN' }}
            </button>
          </div>

          <p v-if="resumingSession" class="bb-connect-status">Connecting to saved session...</p>
          <p v-if="errorMessage" class="bb-connect-error">{{ errorMessage }}</p>
        </form>
      </div>

      <!-- Footer -->
      <p class="bb-connect-footer">v{{ $config.version }} · <a href="https://github.com/advplyr/audiobookshelf" target="_blank" rel="noopener">Follow on GitHub</a></p>
    </div>
  </div>
</template>

<script>
import { CapacitorHttp } from '@capacitor/core'

export default {
  layout: 'blank',
  data() {
    return {
      address: '',
      username: '',
      password: '',
      loading: false,
      focusedField: null,
      editingField: null,
      saveCredentials: true,
      resumingSession: false,
      addressError: '',
      errorMessage: '',
      savedServers: [],
      focusedServerId: null,
      deviceData: null
    }
  },
  async mounted() {
    await this.$store.dispatch('setupNetworkListener')
    this.deviceData = await this.$db.getDeviceData()
    this.$store.commit('setDeviceData', this.deviceData)
    this.savedServers = this.deviceData?.serverConnectionConfigs || []
    let last = null
    if (this.savedServers.length && !this.address) {
      const lastId = this.deviceData?.lastServerConnectionConfigId
      last = this.savedServers.find((s) => s.id === lastId) || this.savedServers[0]
      this.populateFromServer(last)
    }
    if (this.$route.query.error) {
      this.errorMessage = this.$route.query.error
    } else if (last?.token) {
      await this.resumeSavedSession(last)
    }
  },
  methods: {
    defaultServerName(address) {
      try {
        const url = new URL(address)
        return url.host
      } catch {
        return address
      }
    },
    normalizeServerAddress(address) {
      const trimmed = (address || '').trim().replace(/\/+$/, '')
      if (!trimmed) return ''
      return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    },
    inputControlClass(field, options = {}) {
      return {
        'bb-connect-input-control-active': this.focusedField === field || this.editingField === field,
        'bb-connect-input-control-editing': this.editingField === field,
        'bb-connect-input-control-error': !!options.error
      }
    },
    populateFromServer(server) {
      if (!server) return
      this.address = server.address || ''
      this.username = server.username || ''
      this.password = server.password || ''
      this.focusedServerId = server.id
      this.saveCredentials = true
    },
    selectServer(server, options = {}) {
      this.populateFromServer(server)
      if (!options.silent) this.focusedField = null
    },
    addNewServer() {
      this.address = ''
      this.username = ''
      this.password = ''
      this.focusedServerId = null
      this.focusedField = 'address'
      this.saveCredentials = true
      this.$nextTick(() => {
        if (this.$tvRemote && this.$refs.addressControl) this.$tvRemote.setFocus(this.$refs.addressControl)
      })
    },
    activateInput(field) {
      this.focusedField = field
      this.editingField = field
      this.$nextTick(() => {
        const input = this.$refs[`${field}Input`]
        if (!input) return
        input.focus()
      })
    },
    beginEditing(field) {
      this.focusedField = field
      this.editingField = field
    },
    endEditing(field) {
      if (this.editingField === field) this.editingField = null
    },
    finishEditing(field) {
      const input = this.$refs[`${field}Input`]
      const control = this.$refs[`${field}Control`]
      if (input) input.blur()
      this.focusedField = field
      this.editingField = null
      this.$nextTick(() => {
        if (this.$tvRemote && control) this.$tvRemote.setFocus(control)
      })
    },
    async removeServer(server) {
      if (!server?.id) return
      await this.$db.clearRefreshToken(server.id).catch(() => null)
      await this.$db.removeServerConnectionConfig(server.id)
      this.deviceData = await this.$db.getDeviceData()
      this.savedServers = this.deviceData?.serverConnectionConfigs || []
      const next = this.savedServers[0]
      if (next) {
        this.populateFromServer(next)
      } else {
        this.addNewServer()
      }
    },
    async requestServerLogin(serverAddress) {
      const response = await CapacitorHttp.post({
        url: `${serverAddress}/login`,
        headers: {
          'Content-Type': 'application/json',
          'x-return-tokens': 'true'
        },
        data: {
          username: this.username,
          password: this.password || ''
        },
        connectTimeout: 20000
      })

      if (response.status >= 400) {
        const message = typeof response.data === 'string' ? response.data : `HTTP ${response.status}`
        throw new Error(message)
      }
      if (!response.data?.user) {
        throw new Error(response.data?.error || 'Login response did not include a user')
      }
      return response.data
    },
    getTokenFromAuth(authRes, baseConfig = {}) {
      return authRes?.user?.accessToken || authRes?.accessToken || authRes?.user?.token || authRes?.userDefaultToken || baseConfig.token
    },
    getRefreshTokenFromAuth(authRes, baseConfig = {}) {
      return authRes?.user?.refreshToken || authRes?.refreshToken || baseConfig.refreshToken
    },
    async applyAuthenticatedSession(authRes, baseConfig = {}, { persist } = { persist: true }) {
      const user = authRes?.user
      if (!user) throw new Error('Authentication response did not include a user')

      const serverSettings = authRes.serverSettings || {}
      const token = this.getTokenFromAuth(authRes, baseConfig)
      if (!token) throw new Error('Authentication response did not include an access token')

      this.$store.commit('setServerSettings', serverSettings)
      this.$store.commit('libraries/setEReaderDevices', authRes.ereaderDevices || [])
      if (serverSettings.language && this.$setServerLanguageCode) this.$setServerLanguageCode(serverSettings.language)

      const config = {
        ...baseConfig,
        address: baseConfig.address,
        name: baseConfig.name || this.defaultServerName(baseConfig.address),
        userId: user.id || baseConfig.userId,
        username: user.username || baseConfig.username || this.username,
        token,
        refreshToken: persist ? this.getRefreshTokenFromAuth(authRes, baseConfig) : null,
        version: serverSettings.version || baseConfig.version,
        customHeaders: baseConfig.customHeaders || {}
      }

      let serverConnectionConfig
      if (persist) {
        serverConnectionConfig = await this.$db.setServerConnectionConfig(config)
        this.deviceData = await this.$db.getDeviceData()
        this.savedServers = this.deviceData?.serverConnectionConfigs || []
      } else {
        serverConnectionConfig = {
          ...config,
          id: config.id || `session_${Date.now()}`
        }
      }

      const lastLibraryId = await this.$localStore.getLastLibraryId()
      if (lastLibraryId && (!user.librariesAccessible?.length || user.librariesAccessible.includes(lastLibraryId))) {
        this.$store.commit('libraries/setCurrentLibrary', lastLibraryId)
      } else if (authRes.userDefaultLibraryId) {
        this.$store.commit('libraries/setCurrentLibrary', authRes.userDefaultLibraryId)
      }

      this.$store.commit('user/setUser', user)
      this.$store.commit('user/setAccessToken', serverConnectionConfig.token)
      this.$store.commit('user/setServerConnectionConfig', serverConnectionConfig)
      this.$socket.connect(serverConnectionConfig.address, serverConnectionConfig.token)
      await this.$store.dispatch('libraries/load')
      await this.$router.replace('/bookshelf')
    },
    async resumeSavedSession(server) {
      if (this.resumingSession || !server?.token) return
      this.resumingSession = true
      this.errorMessage = ''
      try {
        const authRes = await this.$nativeHttp.post(`${server.address}/api/authorize`, null, {
          headers: { Authorization: `Bearer ${server.token}` },
          connectTimeout: 6000,
          serverConnectionConfig: server
        })

        const serverSettings = authRes?.serverSettings || {}
        if (this.$isValidVersion(serverSettings.version, '2.26.0') && (server.token === authRes?.user?.token || authRes?.user?.isOldToken)) {
          throw new Error('Saved session uses an old token. Sign in again.')
        }

        const updatedToken = this.$store.getters['user/getToken']
        await this.applyAuthenticatedSession(authRes, { ...server, token: updatedToken || server.token }, { persist: true })
      } catch (error) {
        console.error('saved session resume failed', error)
        this.errorMessage = error?.message || 'Saved session expired. Sign in again.'
        this.resumingSession = false
      }
    },
    async submit() {
      this.errorMessage = ''
      this.addressError = ''
      const serverAddress = this.normalizeServerAddress(this.address)
      if (!serverAddress) {
        this.addressError = 'Server address is required'
        return
      }
      this.loading = true
      try {
        const selectedServer = this.savedServers.find((server) => server.id === this.focusedServerId)
        const authRes = await this.requestServerLogin(serverAddress)
        await this.applyAuthenticatedSession(
          authRes,
          {
            ...(selectedServer || {}),
            address: serverAddress,
            username: this.username
          },
          { persist: this.saveCredentials }
        )
      } catch (err) {
        console.error('connect error', err)
        this.errorMessage = err.message || 'Sign-in failed'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.bb-connect {
  width: 1920px;
  height: 1080px;
  position: relative;
  background-color: #232323;
  overflow: hidden;
  font-family: var(--font-sans);
}

.bb-connect [data-focusable].webos-focused,
.bb-connect [data-focusable]:focus,
.bb-connect button.webos-focused,
.bb-connect button:focus {
  transform: none !important;
}

.bb-connect-center {
  position: absolute;
  left: 480px;
  top: 80px;
  width: 960px;
  height: 920px;
  overflow: visible;
}

.bb-connect-brand {
  position: absolute;
  left: 0;
  top: 0;
  width: 960px;
  height: 225px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

.bb-connect-logo {
  width: 120px;
  height: 120px;
  flex: 0 0 120px;
  border-radius: 50%;
  background: #1ad691;
}

.bb-connect-title {
  font-size: 42px;
  line-height: 50px;
  font-weight: 700;
  color: #e6edf3;
  margin: 22px 0 0;
  letter-spacing: 0;
}

.bb-connect-subtitle {
  font-size: 16px;
  line-height: 19px;
  color: #a0a6ac;
  margin: 12px 0 0;
  letter-spacing: 0;
}

.bb-connect-spacer {
  height: 40px;
  flex-shrink: 0;
}

/* Cards */
.bb-connect-card {
  width: 720px;
  position: absolute;
  left: 120px;
  background-color: #2f3030;
  border-radius: 12px;
  padding: 24px 32px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-shrink: 0;
  box-sizing: border-box;
}

.bb-connect-card--servers {
  top: 265px;
  height: 290px;
}

.bb-connect-card--signin {
  top: 595px;
  height: 320px;
}

.bb-connect-eyebrow {
  font-size: 13px;
  line-height: 16px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #a0a6ac;
  margin: 0;
}

/* Server rows */
.bb-connect-servers {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 164px;
  overflow: hidden;
}

.bb-connect-server-row {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 48px;
  padding: 0 16px;
  border-radius: 6px;
  border: 2px solid transparent;
  box-sizing: border-box;
  outline: none;
  cursor: pointer;
}

.bb-connect-server-row-active,
.bb-connect-server-row.webos-focused,
.bb-connect-server-row:focus {
  background-color: #383838;
  border-color: transparent;
  box-shadow: inset 0 0 0 2px #1ad691 !important;
}

.bb-connect-server-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.bb-connect-server-name {
  font-size: 15px;
  line-height: 18px;
  font-weight: 600;
  color: #e6edf3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bb-connect-server-address {
  font-size: 13px;
  line-height: 16px;
  color: #a0a6ac;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bb-connect-server-remove {
  width: 16px;
  height: 24px;
  border: 0;
  padding: 0;
  flex-shrink: 0;
  color: #a0a6ac;
  background: transparent;
  font-size: 18px;
  line-height: 23px;
  font-weight: 700;
  text-align: center;
  cursor: pointer;
}

.bb-connect-add-server {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 48px;
  margin-top: auto;
  border: 1px dashed #4b5559;
  border-radius: 8px;
  background: transparent;
  color: #e6edf3;
  font-size: 13px;
  line-height: 16px;
  font-weight: 700;
  letter-spacing: 0.8px;
  cursor: pointer;
  outline: none;
  box-sizing: border-box;
}

.bb-connect-add-server.webos-focused,
.bb-connect-add-server:focus {
  border-color: #1ad691;
  background-color: #383838;
}

/* Sign in form */
.bb-connect-card form {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.bb-connect-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}

.bb-connect-label {
  font-size: 13px;
  line-height: 16px;
  font-weight: 600;
  color: #e6edf3;
}

.bb-connect-input-control {
  height: 50px;
  padding: 0 16px;
  background-color: #383838;
  border: 1px solid #4b5559;
  border-radius: 8px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  outline: none;
}

.bb-connect-input-control-active,
.bb-connect-input-control.webos-focused,
.bb-connect-input-control:focus {
  border-color: transparent;
  box-shadow: inset 0 0 0 2px #1ad691 !important;
}

.bb-connect-input-control-editing {
  background-color: #3f4040;
}

.bb-connect-input-control-error {
  border-color: rgb(var(--color-error));
}

.bb-connect-input {
  width: 100%;
  height: 48px;
  padding: 0;
  background-color: transparent;
  color: #e6edf3;
  border: 0;
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 20px;
  outline: none;
  box-sizing: border-box;
}

.bb-connect-input::placeholder {
  color: #a0a6ac;
}

.bb-connect-field-error {
  font-size: 12px;
  color: rgb(var(--color-error));
  margin: 0;
}

.bb-connect-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 0;
}

.bb-connect-form-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 3px;
}

.bb-connect-save-toggle {
  height: 46px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: #e6edf3;
  font-family: var(--font-sans);
  font-size: 13px;
  line-height: 16px;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
  outline: none;
}

.bb-connect-save-toggle.webos-focused,
.bb-connect-save-toggle:focus {
  border-color: #1ad691;
  box-shadow: 0 0 0 4px rgba(26, 214, 145, 0.18);
}

.bb-connect-save-box {
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #4b5559;
  border-radius: 4px;
  background-color: #383838;
  box-sizing: border-box;
}

.bb-connect-save-box .material-symbols {
  color: #1ad691;
  font-size: 16px;
  line-height: 1;
}

.bb-connect-signin-btn {
  width: 131px;
  height: 46px;
  background-color: #1ad691;
  color: #232323;
  border: none;
  border-radius: 8px;
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 18px;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
  outline: none;
}

.bb-connect-signin-btn.webos-focused,
.bb-connect-signin-btn:focus {
  box-shadow: inset 0 0 0 2px #e6edf3 !important;
}

.bb-connect-signin-btn:disabled {
  opacity: 0.6;
  cursor: wait;
}

.bb-connect-status {
  color: #a0a6ac;
  font-size: 13px;
  margin: 10px 0 0;
  text-align: center;
}

.bb-connect-error {
  color: rgb(var(--color-error));
  font-size: 14px;
  margin: 8px 0 0;
}

.bb-connect-footer {
  position: absolute;
  left: 120px;
  top: 939px;
  width: 720px;
  margin: 0;
  font-size: 12px;
  color: rgb(var(--color-fg-muted));
  text-align: center;
}

.bb-connect-footer a {
  color: rgb(var(--color-accent));
  text-decoration: none;
}
</style>
