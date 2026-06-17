/**
 * D-pad navigation readiness suite.
 *
 * Two tiers:
 *  1. Structural invariants — deterministic, no server required. They drive the
 *     REAL shipped TVRemoteHandler against an injected, controlled DOM so the
 *     spatial-navigation rules (move, row-edge bottom-out, hold-to-appbar) are
 *     verified without depending on live content.
 *  2. Per-route focusability audit — iterates tests/routes.js and asserts that
 *     no visible clickable region is unreachable by the remote. Self-expanding:
 *     new pages are covered by adding one line to the manifest.
 */
const { test, expect } = require('@playwright/test')
const { connectToServer, connectToFirstReachable, SERVER_CONFIGS } = require('./helpers')
const ROUTES = require('./routes')
const nav = require('./nav-helpers')

const BOOT = async (page, path, { waitForContent = false } = {}) => {
  if (waitForContent) {
    // Auth routes: use SPA navigation so auth stays in Vuex (set by connectToServer).
    // A full page.goto() would reload and re-trigger the async auth cycle, causing
    // LazyBookshelf / page components to mount before the user is in Vuex — they
    // take the "no user" early-return and never load their content.  With router.push
    // the layout stays mounted, auth is already present, and pages init correctly.
    await page.evaluate((p) => { window.$nuxt?.$router?.push(p) }, path)
    await page.waitForURL(`**${path}**`, { timeout: 5000 }).catch(() => {})
  } else {
    await page.goto(path)
    await page.waitForLoadState('load') // wait for CSS so getComputedStyle is accurate
  }
  if (waitForContent) {
    // Wait for real focusable content to appear, using the same filter as
    // countFocusable() so the trigger element is guaranteed to be counted.
    await page.waitForFunction(
      (sel) => {
        const els = Array.from(document.querySelectorAll(sel))
        return els.some((el) => {
          if (el.closest('#side-drawer-panel')) return false
          const s = window.getComputedStyle(el)
          if (s.display === 'none' || s.visibility === 'hidden') return false
          if (el.offsetParent === null) return false
          const r = el.getBoundingClientRect()
          return r.width > 0 && r.height > 0 &&
            r.right > 0 && r.bottom > 0 &&
            r.left < window.innerWidth && r.top < window.innerHeight
        })
      },
      nav.FOCUSABLE_SELECTOR,
      { timeout: 12000, polling: 200 }
    ).catch(() => {})
    // Let Vue finish any in-flight reactive updates, then set initial focus
    // the same way router.afterEach does in real usage.
    await page.waitForTimeout(100)
    await page.evaluate(() => window.$nuxt?.$tvRemote?.setInitialFocus())
  } else {
    // Let the TVRemoteHandler plugin initialize and run its initial-focus pass.
    await page.waitForTimeout(450)
  }
}

// ── Tier 1: structural invariants (no server) ──────────────────────────────

test.describe('D-pad spatial navigation (controlled DOM)', () => {
  test.beforeEach(async ({ page }) => {
    await BOOT(page, '/bookshelf')
    // Ensure the handler is present before we drive it.
    const ready = await page.evaluate(() => !!window.$nuxt?.$tvRemote)
    expect(ready, 'TVRemoteHandler should be injected as $nuxt.$tvRemote').toBe(true)
  })

  test('arrow keys move focus to the correct spatial neighbor', async ({ page }) => {
    await nav.injectFocusGrid(page, { rows: 3, cols: 3 })
    await nav.focusTile(page, 1, 1) // center

    await nav.pressKey(page, 'ArrowRight')
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('tile-r1-c2')

    await nav.pressKey(page, 'ArrowDown')
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('tile-r2-c2')

    await nav.pressKey(page, 'ArrowLeft')
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('tile-r2-c1')

    await nav.pressKey(page, 'ArrowUp')
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('tile-r1-c1')

    await nav.removeFocusGrid(page)
  })

  test('right at the row edge bottoms out (no wrap to a different row)', async ({ page }) => {
    await nav.injectFocusGrid(page, { rows: 3, cols: 3 })
    await nav.focusTile(page, 1, 2) // rightmost in middle row

    await nav.pressKey(page, 'ArrowRight')
    // Must NOT jump to tile-r0-c0 or any other row — focus stays put.
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('tile-r1-c2')

    await nav.removeFocusGrid(page)
  })

  test('left at the row edge bottoms out', async ({ page }) => {
    await nav.injectFocusGrid(page, { rows: 3, cols: 3 })
    await nav.focusTile(page, 2, 0) // leftmost in last row

    await nav.pressKey(page, 'ArrowLeft')
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('tile-r2-c0')

    await nav.removeFocusGrid(page)
  })

  test('focused element receives the webos-focused class (visible focus state)', async ({ page }) => {
    await nav.injectFocusGrid(page, { rows: 2, cols: 2 })
    await nav.focusTile(page, 0, 0)
    const focused = await nav.getFocused(page)
    expect(focused).not.toBeNull()
    expect(focused.hasFocusedClass).toBe(true)
    await nav.removeFocusGrid(page)
  })
})

// ── Tier 1b: the audit's own contract (guards the heuristic) ───────────────

