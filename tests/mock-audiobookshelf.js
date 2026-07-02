const { expect } = require('@playwright/test')

const SERVER = 'http://studio.local:13378'
const BOOK_LIBRARY_ID = 'lib-1'
const PODCAST_LIBRARY_ID = 'pod-lib'
const SERVER_CONFIG_ID = 'server-a'

const bookLibrary = {
  id: BOOK_LIBRARY_ID,
  name: 'Audiobooks',
  mediaType: 'book',
  settings: { coverAspectRatio: 0, audiobooksOnly: false }
}

const podcastLibrary = {
  id: PODCAST_LIBRARY_ID,
  name: 'Podcasts',
  mediaType: 'podcast',
  settings: { coverAspectRatio: 1, audiobooksOnly: false }
}

const author = {
  id: 'author-1',
  name: 'Mara Vale',
  numBooks: 2
}

const bookItem = {
  id: 'item-1',
  libraryId: BOOK_LIBRARY_ID,
  mediaType: 'book',
  isMissing: false,
  isInvalid: false,
  numFiles: 1,
  size: 1024 * 1024 * 42,
  addedAt: 1717200000000,
  media: {
    coverPath: null,
    duration: 3720,
    numTracks: 1,
    tracks: [
      {
        index: 1,
        title: 'Chapter One',
        startOffset: 0,
        duration: 3720,
        metadata: { size: 1024 * 1024 * 42 }
      }
    ],
    chapters: [
      { id: 'chapter-1', title: 'Opening Credits', start: 0, end: 60 },
      { id: 'chapter-2', title: 'A Quiet Shelf', start: 60, end: 900 }
    ],
    metadata: {
      title: 'The Quiet Shelf',
      titleIgnorePrefix: 'Quiet Shelf, The',
      subtitle: 'A Bigbookshelf fixture',
      authorName: author.name,
      authorNameLF: 'Vale, Mara',
      authors: [author],
      narrators: ['Jun Park'],
      genres: ['Speculative Fiction'],
      tags: ['Featured'],
      publishedYear: '2026',
      description: 'A focused fixture book used to keep TV navigation and visual regression tests deterministic.',
      series: [{ id: 'series-1', name: 'Shelf Cycle', sequence: '1' }]
    }
  }
}

const secondBookItem = {
  ...bookItem,
  id: 'item-2',
  media: {
    ...bookItem.media,
    metadata: {
      ...bookItem.media.metadata,
      title: 'Remote Control Stories',
      titleIgnorePrefix: 'Remote Control Stories',
      series: [{ id: 'series-1', name: 'Shelf Cycle', sequence: '2' }]
    }
  }
}

const episode = {
  id: 'episode-1',
  libraryItemId: 'podcast-1',
  title: 'A Better Home Screen',
  subtitle: 'Navigation polish in practice',
  description: 'A fixture episode for route crawling and D-pad testing.',
  duration: 1800,
  publishedAt: Date.now() - 86400000,
  episode: '1',
  season: '1',
  episodeType: 'full',
  audioFile: { ino: 'audio-episode-1', metadata: { size: 1024 * 1024 * 18 } },
  audioTrack: {
    index: 1,
    title: 'A Better Home Screen',
    duration: 1800,
    mimeType: 'audio/mpeg',
    localFileId: 'file-podcast-1',
    contentUrl: 'capacitor://local-podcast-1.mp3'
  }
}

const podcastItem = {
  id: 'podcast-1',
  libraryId: PODCAST_LIBRARY_ID,
  mediaType: 'podcast',
  isMissing: false,
  isInvalid: false,
  numFiles: 1,
  size: 1024 * 1024 * 18,
  media: {
    coverPath: null,
    duration: 1800,
    numEpisodes: 1,
    episodes: [episode],
    metadata: {
      title: 'Bigbookshelf Radio',
      author: 'Studio Team',
      type: 'episodic',
      description: 'A fixture podcast for TV route coverage.',
      genres: ['Technology'],
      tags: ['Fixture']
    }
  }
}

const series = {
  id: 'series-1',
  name: 'Shelf Cycle',
  libraryId: BOOK_LIBRARY_ID,
  books: [bookItem, secondBookItem]
}

