function parseResponseHeaders(headerText) {
  const headers = {}
  if (!headerText) return headers
  headerText.trim().split(/[\r\n]+/).forEach((line) => {
    const index = line.indexOf(':')
    if (index <= 0) return
    const key = line.slice(0, index).trim().toLowerCase()
    const value = line.slice(index + 1).trim()
    headers[key] = value
  })
  return headers
}

function hasHeader(headers, name) {
  const target = name.toLowerCase()
  return Object.keys(headers || {}).some((key) => key.toLowerCase() === target)
}

function isBinaryBody(body) {
  return (
    typeof Blob !== 'undefined' && body instanceof Blob
  ) || (
    typeof ArrayBuffer !== 'undefined' && body instanceof ArrayBuffer
  ) || (
    typeof FormData !== 'undefined' && body instanceof FormData
  )
}

function normalizeRequestBody(data, headers) {
  if (data == null) return null
  if (typeof data === 'string' || isBinaryBody(data)) return data
  if (!hasHeader(headers, 'content-type')) headers['Content-Type'] = 'application/json'
  return JSON.stringify(data)
}

function parseResponseData(xhr, responseType, headers) {
  if (responseType === 'blob' || responseType === 'arraybuffer') return xhr.response
  const text = xhr.responseText
  const contentType = headers['content-type'] || ''
  if (responseType === 'json' || contentType.indexOf('application/json') !== -1) {
    if (!text) return null
    try {
      return JSON.parse(text)
    } catch (error) {
      return text
    }
  }
  return text
}

export const Capacitor = {
  getPlatform() {
    return 'web'
  },
  isNativePlatform() {
    return false
  },
  isPluginAvailable() {
    return false
  },
  convertFileSrc(filePath) {
    return filePath
  },
  getServerUrl() {
    return ''
  },
  isLoggingEnabled() {
    return false
  }
}

export const CapacitorHttp = {
  request(options = {}) {
    return new Promise((resolve, reject) => {
      const method = options.method || 'GET'
      const url = options.url
      const headers = Object.assign({}, options.headers || {})

      if (!url) {
        reject(new Error('CapacitorHttp.request requires a url'))
        return
      }

      const xhr = new XMLHttpRequest()
      xhr.open(method, url, true)

      if (options.responseType === 'blob' || options.responseType === 'arraybuffer') {
        try {
          xhr.responseType = options.responseType
        } catch (error) {
          console.warn('[CapacitorHttp] responseType not supported:', options.responseType)
        }
      }

      if (options.connectTimeout || options.readTimeout) {
        xhr.timeout = Math.max(options.connectTimeout || 0, options.readTimeout || 0)
      }

      if (options.withCredentials) xhr.withCredentials = true

      const body = normalizeRequestBody(options.data, headers)
      Object.keys(headers).forEach((key) => {
        if (headers[key] != null) xhr.setRequestHeader(key, headers[key])
      })

      xhr.onload = () => {
        const responseHeaders = parseResponseHeaders(xhr.getAllResponseHeaders())
        resolve({
          status: xhr.status,
          data: parseResponseData(xhr, options.responseType, responseHeaders),
          headers: responseHeaders,
          url: xhr.responseURL || url
        })
      }
      xhr.onerror = () => reject(new Error(`Network request failed: ${method} ${url}`))
      xhr.ontimeout = () => reject(new Error(`Network request timed out: ${method} ${url}`))
      xhr.send(body)
    })
  },
  get(options = {}) {
    return this.request(Object.assign({}, options, { method: 'GET' }))
  },
  post(options = {}) {
    return this.request(Object.assign({}, options, { method: 'POST' }))
  },
  put(options = {}) {
    return this.request(Object.assign({}, options, { method: 'PUT' }))
  },
  patch(options = {}) {
    return this.request(Object.assign({}, options, { method: 'PATCH' }))
  },
  delete(options = {}) {
    return this.request(Object.assign({}, options, { method: 'DELETE' }))
  }
}

export class WebPlugin {
  constructor() {
    this.listeners = {}
  }

  async addListener(eventName, listenerFunc) {
    if (!this.listeners[eventName]) this.listeners[eventName] = []
    this.listeners[eventName].push(listenerFunc)
    return {
      remove: () => {
        this.listeners[eventName] = (this.listeners[eventName] || []).filter((listener) => listener !== listenerFunc)
      }
    }
  }

  async removeAllListeners() {
    this.listeners = {}
  }

  notifyListeners(eventName, data) {
    ;(this.listeners[eventName] || []).forEach((listener) => {
      try {
        listener(data)
      } catch (error) {
        console.error(`[WebPlugin] listener failed for ${eventName}`, error)
      }
    })
  }
}

export function registerPlugin(_pluginName, implementations = {}) {
  if (typeof implementations.web === 'function') return implementations.web()
  if (implementations.web) return implementations.web
  return {}
}