test.describe('Focusability audit self-check', () => {
  test('flags a clickable element with no focusable self/ancestor/descendant', async ({ page }) => {
    await BOOT(page, '/bookshelf')
    await page.evaluate(() => {
      const d = document.createElement('div')
      d.id = 'orphan-clickable'
      d.className = 'cursor-pointer'
      d.textContent = 'orphan'
      d.style.cssText = 'position:fixed;top:300px;left:300px;width:100px;height:40px;z-index:99999;'
      document.body.appendChild(d)
    })
    const orphans = await nav.findUnreachableClickables(page)
    expect(orphans.some((o) => o.text === 'orphan')).toBe(true)
    await page.evaluate(() => document.getElementById('orphan-clickable')?.remove())
  })

  test('does NOT flag a clickable element that is itself focusable', async ({ page }) => {
    await BOOT(page, '/bookshelf')
    await page.evaluate(() => {
      const d = document.createElement('div')
      d.id = 'ok-clickable'
      d.className = 'cursor-pointer'
      d.setAttribute('data-focusable', '')
      d.textContent = 'reachable'
      d.style.cssText = 'position:fixed;top:340px;left:300px;width:100px;height:40px;z-index:99999;'
      document.body.appendChild(d)
    })
    const orphans = await nav.findUnreachableClickables(page)
    expect(orphans.some((o) => o.text === 'reachable')).toBe(false)
    await page.evaluate(() => document.getElementById('ok-clickable')?.remove())
  })
})

// ── Tier 2: per-route focusability audit (best-effort server) ──────────────

test.describe('Per-route focusability audit', () => {
  let connected = false
  let workingConfig = null

  test.beforeAll(async ({ browser }) => {
    workingConfig = await connectToFirstReachable(browser)
    connected = workingConfig !== null
  })

  for (const route of ROUTES) {
    test(`${route.name} (${route.path}) — every clickable region is remote-reachable`, async ({ page }) => {
      if (route.auth && !connected) {
        test.skip(true, 'No server connection available for auth-gated route')
      }
      if (route.auth) {
        const ok = await nav.tryConnect(page, (p) => connectToServer(p, workingConfig))
        if (!ok) test.skip(true, 'Server connection failed in this test instance')
      }

      await BOOT(page, route.path, { waitForContent: !!route.auth })

      const orphans = await nav.findUnreachableClickables(page)
      expect(
        orphans,
        `Unreachable clickable regions on ${route.path}:\n` +
          orphans.map((o) => `  <${o.tag} class="${o.classes}"> "${o.text}"`).join('\n')
      ).toEqual([])
    })

    test(`${route.name} (${route.path}) — has focusable content and sets initial focus`, async ({ page }) => {
      if (route.auth && !connected) {
        test.skip(true, 'No server connection available for auth-gated route')
      }
      if (route.auth) {
        const ok = await nav.tryConnect(page, (p) => connectToServer(p, workingConfig))
        if (!ok) test.skip(true, 'Server connection failed in this test instance')
      }

      await BOOT(page, route.path, { waitForContent: !!route.auth })

      const count = await nav.countFocusable(page)

      // Some routes (e.g. collections, playlists) may be empty on the test account.
      // Mark them mayBeEmpty: true in routes.js to allow a graceful empty state.
      if (route.mayBeEmpty && count === 0) {
        test.skip(true, `${route.name} appears empty on this server — skipping focusability check`)
        return
      }

      expect(count).toBeGreaterThanOrEqual(route.minFocusable || 1)

      // The plugin's router.afterEach should have placed focus on visible content.
      const focused = await nav.getFocused(page)
      expect(focused, 'an element should be focused after load').not.toBeNull()
      expect(focused.inViewport, 'initial focus must be on a visible element').toBe(true)
    })
  }
})

// ── Tier 3: multi-server audit (all configured servers) ───────────────────
// Exercises the focusability audit against every server in SERVER_CONFIGS so
// collection / series / ebook-bearing screens are checked on each. Configs
// that aren't reachable from the runner are skipped, not failed. When no
// servers are configured (CI with no secrets) the loop body never executes.

const KEY_AUTH_ROUTES = [
  { path: '/bookshelf/library', name: 'Library' },
  { path: '/bookshelf/collections', name: 'Collections' },
  { path: '/bookshelf/series', name: 'Series' }
]

for (const config of SERVER_CONFIGS) {
  test.describe(`Multi-server audit — ${config.name}`, () => {
    let connected = false

    test.beforeAll(async ({ browser }) => {
      const page = await browser.newPage()
      connected = await nav.tryConnect(page, (p) => connectToServer(p, config))
      await page.close()
    })

    for (const route of KEY_AUTH_ROUTES) {
      test(`${route.name} (${route.path}) — every clickable region is remote-reachable`, async ({ page }) => {
        if (!connected) test.skip(true, `Server ${config.name} not reachable`)
        const ok = await nav.tryConnect(page, (p) => connectToServer(p, config))
        if (!ok) test.skip(true, `Server ${config.name} connection failed in this test instance`)

        await BOOT(page, route.path)

        const orphans = await nav.findUnreachableClickables(page)
        expect(
          orphans,
          `Unreachable clickable regions on ${route.path} @ ${config.name}:\n` +
            orphans.map((o) => `  <${o.tag} class="${o.classes}"> "${o.text}"`).join('\n')
        ).toEqual([])
      })
    }
  })
}