const collection = {
  id: 'collection-1',
  libraryId: BOOK_LIBRARY_ID,
  name: 'Fixture Collection',
  description: 'A deterministic collection used by TV route regression tests.',
  books: [bookItem, secondBookItem]
}

const playlist = {
  id: 'playlist-1',
  libraryId: BOOK_LIBRARY_ID,
  name: 'Fixture Playlist',
  description: 'A deterministic playlist used by TV route regression tests.',
  items: [
    {
      id: 'playlist-item-1',
      libraryItemId: bookItem.id,
      episodeId: null,
      libraryItem: bookItem
    },
    {
      id: 'playlist-item-2',
      libraryItemId: podcastItem.id,
      episodeId: episode.id,
      libraryItem: podcastItem,
      episode
    }
  ]
}

const localFolder = {
  id: 'folder-1',
  name: 'USB Audiobooks',
  mediaType: 'book',
  contentUrl: 'capacitor://usb-audiobooks'
}

const localBookItem = {
  id: 'local-book-1',
  folderId: localFolder.id,
  libraryItemId: bookItem.id,
  serverAddress: SERVER,
  serverUserId: 'user-1',
  serverConnectionConfigId: SERVER_CONFIG_ID,
  mediaType: 'book',
  isLocal: true,
  basePath: '/fixture/The Quiet Shelf',
  localFiles: [
    {
      id: 'file-book-1',
      filename: 'chapter-one.mp3',
      basePath: '/fixture/The Quiet Shelf/chapter-one.mp3',
      contentUrl: 'capacitor://chapter-one.mp3',
      mimeType: 'audio/mpeg',
      size: 1024 * 1024 * 42
    }
  ],
  media: {
    ...bookItem.media,
    tracks: [
      {
        ...bookItem.media.tracks[0],
        localFileId: 'file-book-1',
        contentUrl: 'capacitor://chapter-one.mp3',
        mimeType: 'audio/mpeg'
      }
    ]
  }
}

const authPayload = {
  user: {
    id: 'user-1',
    username: 'kenny',
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    librariesAccessible: [BOOK_LIBRARY_ID, PODCAST_LIBRARY_ID],
    mediaProgress: [
      {
        id: 'progress-1',
        libraryItemId: bookItem.id,
        episodeId: null,
        progress: 0.33,
        currentTime: 1227,
        duration: bookItem.media.duration,
        isFinished: false,
        lastUpdate: Date.now()
      }
    ],
    bookmarks: [],
    permissions: { download: true, update: true, delete: true, accessAllLibraries: true },
    type: 'admin'
  },
  userDefaultLibraryId: BOOK_LIBRARY_ID,
  serverSettings: { version: '2.26.0', language: 'en-us', sortingIgnorePrefix: true },
  ereaderDevices: []
}

const transparentPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
  'base64'
)

function paged(results) {
  return { results, total: results.length, limit: 20, page: 0, sortBy: 'name', sortDesc: false }
}

function withPodcastRecentEpisode(item = podcastItem) {
  return {
    ...item,
    recentEpisode: episode
  }
}

function storageSeedData({ libraryId = BOOK_LIBRARY_ID, includeServerConfig = true } = {}) {
  return {
    libraryId,
    includeServerConfig,
    server: SERVER,
    serverConfigId: SERVER_CONFIG_ID,
    serverSettings: authPayload.serverSettings,
    localFolder,
    localBookItem
  }
}

