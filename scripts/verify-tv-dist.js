const fs = require('fs')
const path = require('path')
const { app, version } = require('../tv.platform.config')
const { hrefToDistRoot } = require('./prepare-tv-dist')

const projectRoot = path.resolve(__dirname, '..')

function walkFiles(dirPath, predicate, results = []) {
  if (!fs.existsSync(dirPath)) return results
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      walkFiles(fullPath, predicate, results)
    } else if (!predicate || predicate(fullPath)) {
      results.push(fullPath)
    }
  }
  return results
}

function fail(errors, message) {
  errors.push(message)
}

function verifyTvDist(distPath = path.join(projectRoot, 'dist')) {
  const resolvedDist = path.resolve(distPath)
  const errors = []

  if (!fs.existsSync(resolvedDist)) {
    throw new Error(`Nuxt dist directory not found: ${resolvedDist}`)
  }

  const appinfoPath = path.join(resolvedDist, 'appinfo.json')
  if (!fs.existsSync(appinfoPath)) {
    fail(errors, 'dist/appinfo.json is missing')
  } else {
    const appinfo = JSON.parse(fs.readFileSync(appinfoPath, 'utf8'))
    if (appinfo.id !== app.id) fail(errors, `webOS app id is ${appinfo.id}, expected ${app.id}`)
    if (appinfo.version !== version) fail(errors, `webOS version is ${appinfo.version}, expected ${version}`)
    if (!/^\d+\.\d+\.\d+$/.test(appinfo.version)) fail(errors, 'webOS version must be numeric major.minor.patch')
    if (appinfo.main !== 'index.html') fail(errors, 'webOS main must be index.html')
    if (appinfo.handlesRelaunch !== false) fail(errors, 'webOS handlesRelaunch must stay false unless relaunch events are implemented')
  }

  const tizenConfigPath = path.join(resolvedDist, 'config.xml')
  if (!fs.existsSync(tizenConfigPath)) {
    fail(errors, 'dist/config.xml is missing')
  } else {
    const xml = fs.readFileSync(tizenConfigPath, 'utf8')
    if (!xml.includes(`version="${version}"`)) fail(errors, `Tizen config version must be ${version}`)
    if (!xml.includes('<content src="index.html"/>')) fail(errors, 'Tizen content src must be index.html')
    if (!xml.includes('<access origin="*" subdomains="true"/>')) fail(errors, 'Tizen network access policy is missing')
    if (!xml.includes('http://tizen.org/privilege/internet')) fail(errors, 'Tizen internet privilege is missing')
    if (!xml.includes('http://tizen.org/privilege/tv.inputdevice')) fail(errors, 'Tizen tv.inputdevice privilege is missing')
  }

  for (const asset of ['assets/icon.png', 'assets/largeIcon.png', 'assets/splash.png']) {
    if (!fs.existsSync(path.join(resolvedDist, asset))) fail(errors, `dist/${asset} is missing`)
  }

  const htmlFiles = walkFiles(resolvedDist, (filePath) => filePath.endsWith('.html'))
  htmlFiles.forEach((htmlPath) => {
    const rel = path.relative(resolvedDist, htmlPath).replace(/\\/g, '/')
    const expectedBase = hrefToDistRoot(htmlPath, resolvedDist)
    const html = fs.readFileSync(htmlPath, 'utf8')
    if (!html.includes(`<base href="${expectedBase}">`)) fail(errors, `${rel} has the wrong base href`)
    if (/=["']\/_nuxt\//.test(html)) fail(errors, `${rel} still references /_nuxt from the file root`)
    if (/href=["']\/favicon\.ico["']/.test(html)) fail(errors, `${rel} still references /favicon.ico`)
    const assetPathMatch = html.match(/assetsPath:"([^"]+)"/)
    if (assetPathMatch && assetPathMatch[1] !== `${expectedBase}_nuxt/`) {
      fail(errors, `${rel} has assetsPath ${assetPathMatch[1]}, expected ${expectedBase}_nuxt/`)
    }
  })

  const nuxtJsFiles = walkFiles(path.join(resolvedDist, '_nuxt'), (filePath) => filePath.endsWith('.js'))
  nuxtJsFiles.forEach((filePath) => {
    const rel = path.relative(resolvedDist, filePath).replace(/\\/g, '/')
    const js = fs.readFileSync(filePath, 'utf8')
    if (/[$A-Z_a-z][$\w]*\.p=["']\/_nuxt\/["']/.test(js)) {
      fail(errors, `${rel} still sets an absolute Webpack public path`)
    }
    if (js.includes('CapacitorPlatforms') || js.includes('CapacitorException')) {
      fail(errors, `${rel} appears to include the modern @capacitor/core browser bundle`)
    }
  })

  if (errors.length) {
    errors.forEach((error) => console.error(`[tv:verify] ${error}`))
    process.exitCode = 1
    return false
  }

  console.log(`[tv:verify] ${htmlFiles.length} HTML files, ${nuxtJsFiles.length} Nuxt chunks, and platform manifests look TV-ready`)
  return true
}

if (require.main === module) {
  verifyTvDist(process.argv[2])
}

module.exports = {
  verifyTvDist
}
