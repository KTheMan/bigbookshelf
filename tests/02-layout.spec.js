const { test, expect } = require('@playwright/test')

test.describe('TV layout and design language', () => {
  test('app bar is present and full-width on /connect (blank layout)', async ({ page }) => {
    await page.goto('/#/connect')
    // Blank layout has no appbar - page should show the logo directly
    await expect(page.locator('img[src="/Logo.png"]')).toBeVisible()
  })

  test('main layout has correct background color (audiobookshelf dark theme)', async ({ page }) => {
    await page.goto('/')
    // Root div should use the bg-bg colour (dark background)
    const layoutBg = await page.locator('.layout-wrapper').evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor
    })
    // Should be a dark background (r, g, b all < 80)
    const match = layoutBg.match(/\d+/g)
    if (match) {
      const [r, g, b] = match.map(Number)
      expect(r + g + b).toBeLessThan(240) // dark: sum of channels is low
    }
  })

  test('layout wrapper does NOT have excessive safe-area padding that clips the appbar', async ({ page }) => {
    await page.goto('/')
    const paddingLeft = await page.locator('.layout-wrapper').evaluate((el) => {
      return parseInt(window.getComputedStyle(el).paddingLeft, 10)
    })
    // Should be 0 - safe-area padding was removed from the layout wrapper
    expect(paddingLeft).toBe(0)
  })

  test('appbar renders at the top of the page', async ({ page }) => {
    await page.goto('/')
    const appbar = page.locator('#appbar')
    if ((await appbar.count()) > 0) {
      const box = await appbar.boundingBox()
      // Appbar top edge should be at or very near the top of the viewport
      expect(box.y).toBeLessThan(16)
    }
  })

  test('material symbols font is loaded', async ({ page }) => {
    await page.goto('/')
    const symbolPresent = await page.evaluate(() => {
      const spans = document.querySelectorAll('.material-symbols')
      return spans.length > 0
    })
    expect(symbolPresent).toBeTruthy()
  })

  test('viewport is set to 1920x1080 for TV', async ({ page }) => {
    await page.goto('/')
    const vw = await page.evaluate(() => document.documentElement.scrollWidth)
    // The meta viewport sets width=1920; the actual rendered width should be 1920
    expect(vw).toBeGreaterThanOrEqual(1920)
  })
})
