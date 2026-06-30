import Vue from 'vue'

class TVRemoteHandler {
  constructor() {
    this.handlers = new Map()
    this.focusedElement = null
    this.focusTrapStack = []
    this.enabled = true
    this.DEBUG = false
    // Key-hold tracking (event.repeat not reliable on webOS 3 / Chromium 38)
    this._heldKeys = new Set()
    this._upHoldTimer = null
    this._tizenKeysRegistered = false
  }

  log(...args) {
    if (this.DEBUG) console.log('[TVRemote]', ...args)
  }

  init() {
    this.registerTizenRemoteKeys()
    this._keydownHandler = this.handleKeydown.bind(this)
    this._keyupHandler = this.handleKeyup.bind(this)
    this._focusinHandler = this.handleFocusin.bind(this)
    document.addEventListener('keydown', this._keydownHandler)
    document.addEventListener('keyup', this._keyupHandler)
    document.addEventListener('focusin', this._focusinHandler)
    this.log('Initialized')
  }

  registerTizenRemoteKeys() {
    if (this._tizenKeysRegistered || typeof window === 'undefined') return
    const inputDevice = window.tizen?.tvinputdevice
    if (!inputDevice) return

    const keys = [
      'MediaPlayPause',
      'MediaPlay',
      'MediaPause',
      'MediaStop',
      'MediaFastForward',
      'MediaRewind',
      'MediaTrackNext',
      'MediaTrackPrevious',
      'ColorF0Red',
      'ColorF1Green',
      'ColorF2Yellow',
      'ColorF3Blue',
      'ChannelUp',
      'ChannelDown'
    ]

    try {
      if (typeof inputDevice.registerKeyBatch === 'function') {
        inputDevice.registerKeyBatch(keys)
      } else if (typeof inputDevice.registerKey === 'function') {
        keys.forEach((keyName) => inputDevice.registerKey(keyName))
      }
      this._tizenKeysRegistered = true
    } catch (error) {
      console.warn('[TVRemote] Failed to register Tizen remote keys', error)
    }
  }

  destroy() {
    document.removeEventListener('keydown', this._keydownHandler)
    document.removeEventListener('keyup', this._keyupHandler)
    document.removeEventListener('focusin', this._focusinHandler)
    this.handlers.clear()
  }

  handleFocusin(event) {
    const el = event.target
    if (!el || el === this.focusedElement) return
    // If the drawer is open and focus escapes it (e.g. via Tab), close the drawer
    const store = window.$nuxt?.$store
    if (store?.state.showSideDrawer) {
      const panel = document.getElementById('side-drawer-panel')
      if (panel && !panel.contains(el)) {
        store.commit('setShowSideDrawer', false)
      }
    }
    // Keep webos-focused in sync with native browser focus
    el.classList.add('webos-focused')
    document.querySelectorAll('.webos-focused').forEach((prev) => {
      if (prev !== el) prev.classList.remove('webos-focused')
    })
    this.focusedElement = el
  }

