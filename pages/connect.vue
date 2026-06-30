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
      <div class="bb-connect-card">
        <p class="bb-connect-eyebrow">SAVED SERVERS</p>

        <ul class="bb-connect-servers">
          <li
            v-for="server in savedServers"
            :key="server.id"
            class="bb-connect-server-row"
            :class="{ 'bb-connect-server-row-active': focusedServerId === server.id }"
          >
            <div class="bb-connect-server-meta">
              <div class="bb-connect-server-name">{{ server.name || defaultServerName(server.address) }}</div>
              <div class="bb-connect-server-address">{{ server.address }}</div>
            </div>
            <button type="button" class="bb-connect-server-remove" aria-label="Remove server" @click="removeServer(server)">
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
      <div class="bb-connect-card">
        <p class="bb-connect-eyebrow">SIGN IN</p>

        <form @submit.prevent="submit">
          <div class="bb-connect-field">
            <label class="bb-connect-label">Server Address</label>
            <input
              v-model="address"
              type="text"
              class="bb-connect-input"
              :class="{ 'bb-connect-input-active': addressFocused, 'bb-connect-input-error': addressError }"
              placeholder="http://192.168.1.100:13378"
              @focus="addressFocused = true"
              @blur="addressFocused = false"
            />
            <p v-if="addressError" class="bb-connect-field-error">{{ addressError }}</p>
          </div>

          <div class="bb-connect-row">
            <div class="bb-connect-field">
              <label class="bb-connect-label">Username</label>
              <input
                v-model="username"
                type="text"
                class="bb-connect-input"
                :class="{ 'bb-connect-input-active': usernameFocused }"
                @focus="usernameFocused = true"
                @blur="usernameFocused = false"
              />
            </div>
            <div class="bb-connect-field">
              <label class="bb-connect-label">Password</label>
              <input
                v-model="password"
                type="password"
                class="bb-connect-input"
                :class="{ 'bb-connect-input-active': passwordFocused }"
                @focus="passwordFocused = true"
                @blur="passwordFocused = false"
              />
            </div>
          </div>

          <div class="bb-connect-form-footer">
            <label class="bb-connect-remember">
              <div class="bb-connect-checkbox" :class="{ 'bb-connect-checkbox-checked': remember }" @click="remember = !remember">
                <span v-if="remember" class="material-symbols" style="font-size:16px;color:rgb(var(--color-primary))">check</span>
              </div>
              <span>Remember me</span>
            </label>
            <button type="submit" class="bb-connect-signin-btn" :disabled="loading">
              {{ loading ? 'SIGNING IN…' : 'SIGN IN' }}
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
      remember: true,
      loading: false,
      addressFocused: false,
      usernameFocused: false,
      passwordFocused: false,
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
    addNewServer() {
      this.address = ''
      this.username = ''
      this.password = ''
      this.focusedServerId = null
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
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgb(var(--color-primary));
  overflow: hidden;
}

.bb-connect-center {
  width: 960px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  max-height: 920px;
  overflow: hidden;
}

.bb-connect-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.bb-connect-logo {
  width: 120px;
  height: 120px;
}

.bb-connect-title {
  font-size: 42px;
  font-weight: 700;
  color: rgb(var(--color-fg));
  margin: 0;
}

.bb-connect-subtitle {
  font-size: 16px;
  color: rgb(var(--color-fg-muted));
  margin: 0;
}

.bb-connect-spacer {
  height: 40px;
  flex-shrink: 0;
}

/* Cards */
.bb-connect-card {
  width: 720px;
  background-color: rgb(var(--color-secondary));
  border-radius: 12px;
  padding: 24px 32px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-shrink: 0;
}

.bb-connect-eyebrow {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: rgb(var(--color-fg-muted));
  margin: 0;
}

/* Server rows */
.bb-connect-servers {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.bb-connect-server-row {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 48px;
  padding: 12px 16px;
  border-radius: 6px;
  border: 2px solid transparent;
  box-sizing: border-box;
}

.bb-connect-server-row-active {
  background-color: rgb(var(--color-bg));
  border-color: rgb(var(--color-accent));
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
  font-weight: 600;
  color: rgb(var(--color-fg));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bb-connect-server-address {
  font-size: 13px;
  color: rgb(var(--color-fg-muted));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bb-connect-server-remove {
  font-size: 18px;
  font-weight: 700;
  color: rgb(var(--color-fg-muted));
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  outline: none;
}

.bb-connect-add-server {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 48px;
  border: 1px dashed rgb(var(--color-border));
  border-radius: 6px;
  background: none;
  color: rgb(var(--color-fg));
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  cursor: pointer;
  outline: none;
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
  margin-bottom: 16px;
}

.bb-connect-label {
  font-size: 13px;
  font-weight: 600;
  color: rgb(var(--color-fg));
}

.bb-connect-input {
  height: 50px;
  padding: 0 16px;
  background-color: rgb(var(--color-bg));
  color: rgb(var(--color-fg));
  border: 1px solid rgb(var(--color-border));
  border-radius: 6px;
  font-family: var(--font-sans);
  font-size: 16px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s ease-out;
}

.bb-connect-input-active,
.bb-connect-input:focus {
  border-width: 2px;
  border-color: rgb(var(--color-accent));
}

.bb-connect-input-error {
  border-color: rgb(var(--color-error));
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
  margin-top: 8px;
}

.bb-connect-remember {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: rgb(var(--color-fg));
  cursor: pointer;
  user-select: none;
}

.bb-connect-checkbox {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background-color: transparent;
  border: 2px solid rgb(var(--color-border));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bb-connect-checkbox-checked {
  background-color: rgb(var(--color-accent));
  border-color: rgb(var(--color-accent));
}

.bb-connect-signin-btn {
  width: 131px;
  height: 46px;
  background-color: rgb(var(--color-accent));
  color: rgb(var(--color-primary));
  border: none;
  border-radius: 6px;
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.08em;
  cursor: pointer;
  outline: none;
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
  margin-top: 24px;
  font-size: 12px;
  color: rgb(var(--color-fg-muted));
  text-align: center;
}

.bb-connect-footer a {
  color: rgb(var(--color-accent));
  text-decoration: none;
}
</style>