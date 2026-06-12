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
  }

  log(...args) {
    if (this.DEBUG) console.log('[TVRemote]', ...args)
  }

  init() {
    this._keydownHandler = this.handleKeydown.bind(this)
    this._keyupHandler = this.handleKeyup.bind(this)
    this._focusinHandler = this.handleFocusin.bind(this)
    document.addEventListener('keydown', this._keydownHandler)
    document.addEventListener('keyup', this._keyupHandler)
    document.addEventListener('focusin', this._focusinHandler)
    this.log('Initialized')
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
    const key = event.key || event.keyCode

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
        event.preventDefault()
        this.handleBack()
        break
      case 'MediaPlayPause':
      case 'PlayPause':
        event.preventDefault()
        this.emitMediaKey('playPause')
        break
      case 'MediaTrackNext':
      case 'MediaFastForward':
      case 'XF86AudioNext':
        event.preventDefault()
        this.emitMediaKey('next')
        break
      case 'MediaTrackPrevious':
      case 'MediaRewind':
      case 'XF86AudioPrev':
        event.preventDefault()
        this.emitMediaKey('previous')
        break
      case 'ColorRed':
      case 'Red':
      case 'ColorF0Red':
        this.emitColorKey('red')
        break
      case 'ColorGreen':
      case 'Green':
      case 'ColorF1Green':
        this.emitColorKey('green')
        break
      case 'ColorYellow':
      case 'Yellow':
      case 'ColorF2Yellow':
        this.emitColorKey('yellow')
        break
      case 'ColorBlue':
      case 'Blue':
      case 'ColorF3Blue':
        this.emitColorKey('blue')
        break
      case 'ChannelUp':
        event.preventDefault()
        this.emitMediaKey('seekForward')
        break
      case 'ChannelDown':
        event.preventDefault()
        this.emitMediaKey('seekBackward')
        break
      case 'Play':
        event.preventDefault()
        this.emitMediaKey('playPause')
        break
      case 'Pause':
        event.preventDefault()
        this.emitMediaKey('pause')
        break
      case 'Stop':
        event.preventDefault()
        this.emitMediaKey('stop')
        break
    }
  }

  handleKeyup(event) {
    const key = event.key || event.keyCode
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
    const focusable = this.getFocusableElements(root)
    if (!focusable.length) {
      if (drawerOpen) store.commit('setShowSideDrawer', false)
      return
    }

    const current = this.getFocusedElement()
    if (!current) {
      this.setFocus(focusable[0])
      return
    }

    const currentRect = current.getBoundingClientRect()
    let bestMatch = null
    let bestDistance = Infinity

    const appbar = document.getElementById('appbar')
    const currentInAppbar = appbar && appbar.contains(current)

    focusable.forEach((el) => {
      if (el === current) return
      // Block crossing from content into the appbar on a single Up press only
      // when there is still scroll room above. If the content is already topped
      // out (scrollTop === 0) let Up reach the appbar naturally.
      if (!currentInAppbar && direction === 'up' && appbar && appbar.contains(el)) {
        const scrollable = this._findScrollableParent(current) || document.scrollingElement || document.documentElement
        if (scrollable && scrollable.scrollTop > 0) return
      }

      const rect = el.getBoundingClientRect()
      let isValid = false
      let distance = 0

      switch (direction) {
        case 'up':
          isValid = rect.bottom <= currentRect.top + 5
          distance = Math.abs(rect.left - currentRect.left) + (currentRect.top - rect.bottom)
          break
        case 'down':
          isValid = rect.top >= currentRect.bottom - 5
          distance = Math.abs(rect.left - currentRect.left) + (rect.top - currentRect.bottom)
          break
        case 'left':
          // Require vertical overlap so left/right navigation stays within the
          // same row and bottoms out at the row edge instead of wrapping to a
          // different line.
          isValid = rect.right <= currentRect.left + 5 &&
            rect.bottom > currentRect.top && rect.top < currentRect.bottom
          distance = Math.abs(rect.top - currentRect.top) + (currentRect.left - rect.right)
          break
        case 'right':
          isValid = rect.left >= currentRect.right - 5 &&
            rect.bottom > currentRect.top && rect.top < currentRect.bottom
          distance = Math.abs(rect.top - currentRect.top) + (rect.left - currentRect.right)
          break
      }

      if (isValid && distance < bestDistance) {
        bestDistance = distance
        bestMatch = el
      }
    })

    if (bestMatch) {
      this.setFocus(bestMatch)
    } else {
      // No focusable target in this direction — scroll the content instead
      this._scrollInDirection(direction)
    }
  }

  getFocusableElements(root) {
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
      const style = window.getComputedStyle(el)
      if (style.display === 'none' || style.visibility === 'hidden' || el.offsetParent === null) return false
      const rect = el.getBoundingClientRect()
      // Exclude elements translated off-screen (e.g. closed drawer sliding right)
      if (rect.right <= 0 || rect.bottom <= 0 || rect.left >= window.innerWidth || rect.top >= window.innerHeight) return false
      // Exclude elements clipped by an overflow:hidden ancestor (e.g. content
      // behind the mini player bar after #content shrinks with playerOpen class)
      let node = el.parentElement
      while (node && node !== document.body) {
        const ps = window.getComputedStyle(node)
        if (ps.overflow === 'hidden' || ps.overflowY === 'hidden') {
          const pr = node.getBoundingClientRect()
          if (rect.bottom > pr.bottom + 2 || rect.top < pr.top - 2) return false
        }
        node = node.parentElement
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
    el.focus()
    el.classList.add('webos-focused')
    this.focusedElement = el

    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

    document.querySelectorAll('.webos-focused').forEach((prev) => {
      if (prev !== el) prev.classList.remove('webos-focused')
    })

    this.log('Focus set to:', el.tagName, el.textContent?.substring(0, 50))
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
    // Close the side drawer first if it's open
    if (store?.state.showSideDrawer) {
      store.commit('setShowSideDrawer', false)
      return
    }
    // Close any open modal via the shared event bus
    if (store?.state.globals?.isModalOpen) {
      window.$nuxt?.$eventBus?.$emit('close-modal')
      return
    }
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
    const scrollable = this._findScrollableParent(focused) || document.scrollingElement || document.documentElement
    const amount = 250
    if (direction === 'up') scrollable.scrollBy({ top: -amount, behavior: 'smooth' })
    else if (direction === 'down') scrollable.scrollBy({ top: amount, behavior: 'smooth' })
    else if (direction === 'left') scrollable.scrollBy({ left: -amount, behavior: 'smooth' })
    else if (direction === 'right') scrollable.scrollBy({ left: amount, behavior: 'smooth' })
  }

  _findScrollableParent(el) {
    if (!el) return null
    let node = el.parentElement
    while (node && node !== document.body) {
      const style = window.getComputedStyle(node)
      const overflow = style.overflow + style.overflowY + style.overflowX
      if (/(auto|scroll)/.test(overflow) && (node.scrollHeight > node.clientHeight || node.scrollWidth > node.clientWidth)) {
        return node
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
    setTimeout(() => tvRemote.setInitialFocus(), 150)
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