  handleKeydown(event) {
    if (!this.enabled) return
    const key = event.key && event.key !== 'Unidentified' ? event.key : event.keyCode

    this.log('Keydown:', key)

    const isHeld = this._heldKeys.has(key)

    switch (key) {
      case 'ArrowUp':
      case 'Up':
      case 38:
        event.preventDefault()
        if (!isHeld) {
          this._heldKeys.add(key)
          // 3-second hold on Up → jump to the appbar toolbar
          this._upHoldTimer = setTimeout(() => {
            this._upHoldTimer = null
            this._focusAppbar()
          }, 3000)
          this.navigateFocus('up')
        } else {
          // Key held down: scroll content instead of jumping between elements
          this._scrollInDirection('up')
        }
        break
      case 'ArrowDown':
      case 'Down':
      case 40:
        event.preventDefault()
        if (!isHeld) {
          this._heldKeys.add(key)
          this.navigateFocus('down')
        } else {
          this._scrollInDirection('down')
        }
        break
      case 'ArrowLeft':
      case 'Left':
      case 37:
        event.preventDefault()
        this.navigateFocus('left')
        break
      case 'ArrowRight':
      case 'Right':
      case 39:
        event.preventDefault()
        this.navigateFocus('right')
        break
      case 'Enter':
      case 13:
        event.preventDefault()
        this.activateFocused()
        break
      case 'Escape':
      case 'Back':
      case 'XF86Back':
      case 8:
      case 461:
      case 10009:
        event.preventDefault()
        this.handleBack()
        break
      case 'MediaPlayPause':
      case 'PlayPause':
      case 10252:
        event.preventDefault()
        this.emitMediaKey('playPause')
        break
      case 'MediaTrackNext':
      case 'MediaFastForward':
      case 'XF86AudioNext':
      case 417:
      case 10233:
        event.preventDefault()
        this.emitMediaKey('next')
        break
      case 'MediaTrackPrevious':
      case 'MediaRewind':
      case 'XF86AudioPrev':
      case 412:
      case 10232:
        event.preventDefault()
        this.emitMediaKey('previous')
        break
      case 'ColorRed':
      case 'Red':
      case 'ColorF0Red':
      case 403:
        this.emitColorKey('red')
        break
      case 'ColorGreen':
      case 'Green':
      case 'ColorF1Green':
      case 404:
        this.emitColorKey('green')
        break
      case 'ColorYellow':
      case 'Yellow':
      case 'ColorF2Yellow':
      case 405:
        this.emitColorKey('yellow')
        break
      case 'ColorBlue':
      case 'Blue':
      case 'ColorF3Blue':
      case 406:
        this.emitColorKey('blue')
        break
      case 'ChannelUp':
      case 427:
        event.preventDefault()
        this.emitMediaKey('seekForward')
        break
      case 'ChannelDown':
      case 428:
        event.preventDefault()
        this.emitMediaKey('seekBackward')
        break
      case 'Play':
      case 'MediaPlay':
      case 415:
        event.preventDefault()
        this.emitMediaKey('playPause')
        break
      case 'Pause':
      case 'MediaPause':
      case 19:
        event.preventDefault()
        this.emitMediaKey('pause')
        break
      case 'Stop':
      case 'MediaStop':
      case 413:
        event.preventDefault()
        this.emitMediaKey('stop')
        break
    }
  }

  handleKeyup(event) {
    const key = event.key && event.key !== 'Unidentified' ? event.key : event.keyCode
    this._heldKeys.delete(key)
    if (key === 'ArrowUp' || key === 'Up' || key === 38) {
      if (this._upHoldTimer) {
        clearTimeout(this._upHoldTimer)
        this._upHoldTimer = null
      }
    }
  }

  navigateFocus(direction) {
    const store = window.$nuxt?.$store
    const drawerOpen = store?.state.showSideDrawer

    // Drawer is on the right side — pressing Left while it's open closes it
    if (drawerOpen && direction === 'left') {
      store.commit('setShowSideDrawer', false)
      return
    }

    // Focus trap: while the drawer is open only navigate among drawer elements
    const root = drawerOpen ? document.getElementById('side-drawer-panel') : null

    const current = this.getFocusedElement()
    const onScreen = this.getFocusableElements(root)
    if (!current) {
      if (onScreen.length) this.setFocus(onScreen[0])
      else if (drawerOpen) store.commit('setShowSideDrawer', false)
      return
    }

    const appbar = document.getElementById('appbar')
    const currentInAppbar = appbar && appbar.contains(current)
    // On a single Up press, don't jump from content into the appbar while there
    // is still scroll room above — let Up scroll first and reach the appbar only
    // once the content is topped out.
    const blockAppbar = (el) => {
      if (currentInAppbar || direction !== 'up' || !appbar || !appbar.contains(el)) return false
      const scrollable = this._findScrollableParent(current) || document.scrollingElement || document.documentElement
      return scrollable && scrollable.scrollTop > 0
    }
    const filterPool = (pool) => pool.filter((el) => el !== current && !blockAppbar(el))

    let best = this._pickInDirection(current, direction, filterPool(onScreen))
    if (!best) {
      // Nothing on-screen in this direction — consider items just outside the
      // viewport so focus MOVES to the next item (which setFocus then pulls fully
      // into view) instead of blindly scrolling the whole container. Restrict
      // this to the SAME lane (aligned row/column) so we continue along a list or
      // shelf but never wrap to an unrelated row when a row simply ends.
      const offScreen = this.getFocusableElements(root, true)
      best = this._pickInDirection(current, direction, filterPool(offScreen))
    }

    if (best) this.setFocus(best)
    else this._scrollInDirection(direction)
  }

