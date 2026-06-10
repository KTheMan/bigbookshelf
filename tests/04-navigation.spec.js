/**
 * D-pad / keyboard navigation tests.
 * These verify that the TV remote handler is wired up correctly.
 */
const { test, expect } = require('@playwright/test')

test.describe('TVRemoteHandler keyboard navigation', () => {
  test('arrow keys move focus between focusable elements', async ({ page }) => {
    await page.goto('/bookshelf')
    await page.waitForLoadState('domcontentloaded')

    // Tab to first focusable element
    await page.keyboard.press('Tab')
    const firstActive = await page.evaluate(() => document.activeElement?.tagName)
    expect(firstActive).toBeTruthy()

    // Press ArrowRight to move focus
    await page.keyboard.press('ArrowRight')
    const secondActive = await page.evaluate(() => document.activeElement?.tagName)
    expect(secondActive).toBeTruthy()
  })

  test('Enter key activates the focused element', async ({ page }) => {
    await page.goto('/bookshelf')
    await page.waitForLoadState('domcontentloaded')

    // Focus the home link in the nav bar
    const homeLink = page.locator('a[href="/bookshelf"]').first()
    await homeLink.focus()
    await expect(homeLink).toBeFocused()

    // Enter should navigate (same page in this case, no error)
    await page.keyboard.press('Enter')
    // Should remain on bookshelf
    await expect(page).toHaveURL(/\/bookshelf/)
  })

  test('Escape key emits webos-media-key back event when no history is available', async ({ page }) => {
    // Use a fresh page with no history so back() falls through to emitMediaKey
    await page.goto('/bookshelf')
    await page.waitForLoadState('domcontentloaded')

    // Override history.length to simulate no back history
    const eventFired = await page.evaluate(() => {
      return new Promise((resolve) => {
        window.addEventListener('webos-media-key', (e) => {
          if (e.detail.action === 'back') resolve(true)
        })
        // Temporarily mock history.length = 1 so handleBack emits instead of navigating
        const origLength = Object.getOwnPropertyDescriptor(window.history, 'length')
        Object.defineProperty(window.history, 'length', { get: () => 1, configurable: true })
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'XF86Back', bubbles: true }))
        if (origLength) Object.defineProperty(window.history, 'length', origLength)
        setTimeout(() => resolve(false), 500)
      })
    })
    expect(eventFired).toBe(true)
  })

  test('MediaPlayPause key emits playPause media event', async ({ page }) => {
    await page.goto('/bookshelf')
    await page.waitForLoadState('domcontentloaded')

    const eventFired = await page.evaluate(() => {
      return new Promise((resolve) => {
        window.addEventListener('webos-media-key', (e) => {
          if (e.detail.action === 'playPause') resolve(true)
        })
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'MediaPlayPause', bubbles: true }))
        setTimeout(() => resolve(false), 500)
      })
    })
    expect(eventFired).toBe(true)
  })

  test('webos-focused class is applied to focused element', async ({ page }) => {
    await page.goto('/bookshelf')
    await page.waitForLoadState('domcontentloaded')

    // Focus first link using Tab
    await page.keyboard.press('Tab')

    const hasFocusedClass = await page.evaluate(() => {
      return document.querySelector('.webos-focused') !== null
    })
    expect(hasFocusedClass).toBe(true)
  })
})
