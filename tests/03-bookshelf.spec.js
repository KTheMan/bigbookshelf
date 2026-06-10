/**
 * Bookshelf / home tests.
 * These run against the pre-built dist and test the static HTML/JS.
 * They do NOT require a live server connection.
 */
const { test, expect } = require('@playwright/test')

test.describe('Bookshelf home (offline / unauthenticated)', () => {
  test('shows empty state with Connect button when not authenticated', async ({ page }) => {
    await page.goto('/bookshelf')
    // App should render the empty bookshelf state
    await page.waitForLoadState('networkidle')
    // Either a loading spinner or the empty state / connect button should be visible
    const hasConnect = (await page.locator('button, a').filter({ hasText: /connect/i }).count()) > 0
    const hasLoading = (await page.locator('.animate-spin, [class*="loading"], [class*="spinner"]').count()) > 0
    expect(hasConnect || hasLoading).toBeTruthy()
  })

  test('bookshelf navbar renders with home link', async ({ page }) => {
    await page.goto('/bookshelf')
    await page.waitForLoadState('domcontentloaded')
    // Home nav link should be present
    const homeLink = page.locator('a[href="/bookshelf"]')
    await expect(homeLink.first()).toBeVisible()
  })

  test('bookshelf page has correct page title', async ({ page }) => {
    await page.goto('/bookshelf')
    const title = await page.title()
    expect(title.toLowerCase()).toContain('audiobookshelf')
  })
})

test.describe('Bookshelf shelves layout', () => {
  test('book cards are reasonably wide for a TV viewport (≥180px)', async ({ page }) => {
    await page.goto('/bookshelf')
    await page.waitForLoadState('networkidle')

    // If there are book cards on screen, they should be wide enough for TV
    const cards = page.locator('[id^="book-card-"]')
    const count = await cards.count()
    if (count > 0) {
      const box = await cards.first().boundingBox()
      expect(box.width).toBeGreaterThanOrEqual(180)
    }
  })
})