function seedTvFixtureStorage(data) {
  const now = Date.now()
  if (data.includeServerConfig) {
    window.localStorage.setItem(
      'device',
      JSON.stringify({
        serverConnectionConfigs: [
          {
            id: data.serverConfigId,
            name: 'Studio',
            address: data.server,
            username: 'kenny',
            userId: 'user-1',
            token: 'saved-token',
            version: '2.26.0',
            customHeaders: {}
          }
        ],
        lastServerConnectionConfigId: data.serverConfigId,
        currentLocalPlaybackSession: null,
        deviceSettings: {}
      })
    )
    window.localStorage.setItem(`refresh_token_${data.serverConfigId}`, 'refresh-token')
  }
  window.localStorage.setItem('lastLibraryId', data.libraryId)
  window.localStorage.setItem('serverSettings', JSON.stringify(data.serverSettings))
  window.localStorage.setItem('localFolders', JSON.stringify([data.localFolder]))
  window.localStorage.setItem('localLibraryItems', JSON.stringify([data.localBookItem]))
  window.localStorage.setItem(
    'localMediaProgress',
    JSON.stringify([
      {
        id: 'local-progress-1',
        localLibraryItemId: data.localBookItem.id,
        libraryItemId: data.localBookItem.libraryItemId,
        progress: 0.2,
        currentTime: 744,
        duration: data.localBookItem.media.duration,
        isFinished: false,
        lastUpdate: now
      }
    ])
  )
  window.localStorage.setItem(
    'mediaItemHistory',
    JSON.stringify({
      [data.localBookItem.id]: {
        id: data.localBookItem.id,
        mediaDisplayTitle: data.localBookItem.media.metadata.title,
        libraryItemId: data.localBookItem.libraryItemId,
        episodeId: null,
        events: [
          { name: 'Play', timestamp: now - 60000, currentTime: 120 },
          { name: 'Save', timestamp: now - 30000, currentTime: 300, serverSyncAttempted: true, serverSyncSuccess: true }
        ]
      }
    })
  )
}

async function mockAudiobookshelf(page) {
  await page.route('**/*', async (route) => {
    const request = route.request()
    const url = new URL(request.url())

    if (url.pathname.endsWith('/login')) {
      expect(request.headers()['x-return-tokens']).toBe('true')
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(authPayload) })
      return
    }

    if (url.pathname.endsWith('/auth/refresh')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            accessToken: 'access-token-refreshed',
            refreshToken: 'refresh-token-refreshed'
          }
        })
      })
      return
    }

    if (!url.pathname.startsWith('/api/')) {
      await route.continue()
      return
    }

    const ok = (body) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })

    if (url.pathname.includes('/cover')) {
      await route.fulfill({ status: 200, contentType: 'image/png', body: transparentPng })
      return
    }

    if (url.pathname === '/api/authorize') {
      await ok({
        ...authPayload,
        user: {
          ...authPayload.user,
          accessToken: undefined,
          refreshToken: undefined
        }
      })
      return
    }

    if (url.pathname === '/api/libraries') {
      await ok({ libraries: [bookLibrary, podcastLibrary] })
      return
    }

    if (url.pathname === `/api/libraries/${BOOK_LIBRARY_ID}` && url.searchParams.get('include') === 'filterdata') {
      await ok({
        library: bookLibrary,
        filterdata: {
          authors: [author],
          genres: ['Speculative Fiction'],
          narrators: ['Jun Park'],
          series: [series],
          tags: ['Featured'],
          languages: [],
          progress: []
        },
        issues: 0,
        numUserPlaylists: 1
      })
      return
    }

    if (url.pathname === `/api/libraries/${PODCAST_LIBRARY_ID}` && url.searchParams.get('include') === 'filterdata') {
      await ok({
        library: podcastLibrary,
        filterdata: { authors: [], genres: ['Technology'], narrators: [], series: [], tags: ['Fixture'], languages: [], progress: [] },
        issues: 0,
        numUserPlaylists: 1
      })
      return
    }

    if (url.pathname === `/api/libraries/${BOOK_LIBRARY_ID}/personalized`) {
      await ok([{ id: 'home-fixture', label: 'Continue Listening', type: 'book', entities: [bookItem, secondBookItem] }])
      return
    }

    if (url.pathname === `/api/libraries/${PODCAST_LIBRARY_ID}/personalized`) {
      await ok([{ id: 'podcast-fixture', label: 'Latest Episodes', type: 'episode', entities: [withPodcastRecentEpisode()] }])
      return
    }

    if (url.pathname === `/api/libraries/${BOOK_LIBRARY_ID}/items`) {
      await ok(paged([bookItem, secondBookItem]))
      return
    }

    if (url.pathname === `/api/libraries/${BOOK_LIBRARY_ID}/series`) {
      await ok(paged([series]))
      return
    }

    if (url.pathname === `/api/libraries/${BOOK_LIBRARY_ID}/collections`) {
      await ok(paged([collection]))
      return
    }

    if (url.pathname === `/api/libraries/${BOOK_LIBRARY_ID}/playlists`) {
      await ok(paged([playlist]))
      return
    }

    if (url.pathname === `/api/libraries/${BOOK_LIBRARY_ID}/authors`) {
      await ok({ authors: [author] })
      return
    }

    if (url.pathname === `/api/libraries/${PODCAST_LIBRARY_ID}/items`) {
      await ok(paged([podcastItem]))
      return
    }

    if (url.pathname === `/api/libraries/${PODCAST_LIBRARY_ID}/recent-episodes`) {
      await ok({ episodes: [episode], total: 1 })
      return
    }

    if (url.pathname === `/api/libraries/${BOOK_LIBRARY_ID}/search` || url.pathname === `/api/libraries/${PODCAST_LIBRARY_ID}/search`) {
      await ok({
        book: [{ libraryItem: bookItem }],
        podcast: [{ libraryItem: podcastItem }],
        episodes: [{ libraryItem: withPodcastRecentEpisode() }],
        series: [{ series, books: series.books }],
        authors: [author],
        narrators: [{ name: 'Jun Park' }],
        tags: [{ name: 'Featured' }]
      })
      return
    }

    if (url.pathname === '/api/items/item-1' || url.pathname === '/api/items/item-1/') {
      await ok(bookItem)
      return
    }

    if (url.pathname === '/api/items/item-2' || url.pathname === '/api/items/item-2/') {
      await ok(secondBookItem)
      return
    }

    if (url.pathname === '/api/items/podcast-1' || url.pathname === '/api/items/podcast-1/') {
      await ok(podcastItem)
      return
    }

    if (url.pathname === '/api/series/series-1') {
      await ok(series)
      return
    }

    if (url.pathname === '/api/collections/collection-1') {
      await ok(collection)
      return
    }

    if (url.pathname === '/api/playlists/playlist-1') {
      await ok(playlist)
      return
    }

    if (url.pathname === '/api/me/listening-stats') {
      await ok({
        totalTime: 7200,
        days: [{ date: '2026-06-30', timeListening: 1800 }],
        items: [{ id: bookItem.id, timeListening: 3600, libraryItem: bookItem }]
      })
      return
    }

    if (url.pathname === '/api/search/podcast') {
      await ok([{ id: 'itunes-1', title: 'Bigbookshelf Radio', artistName: 'Studio Team', trackCount: 12, genres: ['Technology'], feedUrl: 'https://example.test/feed.xml' }])
      return
    }

    if (url.pathname === '/api/podcasts/feed') {
      await ok({ podcast: podcastItem.media })
      return
    }

    await ok({})
  })
}