  // Spatial pick following TV conventions:
  //   • left/right stay within the current ROW (require vertical overlap), so a
  //     row bottoms out at its edge instead of wrapping to an unrelated element.
  //   • up/down move BETWEEN rows (no horizontal-overlap requirement) and pick
  //     the nearest, best-aligned target.
  // The along-axis edge gate uses a tolerance scaled to the focused element so a
  // neighbour is never dropped just because the focused item grew via scale().
  _pickInDirection(current, direction, pool) {
    const cur = current.getBoundingClientRect()
    const curCx = (cur.left + cur.right) / 2
    const curCy = (cur.top + cur.bottom) / 2
    const tolX = Math.max(8, Math.min(cur.width * 0.5, 48))
    const tolY = Math.max(8, Math.min(cur.height * 0.5, 48))
    let best = null
    let bestScore = Infinity
    for (const el of pool) {
      const r = el.getBoundingClientRect()
      const cx = (r.left + r.right) / 2
      const cy = (r.top + r.bottom) / 2
      const vOverlap = Math.min(r.bottom, cur.bottom) - Math.max(r.top, cur.top) > 0
      const hOverlap = Math.min(r.right, cur.right) - Math.max(r.left, cur.left) > 0
      let forward
      let cross
      switch (direction) {
        case 'right':
          if (!(r.left >= cur.right - tolX && cx > curCx && vOverlap)) continue
          forward = Math.max(r.left - cur.right, 0)
          cross = Math.abs(cy - curCy)
          break
        case 'left':
          if (!(r.right <= cur.left + tolX && cx < curCx && vOverlap)) continue
          forward = Math.max(cur.left - r.right, 0)
          cross = Math.abs(cy - curCy)
          break
        case 'down':
          if (!(r.top >= cur.bottom - tolY && cy > curCy)) continue
          forward = Math.max(r.top - cur.bottom, 0)
          cross = Math.abs(cx - curCx) * (hOverlap ? 1 : 1.5)
          break
        default: // up
          if (!(r.bottom <= cur.top + tolY && cy < curCy)) continue
          forward = Math.max(cur.top - r.bottom, 0)
          cross = Math.abs(cx - curCx) * (hOverlap ? 1 : 1.5)
          break
      }
      // Along-axis gap dominates; cross-axis misalignment breaks ties.
      const score = forward + cross
      if (score < bestScore) {
        bestScore = score
        best = el
      }
    }
    return best
  }

