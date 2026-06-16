/**
 * Shared test helpers: connect to an ABS server and return an authenticated page.
 *
 * Up to three server configs are supported, all via environment variables:
 *   ABS_SERVE / ABS_USE / ABS_PASS       — primary server
 *   ABS1_SERVE / ABS1_USE / ABS1_PASS    — secondary server (optional)
 *   fallback: abs.knnygrdn.com            — local dev only (suppressed in CI)
 *
 * SERVER_CONFIGS lists every distinct, reachable config. Tests that want broad
 * coverage loop it and skip configs that aren't reachable from the runner.
 */

const mkConfig = (server, user, pass, label) =>
  server && user && pass ? { name: `${label} (${server})`, server, user, pass } : null

// Hardcoded fallback is only used in non-CI local dev. In CI, runner IPs are
// blocked by self-hosted servers so we rely solely on secrets.
const FALLBACK = process.env.CI
  ? null
  : mkConfig('https://abs.knnygrdn.com', 'webos-test', 'webos-test', 'fallback')

const ENV_CONFIG  = mkConfig(
  process.env.ABS_SERVE  || process.env.ABS_SERVER,
  process.env.ABS_USE    || process.env.ABS_TEST_USER,
  process.env.ABS_PASS   || process.env.ABS_TEST_PASS,
  'primary'
)
const ENV1_CONFIG = mkConfig(
  process.env.ABS1_SERVE,
  process.env.ABS1_USE,
  process.env.ABS1_PASS,
  'secondary'
)

// Deduplicate by server URL; order: primary → secondary → fallback.
const seen = new Set()
const SERVER_CONFIGS = [ENV_CONFIG, ENV1_CONFIG, FALLBACK].filter((c) => {
  if (!c) return false
  if (seen.has(c.server)) return false
  seen.add(c.server)
  return true
})

// PRIMARY is null when no server is configured — callers must check before using.
const PRIMARY = SERVER_CONFIGS[0] || null
const ABS_SERVER = PRIMARY?.server || null
const TEST_USER  = PRIMARY?.user   || null
const TEST_PASS  = PRIMARY?.pass   || null

/**
 * Navigate to /connect, fill in server credentials, and wait until the bookshelf
 * loads. Defaults to the primary server config; pass a config from SERVER_CONFIGS
 * to target a specific server.
 *
 * The connect form is two-step:
 *   Step 1 — server URL input (type="url"); submitting calls /status on the server.
 *   Step 2 — username + password; submitting calls /login.
 * The form is also gated behind an async v-if="deviceData" and may auto-authenticate
 * using a stored token (redirecting straight to /bookshelf without showing the form).
 */
async function connectToServer(page, config = PRIMARY) {
  if (!config) throw new Error('No server config available')
  await page.goto('/connect')
  await page.waitForLoadState('domcontentloaded')

  // If a valid session token is stored from a prior run the app auto-authenticates
  // (ping → /api/authorize → redirect) without showing the form. Give it up to 8s.
  const autoRedirected = await page.waitForURL('**/bookshelf**', { timeout: 8000 })
    .then(() => true)
    .catch(() => false)
  if (autoRedirected) return

  // No auto-redirect — we need to use the form. Wait for the form card (rendered
  // after the async deviceData load completes).
  await page.waitForSelector('.bg-primary', { timeout: 5000 })

  // The form may be in "server list" mode (saved configs present but auto-auth
  // failed) instead of showing the URL input directly. In that case click the
  // "Add New Server" button to get to Step 1.
  const urlInput = page.locator('input[type="url"]')
  if (!(await urlInput.isVisible().catch(() => false))) {
    await page.locator('button').filter({ hasText: /add.new.server/i }).click()
    await urlInput.waitFor({ state: 'visible', timeout: 5000 })
  }

  // Step 1: submit server address; the form calls /status on the server.
  await urlInput.fill(config.server)
  await urlInput.press('Enter')

  // Step 2: wait for credentials form (password field signals step 2 is active).
  await page.waitForSelector('input[type="password"]', { timeout: 15000 })

  // Username input has no explicit type attribute (defaults to text).
  await page.locator('input:not([type="password"]):not([type="url"])').first().fill(config.user)
  await page.locator('input[type="password"]').fill(config.pass)
  await page.locator('input[type="password"]').press('Enter')

  // Wait for successful login redirect to bookshelf.
  await page.waitForURL('**/bookshelf**', { timeout: 20000 })
}

/**
 * Try each SERVER_CONFIG in order and return the first one that successfully
 * connects, or null if all fail. Opens a fresh page per attempt so stale SPA
 * state from a failed login doesn't block the next server's connect form.
 */
async function connectToFirstReachable(browser) {
  for (const config of SERVER_CONFIGS) {
    const page = await browser.newPage()
    try {
      await connectToServer(page, config)
      console.log(`[connectToFirstReachable] connected to ${config.name}`)
      await page.close()
      return config
    } catch (e) {
      console.log(`[connectToFirstReachable] ${config.name} failed: ${e.message?.split('\n')[0]}`)
      await page.close()
    }
  }
  console.log('[connectToFirstReachable] all servers unreachable')
  return null
}

module.exports = { connectToServer, connectToFirstReachable, ABS_SERVER, TEST_USER, TEST_PASS, SERVER_CONFIGS, PRIMARY, FALLBACK }
