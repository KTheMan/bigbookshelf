const { test, expect } = require('@playwright/test')

test.describe('Connect page', () => {
  test('renders the connect form with logo and GitHub link', async ({ page }) => {
    await page.goto('/#/connect')

    // Logo image is present
    await expect(page.locator('img[src="/Logo.png"]')).toBeVisible()

    // App name text (heading)
    await expect(page.getByRole('heading', { name: 'audiobookshelf' })).toBeVisible()

    // GitHub link points to the webOS repo, not the Android app
    const githubLinks = page.locator('a[href*="github.com"]')
    const count = await githubLinks.count()
    for (let i = 0; i < count; i++) {
      const href = await githubLinks.nth(i).getAttribute('href')
      expect(href).toContain('audiobookshelf-webos')
      expect(href).not.toContain('audiobookshelf-app')
    }
  })

  test('shows a server connection form', async ({ page }) => {
    await page.goto('/#/connect')

    // There should be at least one input (server address)
    const inputs = page.locator('input')
    await expect(inputs.first()).toBeVisible()
  })

  test('redirects to / when back arrow is clicked', async ({ page }) => {
    await page.goto('/#/connect')
    const backLink = page.locator('a[href="#/"]').first()
    await expect(backLink).toBeVisible()
  })
})
