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
  { path: '/#/connect', name: 'Connect', auth: false, minFocusable: 1 },
  { path: '/#/bookshelf', name: 'Bookshelf (library)', auth: true, minFocusable: 1 },
  { path: '/#/bookshelf/library', name: 'Library', auth: true, minFocusable: 1 },
  { path: '/#/bookshelf/latest', name: 'Latest Episodes', auth: true, libraryId: 'pod-lib', minFocusable: 1 },
  { path: '/#/bookshelf/series', name: 'Series', auth: true },
  { path: '/#/bookshelf/series/series-1', name: 'Series Detail', auth: true },
  { path: '/#/bookshelf/collections', name: 'Collections', auth: true },
  { path: '/#/collection/collection-1', name: 'Collection Detail', auth: true },
  { path: '/#/bookshelf/playlists', name: 'Playlists', auth: true },
  { path: '/#/playlist/playlist-1', name: 'Playlist Detail', auth: true },
  { path: '/#/bookshelf/authors', name: 'Authors', auth: true },
  { path: '/#/bookshelf/add-podcast', name: 'Add Podcast', auth: true, libraryId: 'pod-lib', minFocusable: 1 },
  { path: '/#/item/item-1', name: 'Book Detail', auth: true },
  { path: '/#/item/podcast-1/episode-1', name: 'Episode Detail', auth: true, libraryId: 'pod-lib' },
  { path: '/#/search', name: 'Search', auth: true, minFocusable: 1 },
  { path: '/#/settings', name: 'Settings', auth: true, minFocusable: 5 },
  { path: '/#/stats', name: 'Stats', auth: true },
  { path: '/#/account', name: 'Account', auth: true },
  { path: '/#/downloads', name: 'Downloads', auth: false, local: true, minFocusable: 1 },
  { path: '/#/downloading', name: 'Downloading', auth: false, local: true, minFocusable: 0 },
  { path: '/#/localMedia/folders', name: 'Local Folders', auth: false, local: true, minFocusable: 1 },
  { path: '/#/localMedia/folders/folder-1', name: 'Local Folder Detail', auth: false, local: true, minFocusable: 1 },
  { path: '/#/localMedia/item/local-book-1', name: 'Local Media Item', auth: false, local: true, minFocusable: 1 },
  { path: '/#/media/local-book-1/history?title=The%20Quiet%20Shelf', name: 'Media History', auth: false, local: true, minFocusable: 0 },
  { path: '/#/logs', name: 'Logs', auth: false }
]
