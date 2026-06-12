/**
 * Shared test helpers: connect to the ABS test server and return an authenticated page.
 */

const ABS_SERVER = process.env.ABS_SERVER || 'https://abs.knnygrdn.com'
const TEST_USER = process.env.ABS_TEST_USER || 'webos-test'
const TEST_PASS = process.env.ABS_TEST_PASS || 'webos-test'

/**
 * Navigate to /connect, fill in server credentials, and wait until the bookshelf loads.
 */
async function connectToServer(page) {
  await page.goto('/connect')
  await page.waitForSelector('input[type="text"], input[placeholder*="server" i], input[placeholder*="address" i], input[id*="server" i]', { timeout: 10000 })

  // Fill server address
  const addressInput = page.locator('input').first()
  await addressInput.fill(ABS_SERVER)

  // Fill username
  const usernameInput = page.locator('input[type="text"]').nth(1).or(page.locator('input[placeholder*="user" i]')).first()
  await usernameInput.fill(TEST_USER)

  // Fill password
  const passwordInput = page.locator('input[type="password"]')
  await passwordInput.fill(TEST_PASS)

  // Submit
  await page.keyboard.press('Enter')

  // Wait for redirect to bookshelf
  await page.waitForURL('**/bookshelf**', { timeout: 20000 })
}

module.exports = { connectToServer, ABS_SERVER, TEST_USER, TEST_PASS }