async function seedAuthenticatedSession(page, options = {}) {
  await page.addInitScript(seedTvFixtureStorage, storageSeedData(options))
}

async function markMockSocketConnected(page) {
  await page.evaluate(() => {
    window.$nuxt?.$store?.commit('setSocketConnected', true)
    if (window.$nuxt?.$socket) {
      window.$nuxt.$socket.connected = true
      window.$nuxt.$socket.isAuthenticated = true
    }
  })
}

async function connectToMockServer(page, options = {}) {
  await mockAudiobookshelf(page)
  await seedAuthenticatedSession(page, { ...options, includeServerConfig: false })
  await page.goto('/#/connect')
  await page.waitForFunction(() => window.$nuxt?.$route?.path === '/connect')
  await page.locator('#connect-address').waitFor({ state: 'visible' })
  await page.locator('#connect-address').fill(SERVER)
  await page.locator('#connect-username').fill('kenny')
  await page.locator('#connect-password').fill('secret')
  await expect(page.locator('#connect-address')).toHaveValue(SERVER)
  await page.locator('.bb-connect-signin-btn').click()
  await page.waitForFunction(() => window.location.hash === '#/bookshelf', null, { timeout: 20000 })
  await markMockSocketConnected(page)
}

module.exports = {
  SERVER,
  BOOK_LIBRARY_ID,
  PODCAST_LIBRARY_ID,
  SERVER_CONFIG_ID,
  authPayload,
  bookItem,
  podcastItem,
  episode,
  series,
  collection,
  playlist,
  localFolder,
  localBookItem,
  mockAudiobookshelf,
  seedAuthenticatedSession,
  markMockSocketConnected,
  connectToMockServer
}