  getFocusableElements(root, includeOffscreen = false) {
    let container = root || document
    // Auto-scope to an open modal overlay so D-pad can't escape to background content
    if (!root) {
      const openModal = Array.from(document.querySelectorAll('.modal')).find((m) => {
        const s = window.getComputedStyle(m)
        return s.opacity !== '0' && s.display !== 'none' && s.visibility !== 'hidden'
      })
      if (openModal) container = openModal
    }
    return Array.from(
      container.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [data-focusable]'
      )
    ).filter((el) => {
      // The side drawer is a layout-level overlay that is ALWAYS in the DOM
      // (translated off-screen when closed). Unless we're explicitly scoped to
      // it (root === the panel), never let global navigation or initial-focus
      // land inside it — otherwise focus gets stranded on a hidden drawer link
      // after it closes and the panel reads as "stuck open".
      if (!root && el.closest('#side-drawer-panel')) return false
      const style = window.getComputedStyle(el)
      if (style.display === 'none' || style.visibility === 'hidden' || el.offsetParent === null) return false
      const rect = el.getBoundingClientRect()
      // Skip zero-area elements (e.g. empty connection / download indicators)
      if (rect.width <= 0 || rect.height <= 0) return false
      // Exclude elements translated off-screen (e.g. closed drawer sliding right)
      // unless the caller explicitly wants just-offscreen candidates so focus can
      // move to the next item and be scrolled into view.
      if (!includeOffscreen && (rect.right <= 0 || rect.bottom <= 0 || rect.left >= window.innerWidth || rect.top >= window.innerHeight)) return false
      // Exclude elements clipped by an overflow:hidden ancestor (e.g. content
      // behind the mini player bar after #content shrinks with playerOpen class).
      // Skip this check in the off-screen pass — its whole purpose is to find
      // elements just outside the viewport so focus can move there and scroll
      // them in; overflow:hidden on #content must not block that.
      if (!includeOffscreen) {
        let node = el.parentElement
        while (node && node !== document.body) {
          const ps = window.getComputedStyle(node)
          if (ps.overflow === 'hidden' || ps.overflowY === 'hidden') {
            const pr = node.getBoundingClientRect()
            if (rect.bottom > pr.bottom + 2 || rect.top < pr.top - 2) return false
          }
          node = node.parentElement
        }
      }
      return true
    })
  }

  getFocusedElement() {
    const active = document.activeElement
    // document.activeElement defaults to <body> when nothing is focused, which
    // would make spatial navigation compute from the whole-page rect. Treat the
    // body/html as "nothing focused" and fall back to the element we last set.
    if (active && active !== document.body && active !== document.documentElement) {
      return active
    }
    if (this.focusedElement && this.focusedElement.isConnected) {
      return this.focusedElement
    }
    return null
  }

  setFocus(el) {
    if (!el) return
    // Plain <div>/<span> elements (e.g. [data-focusable]) are NOT natively
    // focusable, so el.focus() is a no-op and document.activeElement never
    // updates — breaking the spatial nav that reads activeElement. Give any
    // non-natively-focusable element a tabindex so focus() actually works.
    if (!this._isNativelyFocusable(el) && !el.hasAttribute('tabindex')) {
      el.setAttribute('tabindex', '-1')
    }
    // focus() itself can trigger a partial native scroll; suppress it and do a
    // deterministic "fully reveal" pass so the focused item is never left half
    // off-screen (which used to need a second D-pad press to bring it in).
    try {
      el.focus({ preventScroll: true })
    } catch (e) {
      el.focus()
    }
    el.classList.add('webos-focused')
    this.focusedElement = el

    this._ensureVisible(el)

    document.querySelectorAll('.webos-focused').forEach((prev) => {
      if (prev !== el) prev.classList.remove('webos-focused')
    })

    this.log('Focus set to:', el.tagName, el.textContent?.substring(0, 50))
  }

  // Scroll every scrollable ancestor (and the window) the minimum needed so the
  // element sits FULLY inside the viewport with a small margin. Done in one pass
  // so a freshly-focused item is immediately, completely visible.
  _ensureVisible(el) {
    const margin = 28
    let node = el.parentElement
    while (node && node !== document.body && node !== document.documentElement) {
      const style = window.getComputedStyle(node)
      const scrollableY = /(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight
      const scrollableX = /(auto|scroll)/.test(style.overflowX) && node.scrollWidth > node.clientWidth
      if (scrollableY || scrollableX) {
        const nr = node.getBoundingClientRect()
        let er = el.getBoundingClientRect()
        if (scrollableY) {
          if (er.top < nr.top + margin) node.scrollTop -= nr.top + margin - er.top
          else if (er.bottom > nr.bottom - margin) node.scrollTop += er.bottom - (nr.bottom - margin)
        }
        if (scrollableX) {
          er = el.getBoundingClientRect()
          if (er.left < nr.left + margin) node.scrollLeft -= nr.left + margin - er.left
          else if (er.right > nr.right - margin) node.scrollLeft += er.right - (nr.right - margin)
        }
      }
      node = node.parentElement
    }
    // Finally reconcile against the viewport itself.
    const er = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    let dy = 0
    let dx = 0
    if (er.top < margin) dy = er.top - margin
    else if (er.bottom > vh - margin) dy = er.bottom - (vh - margin)
    if (er.left < margin) dx = er.left - margin
    else if (er.right > vw - margin) dx = er.right - (vw - margin)
    if (dy || dx) window.scrollBy(dx, dy)
  }

  _isNativelyFocusable(el) {
    const tag = el.tagName
    if (tag === 'A') return el.hasAttribute('href')
    return tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA'
  }

  activateFocused() {
    const current = this.getFocusedElement()
    if (current) {
      current.click()
      this.log('Activated:', current.tagName)
    }
  }

  handleBack() {
    const store = window.$nuxt?.$store
    // 1. Dismiss the side drawer overlay first if it's open — an open overlay
    // should always be the first thing Back closes, never a navigation.
    if (store?.state.showSideDrawer) {
      store.commit('setShowSideDrawer', false)
      return
    }
    // 2. Close the ebook reader if open — it has no .modal class so the DOM
    // check below would miss it.
    if (store?.state.showReader) {
      window.$nuxt?.$eventBus?.$emit('close-ebook')
      return
    }
    // 3. Close any open modal. Check both the Vuex flag and any visible .modal
    // overlay in the DOM, since not every modal variant flips the flag.
    const hasVisibleModal = Array.from(document.querySelectorAll('.modal')).some((m) => {
      const s = window.getComputedStyle(m)
      return s.opacity !== '0' && s.display !== 'none' && s.visibility !== 'hidden'
    })
    if (store?.state.globals?.isModalOpen || hasVisibleModal) {
      window.$nuxt?.$eventBus?.$emit('close-modal')
      return
    }
    // 4. Collapse the fullscreen player to the mini player before leaving the page
    if (store?.state.playerIsFullscreen) {
      window.$nuxt?.$eventBus?.$emit('minimize-player')
      return
    }
    // 5. Otherwise navigate back
    const router = window.$nuxt?.$router
    if (router && window.history.length > 1) {
      router.back()
    } else {
      this.emitMediaKey('back')
    }
  }

  emitMediaKey(action) {
    window.dispatchEvent(new CustomEvent('webos-media-key', { detail: { action } }))
    this.log('Media key:', action)
  }

  emitColorKey(color) {
    window.dispatchEvent(new CustomEvent('webos-color-key', { detail: { color } }))
    this.log('Color key:', color)
  }

  _focusAppbar() {
    const appbar = document.getElementById('appbar')
    if (!appbar) return
    const focusable = this.getFocusableElements(appbar)
    if (focusable.length) this.setFocus(focusable[0])
    this.log('Long-press Up: focused appbar')
  }

  _scrollInDirection(direction) {
    const focused = this.getFocusedElement()
    const scrollable = this._findScrollableParent(focused, direction) || document.scrollingElement || document.documentElement
    const amount = 250
    if (direction === 'up') scrollable.scrollBy({ top: -amount, behavior: 'smooth' })
    else if (direction === 'down') scrollable.scrollBy({ top: amount, behavior: 'smooth' })
    else if (direction === 'left') scrollable.scrollBy({ left: -amount, behavior: 'smooth' })
    else if (direction === 'right') scrollable.scrollBy({ left: amount, behavior: 'smooth' })
  }

  // Find the nearest scrollable ancestor that can actually scroll in the given
  // direction. Passing a direction prevents a horizontal shelf row (overflow-x:
  // auto) from being returned for a vertical scroll request — which would cause
  // Down to scroll inside the shelf rather than the page.
  _findScrollableParent(el, direction = null) {
    if (!el) return null
    let node = el.parentElement
    while (node && node !== document.body) {
      const style = window.getComputedStyle(node)
      const overflow = style.overflow + style.overflowY + style.overflowX
      if (/(auto|scroll)/.test(overflow)) {
        const canScrollY = node.scrollHeight > node.clientHeight
        const canScrollX = node.scrollWidth > node.clientWidth
        if (direction === 'up' || direction === 'down') {
          if (canScrollY) return node
        } else if (direction === 'left' || direction === 'right') {
          if (canScrollX) return node
        } else if (canScrollY || canScrollX) {
          return node
        }
      }
      node = node.parentElement
    }
    return null
  }

  setInitialFocus() {
    const appbar = document.getElementById('appbar')
    const all = this.getFocusableElements()
    // Prefer content elements (not appbar) — pick the one with the smallest
    // top position in the viewport so we land at the top of the page content.
    const content = all.filter(el => !appbar || !appbar.contains(el))
    const pool = content.length ? content : all
    if (!pool.length) return
    const topmost = pool.reduce((best, el) => {
      return el.getBoundingClientRect().top < best.getBoundingClientRect().top ? el : best
    })
    this.setFocus(topmost)
  }

  enable() { this.enabled = true }
  disable() { this.enabled = false }
}

