/**
 * Screenshot capture spec — visits key pages and saves full-page screenshots.
 * Injects data-platform="webos" so TV-specific CSS overrides apply.
 */
const { test } = require('@playwright/test')
const path = require('path')
const fs = require('fs')

const OUT = path.resolve(__dirname, '../screenshots')
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true })

async function activateTV(page) {
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-platform', 'webos')
  })
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true })
}

test('connect page', async ({ page }) => {
  await page.goto('/#/connect')
  await page.waitForLoadState('domcontentloaded')
  await activateTV(page)
  await shot(page, '01-connect')
})

test('bookshelf (unauthenticated)', async ({ page }) => {
  await page.goto('/#/bookshelf')
  await page.waitForLoadState('networkidle')
  await activateTV(page)
  await shot(page, '02-bookshelf-unauth')
})

test('bookshelf navbar tabs', async ({ page }) => {
  await page.goto('/#/bookshelf')
  await page.waitForLoadState('domcontentloaded')
  await activateTV(page)
  await page.keyboard.press('Tab')
  await shot(page, '03-bookshelf-focused-nav')
})

test('appbar focus ring', async ({ page }) => {
  await page.goto('/#/bookshelf')
  await page.waitForLoadState('domcontentloaded')
  await activateTV(page)
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await shot(page, '04-appbar-focus')
})

test('connect page — form focused', async ({ page }) => {
  await page.goto('/#/connect')
  await page.waitForLoadState('domcontentloaded')
  await activateTV(page)
  await page.keyboard.press('Tab')
  await shot(page, '05-connect-focused')
})

test('root redirect', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('domcontentloaded')
  await activateTV(page)
  await shot(page, '06-root')
})
