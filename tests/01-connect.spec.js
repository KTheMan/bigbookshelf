const { test, expect } = require('@playwright/test')

const SERVER = 'http://studio.local:13378'

async function mockAudiobookshelf(page) {
  const library = {
    id: 'lib-1',
    name: 'Audiobooks',
    mediaType: 'book',
    settings: { coverAspectRatio: 1 }
  }
  const authPayload = {
    user: {
      id: 'user-1',
      username: 'kenny',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      librariesAccessible: ['lib-1'],
      mediaProgress: [],
      bookmarks: [],
      permissions: {}
    },
    userDefaultLibraryId: 'lib-1',
    serverSettings: { version: '2.26.0', language: 'en-us' },
    ereaderDevices: []
  }

  await page.route('**/login', async (route) => {
    expect(route.request().headers()['x-return-tokens']).toBe('true')
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(authPayload) })
  })

  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url())
    if (url.pathname === '/api/authorize') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...authPayload,
          user: {
            ...authPayload.user,
            accessToken: undefined,
            refreshToken: undefined
          }
        })
      })
      return
    }
    if (url.pathname === '/api/libraries') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ libraries: [library] }) })
      return
    }
    if (url.pathname === '/api/libraries/lib-1' && url.searchParams.get('include') === 'filterdata') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          library,
          filterdata: { authors: [], genres: [], narrators: [], series: [], tags: [], languages: [], progress: [] },
          issues: 0,
          numUserPlaylists: 0
        })
      })
      return
    }
    if (url.pathname === '/api/libraries/lib-1/personalized') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
      return
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
  })
}

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
    await expect(page.locator('.bb-connect-save-toggle')).toHaveAttribute('aria-checked', 'true')
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

  test('auto-resumes the previously active saved session', async ({ page }) => {
    await mockAudiobookshelf(page)
    await page.addInitScript((server) => {
      window.localStorage.setItem(
        'device',
        JSON.stringify({
          serverConnectionConfigs: [
            { id: 'server-a', name: 'Studio', address: server, username: 'kenny', token: 'saved-token' }
          ],
          lastServerConnectionConfigId: 'server-a',
          currentLocalPlaybackSession: null,
          deviceSettings: {}
        })
      )
    }, SERVER)

    await page.goto('/#/connect')
    await expect(page).toHaveURL(/#\/bookshelf/, { timeout: 12000 })

    await expect(page.locator('#appbar')).toBeVisible()
    const device = await page.evaluate(() => {
      const raw = window.localStorage.getItem('device')
      return raw ? JSON.parse(raw) : { serverConnectionConfigs: [], lastServerConnectionConfigId: null }
    })
    expect(device.lastServerConnectionConfigId).toBe('server-a')
  })

  test('manual sign-in saves credentials when the checkbox is enabled', async ({ page }) => {
    await mockAudiobookshelf(page)
    await page.goto('/#/connect')

    await page.locator('#connect-address').fill(SERVER)
    await page.locator('#connect-username').fill('kenny')
    await page.locator('#connect-password').fill('secret')
    await expect(page.locator('.bb-connect-save-toggle')).toHaveAttribute('aria-checked', 'true')
    await page.locator('.bb-connect-signin-btn').click()

    await expect(page).toHaveURL(/#\/bookshelf/, { timeout: 12000 })
    const saved = await page.evaluate(() => {
      const device = JSON.parse(window.localStorage.getItem('device'))
      const config = device.serverConnectionConfigs[0]
      return {
        config,
        refreshToken: window.localStorage.getItem(`refresh_token_${config.id}`)
      }
    })
    expect(saved.config.address).toBe(SERVER)
    expect(saved.config.username).toBe('kenny')
    expect(saved.config.token).toBe('access-token')
    expect(saved.refreshToken).toBe('refresh-token')
  })

  test('manual sign-in can skip saving credentials', async ({ page }) => {
    await mockAudiobookshelf(page)
    await page.goto('/#/connect')

    await page.locator('#connect-address').fill(SERVER)
    await page.locator('#connect-username').fill('kenny')
    await page.locator('#connect-password').fill('secret')
    await page.locator('.bb-connect-save-toggle').click()
    await expect(page.locator('.bb-connect-save-toggle')).toHaveAttribute('aria-checked', 'false')
    await page.locator('.bb-connect-signin-btn').click()

    await expect(page).toHaveURL(/#\/bookshelf/, { timeout: 12000 })
    const device = await page.evaluate(() => {
      const raw = window.localStorage.getItem('device')
      return raw ? JSON.parse(raw) : { serverConnectionConfigs: [], lastServerConnectionConfigId: null }
    })
    expect(device.serverConnectionConfigs).toEqual([])
    expect(device.lastServerConnectionConfigId).toBeNull()
  })
})
