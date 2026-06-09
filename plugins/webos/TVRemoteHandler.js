import Vue from 'vue'

class TVRemoteHandler {
  constructor() {
    this.handlers = new Map()
    this.focusedElement = null
    this.focusTrapStack = []
    this.enabled = true
    this.DEBUG = false
  }

  log(...args) {
    if (this.DEBUG) console.log('[TVRemote]', ...args)
  }

  init() {
    document.addEventListener('keydown', this.handleKeydown.bind(this))
    document.addEventListener('keyup', this.handleKeyup.bind(this))
    this.log('Initialized')
  }

  destroy() {
    document.removeEventListener('keydown', this.handleKeydown.bind(this))
    document.removeEventListener('keyup', this.handleKeyup.bind(this))
    this.handlers.clear()
  }

  handleKeydown(event) {
    if (!this.enabled) return
    const key = event.key || event.keyCode

    this.log('Keydown:', key)

    switch (key) {
      case 'ArrowUp':
      case 'Up':
      case 38:
        event.preventDefault()
        this.navigateFocus('up')
        break
      case 'ArrowDown':
      case 'Down':
      case 40:
        event.preventDefault()
        this.navigateFocus('down')
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
        this.emitColorKey('red')
        break
      case 'ColorGreen':
      case 'Green':
        this.emitColorKey('green')
        break
      case 'ColorYellow':
      case 'Yellow':
        this.emitColorKey('yellow')
        break
      case 'ColorBlue':
      case 'Blue':
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
    /* reserved for future use */
  }

  navigateFocus(direction) {
    const focusable = this.getFocusableElements()
    if (!focusable.length) return

    const current = this.getFocusedElement()
    if (!current) {
      this.setFocus(focusable[0])
      return
    }

    const currentRect = current.getBoundingClientRect()
    let bestMatch = null
    let bestDistance = Infinity

    focusable.forEach((el) => {
      if (el === current) return
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
          isValid = rect.right <= currentRect.left + 5
          distance = Math.abs(rect.top - currentRect.top) + (currentRect.left - rect.right)
          break
        case 'right':
          isValid = rect.left >= currentRect.right - 5
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
    }
  }

  getFocusableElements() {
    return Array.from(
      document.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [data-focusable]'
      )
    ).filter((el) => {
      const style = window.getComputedStyle(el)
      return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null
    })
  }

  getFocusedElement() {
    return document.activeElement
  }

  setFocus(el) {
    if (!el) return
    el.focus()
    el.classList.add('webos-focused')
    this.focusedElement = el

    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

    document.querySelectorAll('.webos-focused').forEach((prev) => {
      if (prev !== el) prev.classList.remove('webos-focused')
    })

    this.log('Focus set to:', el.tagName, el.textContent?.substring(0, 50))
  }

  activateFocused() {
    const current = this.getFocusedElement()
    if (current) {
      current.click()
      this.log('Activated:', current.tagName)
    }
  }

  handleBack() {
    const router = window.__nuxt__?.$router || (document.__vue_app__ && document.__vue_app__.$router)
    if (router && window.history.length > 1) {
      window.history.back()
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

  enable() { this.enabled = true }
  disable() { this.enabled = false }
}

const tvRemote = new TVRemoteHandler()

export default ({ app }, inject) => {
  tvRemote.init()
  inject('tvRemote', tvRemote)
}

export { tvRemote }
