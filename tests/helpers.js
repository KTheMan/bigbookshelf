/**
 * Shared test helpers: connect to an ABS server and return an authenticated page.
 *
 * Two server configs are supported so the suite can be exercised against both a
 * caller-supplied server (via env vars) and the hardcoded fallback:
 *   - env config: ABS_SERVE/ABS_USE/ABS_PASS (preferred) or the longer
 *     ABS_SERVER/ABS_TEST_USER/ABS_TEST_PASS names used by CI.
 *   - fallback:   https://abs.knnygrdn.com (webos-test / webos-test)
 *
 * SERVER_CONFIGS lists every distinct config; tests that want broad coverage can
 * loop it and skip configs that aren't reachable. The single-server exports
 * (ABS_SERVER/TEST_USER/TEST_PASS, connectToServer) default to the primary
 * (env if provided, else fallback) for backwards compatibility.
 */

const FALLBACK = {
  name: 'fallback (abs.knnygrdn.com)',
  server: 'https://abs.knnygrdn.com',
  user: 'webos-test',
  pass: 'webos-test'
}

const envServer = process.env.ABS_SERVE || process.env.ABS_SERVER
const envUser = process.env.ABS_USE || process.env.ABS_TEST_USER
const envPass = process.env.ABS_PASS || process.env.ABS_TEST_PASS
const ENV_CONFIG = envServer && envUser && envPass ? { name: `env (${envServer})`, server: envServer, user: envUser, pass: envPass } : null

// Primary first; include the fallback too (deduped if the env points at it).
const SERVER_CONFIGS = ENV_CONFIG && ENV_CONFIG.server !== FALLBACK.server ? [ENV_CONFIG, FALLBACK] : [ENV_CONFIG || FALLBACK]

const PRIMARY = SERVER_CONFIGS[0]
const ABS_SERVER = PRIMARY.server
const TEST_USER = PRIMARY.user
const TEST_PASS = PRIMARY.pass

/**
 * Navigate to /connect, fill in server credentials, and wait until the bookshelf
 * loads. Defaults to the primary server config; pass a config from SERVER_CONFIGS
 * to target a specific server.
 */
async function connectToServer(page, config = PRIMARY) {
  await page.goto('/connect')
  await page.waitForSelector('input[type="text"], input[placeholder*="server" i], input[placeholder*="address" i], input[id*="server" i]', { timeout: 10000 })

  // Fill server address
  const addressInput = page.locator('input').first()
  await addressInput.fill(config.server)

  // Fill username
  const usernameInput = page.locator('input[type="text"]').nth(1).or(page.locator('input[placeholder*="user" i]')).first()
  await usernameInput.fill(config.user)

  // Fill password
  const passwordInput = page.locator('input[type="password"]')
  await passwordInput.fill(config.pass)

  // Submit
  await page.keyboard.press('Enter')

  // Wait for redirect to bookshelf
  await page.waitForURL('**/bookshelf**', { timeout: 20000 })
}

module.exports = { connectToServer, ABS_SERVER, TEST_USER, TEST_PASS, SERVER_CONFIGS, PRIMARY, FALLBACK }
