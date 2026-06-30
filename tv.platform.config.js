const pkg = require('./package.json')

function normalizeVersion(version) {
  const core = String(version || '0.0.0').split('-')[0]
  const parts = core.split('.').map((part) => Number.parseInt(part, 10))
  while (parts.length < 3) parts.push(0)
  return parts.slice(0, 3).map((part) => (Number.isFinite(part) && part >= 0 ? part : 0)).join('.')
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

const app = {
  id: 'com.bigbookshelf.tv',
  title: 'Bigbookshelf',
  vendor: 'KTheMan',
  description: 'Audiobookshelf client for Smart TVs',
  widgetId: 'http://bigbookshelf.tv',
  tizenPackage: 'BIGbook001',
  tizenApplicationId: 'BIGbook001.Bigbookshelf',
  minWebOSVersion: '3.0.0',
  minTizenVersion: '4.0'
}

const version = normalizeVersion(pkg.version)

function getWebOSManifest() {
  return {
    id: app.id,
    version,
    vendor: app.vendor,
    type: 'web',
    main: 'index.html',
    title: app.title,
    appDescription: app.description,
    icon: 'assets/icon.png',
    largeIcon: 'assets/largeIcon.png',
    uiRevision: 2,
    resolution: '1920x1080',
    requiredPermissions: ['internet', 'audio'],
    requiredMemory: 50,
    handlesRelaunch: false,
    disableBackHistoryAPI: false,
    splashBackground: 'assets/splash.png',
    transparent: false,
    bgColor: '#1a1a1a',
    iconColor: '#1a1a1a',
    supportsAudioGuidance: false,
    accessible: false,
    inAppPurchase: false
  }
}

function getTizenConfigXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<widget xmlns="http://www.w3.org/ns/widgets"
        xmlns:tizen="http://tizen.org/ns/widgets"
        id="${escapeXml(app.widgetId)}"
        version="${escapeXml(version)}"
        viewmodes="maximized">

    <tizen:application id="${escapeXml(app.tizenApplicationId)}"
                       package="${escapeXml(app.tizenPackage)}"
                       required_version="${escapeXml(app.minTizenVersion)}"/>

    <content src="index.html"/>

    <access origin="*" subdomains="true"/>

    <feature name="http://tizen.org/feature/network.internet"/>

    <tizen:privilege name="http://tizen.org/privilege/internet"/>
    <tizen:privilege name="http://tizen.org/privilege/tv.inputdevice"/>

    <name>${escapeXml(app.title)}</name>
    <description>${escapeXml(app.description)}</description>

    <icon src="assets/icon.png"/>

    <tizen:profile name="tv-samsung"/>

    <tizen:setting screen-orientation="landscape"
                   context-menu="disable"
                   background-support="disable"
                   encryption="disable"
                   install-location="auto"
                   hw-key-event="enable"/>

</widget>
`
}

module.exports = {
  app,
  version,
  normalizeVersion,
  getWebOSManifest,
  getTizenConfigXml
}
