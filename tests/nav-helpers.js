/**
 * Reusable D-pad navigation test utilities.
 *
 * The goal is a *self-expanding* contract: rather than asserting hard-coded
 * element counts per page, these helpers express invariants that hold for any
 * TV-ready screen (every clickable region must be reachable by the remote,
 * focus must never be stranded off-screen, modals must trap focus, etc.).
 * New pages/components are covered automatically as long as they follow the
 * project's conventions.
 */

// MUST stay in sync with TVRemoteHandler.getFocusableElements()
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [data-focusable]'

/**
 * Audit the current page for "orphan" clickable regions — elements the design
 * marks as interactive (Tailwind `cursor-pointer`) that the TV remote can never
 * reach because neither they, an ancestor, nor a descendant is focusable.
 *
 * Returns an array of plain descriptors (tag/classes/text) for any orphans,
 * so a failing test prints exactly what to fix.
 */
async function findUnreachableClickables(page) {
  return page.evaluate((selector) => {
    const isVisible = (el) => {
      const s = window.getComputedStyle(el)
      if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') return false
      if (el.offsetParent === null && s.position !== 'fixed') return false
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) return false
      return r.right > 0 && r.bottom > 0 && r.left < window.innerWidth && r.top < window.innerHeight
    }

    const describe = (el) => ({
      tag: el.tagName.toLowerCase(),
      classes: (el.getAttribute('class') || '').slice(0, 120),
      text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60)
    })

    const clickables = Array.from(document.querySelectorAll('.cursor-pointer')).filter(isVisible)
    const orphans = []
    for (const el of clickables) {
      const selfOk = el.matches(selector)
      const ancestorOk = !!el.closest(selector)
      const descendantOk = !!el.querySelector(selector)
      if (!selfOk && !ancestorOk && !descendantOk) {
        orphans.push(describe(el))
      }
    }
    return orphans
  }, FOCUSABLE_SELECTOR)
}

/** Count the currently focusable elements (mirrors the handler's visibility rules). */
async function countFocusable(page) {
  return page.evaluate((selector) => {
    return Array.from(document.querySelectorAll(selector)).filter((el) => {
      const s = window.getComputedStyle(el)
      if (s.display === 'none' || s.visibility === 'hidden' || el.offsetParent === null) return false
      const r = el.getBoundingClientRect()
      return r.right > 0 && r.bottom > 0 && r.left < window.innerWidth && r.top < window.innerHeight
    }).length
  }, FOCUSABLE_SELECTOR)
}

/** Info about the currently focused element. */
async function getFocused(page) {
  return page.evaluate(() => {
    const el = document.activeElement
    if (!el || el === document.body) return null
    const r = el.getBoundingClientRect()
    return {
      tag: el.tagName.toLowerCase(),
      classes: (el.getAttribute('class') || '').slice(0, 120),
      hasFocusedClass: el.classList.contains('webos-focused'),
      rect: { top: r.top, left: r.left, bottom: r.bottom, right: r.right },
      inViewport: r.right > 0 && r.bottom > 0 && r.left < window.innerWidth && r.top < window.innerHeight
    }
  })
}

/** Dispatch a real keydown on document (matches how the handler listens). */
async function pressKey(page, key) {
  await page.evaluate((k) => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }))
  }, key)
  await page.waitForTimeout(60)
}

/** Release a key (for hold-tracking tests). */
async function releaseKey(page, key) {
  await page.evaluate((k) => {
    document.dispatchEvent(new KeyboardEvent('keyup', { key: k, bubbles: true }))
  }, key)
  await page.waitForTimeout(20)
}

/**
 * Inject a controlled grid of focusable tiles for deterministic spatial-nav
 * tests, independent of whatever the page happens to render. Returns nothing;
 * tiles have ids tile-r{row}-c{col}.
 */
async function injectFocusGrid(page, { rows = 3, cols = 3 } = {}) {
  await page.evaluate(({ rows, cols }) => {
    document.getElementById('nav-test-grid')?.remove()
    const grid = document.createElement('div')
    grid.id = 'nav-test-grid'
    grid.style.cssText = 'position:fixed;top:200px;left:200px;z-index:99999;'
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tile = document.createElement('div')
        tile.id = `tile-r${r}-c${c}`
        tile.setAttribute('data-focusable', '')
        tile.textContent = `${r},${c}`
        tile.style.cssText = `position:absolute;width:120px;height:80px;top:${r * 100}px;left:${c * 140}px;border:1px solid #888;`
        grid.appendChild(tile)
      }
    }
    document.body.appendChild(grid)
  }, { rows, cols })
}

async function removeFocusGrid(page) {
  await page.evaluate(() => document.getElementById('nav-test-grid')?.remove())
}

/** Focus a specific injected tile by row/col. */
async function focusTile(page, row, col) {
  await page.evaluate(({ row, col }) => {
    const el = document.getElementById(`tile-r${row}-c${col}`)
    if (el && window.$nuxt?.$tvRemote) window.$nuxt.$tvRemote.setFocus(el)
    else if (el) el.focus()
  }, { row, col })
  await page.waitForTimeout(40)
}

/** Best-effort server connection. Returns true if the bookshelf loaded. */
async function tryConnect(page, connectFn) {
  try {
    await connectFn(page)
    return true
  } catch (e) {
    return false
  }
}

module.exports = {
  FOCUSABLE_SELECTOR,
  findUnreachableClickables,
  countFocusable,
  getFocused,
  pressKey,
  releaseKey,
  injectFocusGrid,
  removeFocusGrid,
  focusTile,
  tryConnect
}
