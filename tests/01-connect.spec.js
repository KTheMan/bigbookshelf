const { test, expect } = require('@playwright/test')

test.describe('Connect page', () => {
  test('renders the connect form with logo and GitHub link', async ({ page }) => {
    await page.goto('/#/connect')

    await expect(page.getByRole('heading', { name: 'Bigbookshelf' })).toBeVisible()
    await expect(page.locator('.bb-connect-logo svg')).toBeVisible()

    const githubLinks = page.locator('a[href*="github.com"]')
    const count = await githubLinks.count()
    for (let i = 0; i < count; i++) {
      const href = await githubLinks.nth(i).getAttribute('href')
      expect(href).not.toContain('audiobookshelf-app')
    }
  })

  test('shows a server connection form', async ({ page }) => {
    await page.goto('/#/connect')

    await expect(page.locator('#connect-address')).toBeVisible()
    await expect(page.locator('#connect-username')).toBeVisible()
    await expect(page.locator('#connect-password')).toBeVisible()
  })

  test('dpad hover on text fields does not focus the native input', async ({ page }) => {
    await page.goto('/#/connect')
    await page.waitForTimeout(450)

    await page.keyboard.press('ArrowDown')

    const active = await page.evaluate(() => ({
      tag: document.activeElement?.tagName,
      id: document.activeElement?.id || '',
      proxyFocused: document.activeElement?.matches('[data-tv-input-control]') || false
    }))
    expect(active.tag).toBe('DIV')
    expect(active.id).toBe('')
    expect(active.proxyFocused).toBe(true)
  })

  test('enter on a focused text field explicitly enters edit mode', async ({ page }) => {
    await page.goto('/#/connect')
    await page.waitForTimeout(450)

    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')

    await expect(page.locator('#connect-address')).toBeFocused()
    await page.keyboard.type('http://example.test:13378')
    await expect(page.locator('#connect-address')).toHaveValue('http://example.test:13378')
  })

  test('dpad focus selects saved servers and populates the form', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'device',
        JSON.stringify({
          serverConnectionConfigs: [
            { id: 'server-a', name: 'Studio', address: 'http://studio.local:13378', username: 'kenny' },
            { id: 'server-b', name: 'Cabin', address: 'https://cabin.example.com', username: 'guest' }
          ],
          lastServerConnectionConfigId: 'server-a',
          currentLocalPlaybackSession: null,
          deviceSettings: {}
        })
      )
    })

    await page.goto('/#/connect')
    await page.waitForTimeout(450)

    await expect(page.locator('#connect-address')).toHaveValue('http://studio.local:13378')
    await expect(page.locator('.bb-connect-server-row').first()).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('.bb-connect-server-remove').first()).toBeVisible()
    await expect(page.locator('.bb-connect-server-remove').first()).toHaveAttribute('data-tv-skip', '')
    await page.keyboard.press('ArrowDown')

    await expect(page.locator('#connect-address')).toHaveValue('https://cabin.example.com')
    await expect(page.locator('.bb-connect-server-row').nth(1)).toHaveAttribute('aria-pressed', 'true')
    const active = await page.evaluate(() => ({
      tag: document.activeElement?.tagName,
      row: document.activeElement?.classList.contains('bb-connect-server-row') || false,
      input: document.activeElement?.matches('input') || false
    }))
    expect(active.tag).toBe('LI')
    expect(active.row).toBe(true)
    expect(active.input).toBe(false)
  })
})