const tvRemote = new TVRemoteHandler()

export default ({ app }, inject) => {
  tvRemote.init()
  inject('tvRemote', tvRemote)

  // Auto-focus the first interactive element on each route change so D-pad
  // navigation always has a known starting point on every page.
  app.router.afterEach(() => {
    // Clear held-key state so timers/scroll from old page don't carry over
    tvRemote._heldKeys.clear()
    if (tvRemote._upHoldTimer) {
      clearTimeout(tvRemote._upHoldTimer)
      tvRemote._upHoldTimer = null
    }
    setTimeout(() => {
      // If navigation was triggered from a main nav item (the appbar), keep
      // focus on that item so movement stays relative — pressing a nav button
      // shouldn't fling the selection into the middle of the new page.
      const focused = tvRemote.getFocusedElement()
      const appbar = document.getElementById('appbar')
      if (focused && focused.isConnected && appbar && appbar.contains(focused)) {
        tvRemote.setFocus(focused)
        return
      }
      tvRemote.setInitialFocus()
    }, 150)
  })
  // Also set initial focus on first app load
  setTimeout(() => tvRemote.setInitialFocus(), 300)

  // When any modal opens, move focus into it so D-pad works immediately
  // and Back can close it without an explicit escape sequence.
  app.store.watch(
    (state) => state.globals.isModalOpen,
    (isOpen) => {
      if (isOpen) setTimeout(() => tvRemote.setInitialFocus(), 80)
    }
  )

  // When the mini player opens/closes, #content height changes and previously
  // visible elements may become clipped. Reset focus so we don't start from
  // a now-invisible position.
  app.store.watch(
    (_state, getters) => getters['getIsPlayerOpen'],
    () => { setTimeout(() => tvRemote.setInitialFocus(), 100) }
  )
}

export { tvRemote }
