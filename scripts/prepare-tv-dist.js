const fs = require('fs')
const path = require('path')
const { getTizenConfigXml, getWebOSManifest } = require('../tv.platform.config')

const projectRoot = path.resolve(__dirname, '..')

function toPosix(value) {
  return value.replace(/\\/g, '/')
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
}

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

function hrefToDistRoot(htmlPath, distPath) {
  const rel = toPosix(path.relative(path.dirname(htmlPath), distPath))
  if (!rel || rel === '.') return './'
  return rel.endsWith('/') ? rel : `${rel}/`
}

function copyAsset(assetName, distPath) {
  const source = path.join(projectRoot, 'assets', assetName)
  if (!fs.existsSync(source)) return
  const target = path.join(distPath, 'assets', assetName)
  ensureDir(path.dirname(target))
  fs.copyFileSync(source, target)
}

function rewriteHtml(htmlPath, distPath) {
  const baseHref = hrefToDistRoot(htmlPath, distPath)
  let html = fs.readFileSync(htmlPath, 'utf8')

  if (/<base\s+href=/i.test(html)) {
    html = html.replace(/<base\s+href=["'][^"']*["']\s*\/?>/i, `<base href="${baseHref}">`)
  } else {
    html = html.replace(/<head>/i, `<head><base href="${baseHref}">`)
  }

  html = html
    .replace(/(src|href)=["']\/_nuxt\//g, `$1="${baseHref}_nuxt/`)
    .replace(/(src|href)=["']\.\/_nuxt\//g, `$1="${baseHref}_nuxt/`)
    .replace(/(href)=["']\/favicon\.ico["']/g, `$1="${baseHref}favicon.ico"`)
    .replace(/assetsPath:"(?:\/|\.\/)?_nuxt\/"/g, `assetsPath:"${baseHref}_nuxt/"`)
    .replace(/publicPath:"(?:\/|\.\/)?_nuxt\/"/g, `publicPath:"${baseHref}_nuxt/"`)

  fs.writeFileSync(htmlPath, html)
}

function rewriteNuxtPublicPath(jsPath) {
  let js = fs.readFileSync(jsPath, 'utf8')
  const publicPath = jsPath.endsWith('.worker.js') ? '' : './_nuxt/'
  js = js.replace(/(\b[$A-Z_a-z][$\w]*\.p=)"\/_nuxt\/"/g, `$1"${publicPath}"`)
  fs.writeFileSync(jsPath, js)
}

function prepareTvDist(distPath = path.join(projectRoot, 'dist')) {
  const resolvedDist = path.resolve(distPath)
  if (!fs.existsSync(resolvedDist)) {
    throw new Error(`Nuxt dist directory not found: ${resolvedDist}`)
  }

  fs.writeFileSync(
    path.join(resolvedDist, 'appinfo.json'),
    `${JSON.stringify(getWebOSManifest(), null, 2)}\n`
  )
  fs.writeFileSync(path.join(resolvedDist, 'config.xml'), getTizenConfigXml())

  copyAsset('icon.png', resolvedDist)
  copyAsset('largeIcon.png', resolvedDist)
  copyAsset('splash.png', resolvedDist)

  const htmlFiles = walkFiles(resolvedDist, (filePath) => filePath.endsWith('.html'))
  htmlFiles.forEach((htmlPath) => rewriteHtml(htmlPath, resolvedDist))
  const nuxtJsFiles = walkFiles(path.join(resolvedDist, '_nuxt'), (filePath) => filePath.endsWith('.js'))
  nuxtJsFiles.forEach((jsPath) => rewriteNuxtPublicPath(jsPath))

  console.log(`[tv] Prepared ${htmlFiles.length} HTML files, ${nuxtJsFiles.length} Nuxt chunks, and platform manifests in ${resolvedDist}`)
}

if (require.main === module) {
  prepareTvDist(process.argv[2])
}

module.exports = {
  prepareTvDist,
  hrefToDistRoot
}
