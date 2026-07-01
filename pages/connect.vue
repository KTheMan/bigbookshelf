<template>
  <div class="bb-connect">
    <div class="bb-connect-center">
      <!-- Brand -->
      <div class="bb-connect-brand">
        <div class="bb-connect-logo">
          <svg viewBox="0 0 64 64" width="120" height="120" aria-hidden="true">
            <circle cx="32" cy="32" r="32" fill="#1AD691" />
            <rect x="14" y="30" width="36" height="4" rx="2" fill="#232323" />
            <rect x="30" y="14" width="4" height="36" rx="2" fill="#232323" />
          </svg>
        </div>
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
            @click="selectServer(server)"
            @focus="selectServer(server, { silent: true })"
          >
            <div class="bb-connect-server-meta">
              <div class="bb-connect-server-name">{{ server.name || defaultServerName(server.address) }}</div>
              <div class="bb-connect-server-address">{{ server.address }}</div>
            </div>
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
            <button type="submit" class="bb-connect-signin-btn" :disabled="loading">
              {{ loading ? 'SIGNING IN...' : 'SIGN IN' }}
            </button>
          </div>

          <p v-if="errorMessage" class="bb-connect-error">{{ errorMessage }}</p>
        </form>
      </div>

      <!-- Footer -->
      <p class="bb-connect-footer">v{{ $config.version }} · <a href="https://github.com/advplyr/audiobookshelf" target="_blank" rel="noopener">Follow on GitHub</a></p>
    </div>
  </div>
</template>

<script>
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
    if (this.savedServers.length && !this.address) {
      const lastId = this.deviceData?.lastServerConnectionConfigId
      const last = this.savedServers.find((s) => s.id === lastId) || this.savedServers[0]
      this.address = last.address
      this.username = last.username || ''
      this.password = last.password || ''
      this.focusedServerId = last.id
    }
    if (this.$route.query.error) {
      this.errorMessage = this.$route.query.error
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
    inputControlClass(field, options = {}) {
      return {
        'bb-connect-input-control-active': this.focusedField === field || this.editingField === field,
        'bb-connect-input-control-editing': this.editingField === field,
        'bb-connect-input-control-error': !!options.error
      }
    },
    selectServer(server, options = {}) {
      this.focusedServerId = server.id
      this.address = server.address || ''
      this.username = server.username || ''
      this.password = server.password || ''
      if (!options.silent) this.focusedField = null
    },
    addNewServer() {
      this.address = ''
      this.username = ''
      this.password = ''
      this.focusedServerId = null
      this.focusedField = 'address'
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
      const updated = this.savedServers.filter((s) => s.id !== server.id)
      await this.$db.setServerConnectionConfigs(updated)
      this.savedServers = updated
    },
    async submit() {
      this.errorMessage = ''
      this.addressError = ''
      if (!this.address) {
        this.addressError = 'Server address is required'
        return
      }
      this.loading = true
      try {
        const nativeHttpOptions = {
          headers: { Authorization: `Bearer ${this.password || ''}` },
          connectTimeout: 6000,
          serverConnectionConfig: { address: this.address }
        }
        const authRes = await this.$nativeHttp.post(`${this.address}/api/authorize`, { username: this.username, password: this.password }, nativeHttpOptions).catch(() => null)
        if (!authRes) {
          this.errorMessage = 'Could not connect to server'
          this.loading = false
          return
        }
        const { user, userDefaultLibraryId, serverSettings } = authRes
        const config = {
          id: 'srv_' + Date.now(),
          address: this.address,
          name: this.defaultServerName(this.address),
          username: this.username,
          token: authRes.userDefaultToken || this.password,
          version: serverSettings.version
        }
        await this.$db.setServerConnectionConfigs([...(this.savedServers || []), config])
        this.$store.commit('setServerSettings', serverSettings)
        this.$store.commit('user/setUser', user)
        this.$store.commit('user/setAccessToken', config.token)
        this.$store.commit('user/setServerConnectionConfig', config)
        const lastLibId = await this.$localStore.getLastLibraryId()
        const libId = lastLibId && user.librariesAccessible.includes(lastLibId) ? lastLibId : userDefaultLibraryId
        if (libId) this.$store.commit('libraries/setCurrentLibrary', libId)
        this.$socket.connect(config.address, config.token)
        await this.$store.dispatch('libraries/load')
        this.$router.push('/bookshelf')
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
  border-radius: 8px;
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
  justify-content: flex-end;
  margin-top: 3px;
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
