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
 */
async function connectToServer(page, config = PRIMARY) {
  if (!config) throw new Error('No server config available')
  await page.goto('/connect')
  await page.waitForSelector('input[type="text"], input[placeholder*="server" i], input[placeholder*="address" i], input[id*="server" i]', { timeout: 8000 })

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

  // Wait for redirect to bookshelf — 12s; self-hosted servers can be slow but
  // we don't want one unreachable server blocking the whole suite for 20s+.
  await page.waitForURL('**/bookshelf**', { timeout: 12000 })
}

module.exports = { connectToServer, ABS_SERVER, TEST_USER, TEST_PASS, SERVER_CONFIGS, PRIMARY, FALLBACK }
