/**
 * Route manifest for D-pad navigation audits.
 *
 * This is the ONE place to register a page. The navigation audit spec
 * (07-dpad-navigation.spec.js) iterates this list, so adding a new page to
 * the app means adding a single line here — no new test boilerplate.
 *
 *   path      Route to visit (hash-router paths, served from dist)
 *   name      Human label used in test titles
 *   auth      true  → page only renders meaningfully with a server connection
 *             false → page renders standalone (no server needed)
 *   minFocusable  Optional. Minimum number of focusable elements expected
 *                 when the page is in its loaded state. Defaults to 1.
 */
module.exports = [
  { path: '/connect', name: 'Connect', auth: false, minFocusable: 1 },
  { path: '/bookshelf', name: 'Bookshelf (library)', auth: true, minFocusable: 1 },
  { path: '/bookshelf/series', name: 'Series', auth: true },
  { path: '/bookshelf/collections', name: 'Collections', auth: true, mayBeEmpty: true },
  { path: '/bookshelf/playlists', name: 'Playlists', auth: true, mayBeEmpty: true },
  { path: '/bookshelf/authors', name: 'Authors', auth: true },
  { path: '/settings', name: 'Settings', auth: true, minFocusable: 5 },
  { path: '/stats', name: 'Stats', auth: true },
  { path: '/account', name: 'Account', auth: true },
  { path: '/logs', name: 'Logs', auth: false }
]
