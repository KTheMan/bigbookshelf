/**
 * Polyfills for webOS 3.0 (old WebKit engine)
 * Loaded before all other plugins via nuxt.config.js
 */

// Array.from polyfill
if (!Array.from) {
  Array.from = function (arrayLike) {
    var arr = []
    for (var i = 0; i < arrayLike.length; i++) {
      arr.push(arrayLike[i])
    }
    return arr
  }
}

// Map polyfill (basic)
if (typeof Map === 'undefined') {
  window.Map = function () {
    this._keys = []
    this._values = []
  }
  window.Map.prototype.set = function (key, value) {
    var idx = this._keys.indexOf(key)
    if (idx === -1) {
      this._keys.push(key)
      this._values.push(value)
    } else {
      this._values[idx] = value
    }
    return this
  }
  window.Map.prototype.get = function (key) {
    var idx = this._keys.indexOf(key)
    return idx === -1 ? undefined : this._values[idx]
  }
  window.Map.prototype.has = function (key) {
    return this._keys.indexOf(key) !== -1
  }
  window.Map.prototype.delete = function (key) {
    var idx = this._keys.indexOf(key)
    if (idx === -1) return false
    this._keys.splice(idx, 1)
    this._values.splice(idx, 1)
    return true
  }
  window.Map.prototype.forEach = function (callback) {
    for (var i = 0; i < this._keys.length; i++) {
      callback(this._values[i], this._keys[i], this)
    }
  }
}

// URL polyfill (basic)
if (typeof URL === 'undefined') {
  window.URL = function (url) {
    var a = document.createElement('a')
    a.href = url
    this.protocol = a.protocol
    this.hostname = a.hostname
    this.port = a.port
    this.pathname = a.pathname
    this.search = a.search
    this.hash = a.hash
    this.host = a.host
    this.href = a.href
  }
}

// crypto.getRandomValues polyfill
if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
  window.crypto = window.crypto || {}
  window.crypto.getRandomValues = function (array) {
    for (var i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
    return array
  }
}

// Uint8Array polyfill (basic)
if (typeof Uint8Array === 'undefined') {
  window.Uint8Array = function (size) {
    var arr = []
    for (var i = 0; i < size; i++) {
      arr.push(0)
    }
    arr.__proto__ = Uint8Array.prototype
    return arr
  }
}

// String.prototype.startsWith polyfill
if (!String.prototype.startsWith) {
  String.prototype.startsWith = function (search, pos) {
    pos = pos || 0
    return this.indexOf(search, pos) === pos
  }
}

// String.prototype.includes polyfill
if (!String.prototype.includes) {
  String.prototype.includes = function (search, start) {
    if (typeof start !== 'number') start = 0
    if (start + search.length > this.length) return false
    return this.indexOf(search, start) !== -1
  }
}

// Object.assign polyfill
if (!Object.assign) {
  Object.assign = function (target) {
    if (target == null) throw new TypeError('Cannot convert undefined or null to object')
    var to = Object(target)
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i]
      if (source != null) {
        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            to[key] = source[key]
          }
        }
      }
    }
    return to
  }
}

// Promise polyfill (basic)
if (typeof Promise === 'undefined') {
  window.Promise = function (executor) {
    var self = this
    self._state = 0
    self._value = undefined
    self._callbacks = []

    function resolve(value) {
      if (self._state !== 0) return
      self._state = 1
      self._value = value
      self._callbacks.forEach(function (cb) { cb.onFulfilled(value) })
    }

    function reject(reason) {
      if (self._state !== 0) return
      self._state = 2
      self._value = reason
      self._callbacks.forEach(function (cb) { cb.onRejected(reason) })
    }

    try {
      executor(resolve, reject)
    } catch (e) {
      reject(e)
    }
  }

  window.Promise.prototype.then = function (onFulfilled, onRejected) {
    var self = this
    return new window.Promise(function (resolve, reject) {
      var fulfilled = function (value) {
        try {
          resolve(onFulfilled ? onFulfilled(value) : value)
        } catch (e) {
          reject(e)
        }
      }
      var rejected = function (reason) {
        try {
          if (onRejected) {
            resolve(onRejected(reason))
          } else {
            reject(reason)
          }
        } catch (e) {
          reject(e)
        }
      }
      if (self._state === 1) fulfilled(self._value)
      else if (self._state === 2) rejected(self._value)
      else self._callbacks.push({ onFulfilled: fulfilled, onRejected: rejected })
    })
  }

  window.Promise.prototype.catch = function (onRejected) {
    return this.then(null, onRejected)
  }

  window.Promise.resolve = function (value) {
    return new window.Promise(function (resolve) { resolve(value) })
  }

  window.Promise.reject = function (reason) {
    return new window.Promise(function (_, reject) { reject(reason) })
  }
}

// btoa (Base64 encode) polyfill
if (!window.btoa) {
  window.btoa = function (str) {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
    var output = ''
    var i = 0
    str = String(str)
    while (i < str.length) {
      var a = str.charCodeAt(i++)
      var b = str.charCodeAt(i++)
      var c = str.charCodeAt(i++)
      if (a > 255) a = 0
      if (b > 255) b = 0
      if (c > 255) c = 0
      var idx1 = a >> 2
      var idx2 = ((a & 3) << 4) | (b >> 4)
      var idx3 = ((b & 15) << 2) | (c >> 6)
      var idx4 = c & 63
      if (isNaN(b)) { idx3 = idx4 = 64 }
      else if (isNaN(c)) { idx4 = 64 }
      output += chars.charAt(idx1) + chars.charAt(idx2) + chars.charAt(idx3) + chars.charAt(idx4)
    }
    return output
  }
}

console.log('[webOS polyfills] Loaded for webOS 3.0 compatibility')
