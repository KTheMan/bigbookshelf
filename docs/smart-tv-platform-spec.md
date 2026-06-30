# Smart TV Platform Compatibility Spec

This project ships one Nuxt 2 static web app into two packaged TV runtimes:

- LG webOS packaged web app, installed as an IPK with `ares-package`.
- Samsung Tizen TV web app, installed as a signed WGT with the Tizen Studio CLI.

The TV build contract is intentionally boring: `npm run build` runs `nuxt generate`, and Nuxt's `generate:done` hook prepares the generated `dist/` folder for both platforms. Agents and developers should not hand-copy manifests, write separate launch scripts for generation, or package from any folder other than `dist/`.

## Source Of Truth

- App identity, numeric platform version, and generated manifest contents live in `tv.platform.config.js`.
- `scripts/prepare-tv-dist.js` runs automatically after `nuxt generate`.
- `scripts/verify-tv-dist.js` checks the final `dist/` output and is exposed as `npm run verify:tv`.
- `appinfo.json` and `tizen/config.xml` are checked-in templates for native tooling and human review, but generated `dist/appinfo.json` and `dist/config.xml` are authoritative for packages.

## Nuxt Static Output Requirements

Nuxt must remain configured for a static client bundle:

- `ssr: false`
- `target: 'static'`
- `modern: false`
- `build.publicPath: './_nuxt/'`
- `browserslist: ["Chrome >= 38"]`
- `build.transpile`: include dependencies that publish modern syntax but can be loaded on TV, currently `vue-toastification`, `socket.io-client`, `engine.io-client`, `engine.io-parser`, `socket.io-parser`, `@socket.io/component-emitter`, `component-emitter`, `epubjs`, `xmldom`, `@teckel/vue-pdf`, `pdfjs-dist`, and `libarchive.js`.

The generated HTML must work under packaged app file origins. Every generated `.html` file needs:

- A relative `<base href>` pointing from that file back to `dist/`.
- Relative Nuxt chunk links, never `/_nuxt/...`.
- A relative favicon link, never `/favicon.ico`.
- A matching Nuxt `assetsPath` so lazy chunks resolve from nested generated routes.

`scripts/prepare-tv-dist.js` performs these rewrites for every generated HTML file, including route files and `404.html`.

## webOS Requirements

webOS packages must contain `appinfo.json` at the app root. Required project decisions:

- `id`: `com.bigbookshelf.tv`
- `main`: `index.html`
- `type`: `web`
- `version`: numeric `major.minor.patch` only. Package prerelease suffixes such as `-beta` must never appear in `appinfo.json`.
- `requiredPermissions`: include `internet` and `audio`.
- `handlesRelaunch`: `false` until explicit `webOSLaunch`/`webOSRelaunch` handling exists.
- Package with `ares-package dist --output ipk`; do not hand-build an IPK archive.

Runtime compatibility:

- Baseline is webOS 3.x, whose web engine is Chromium 38.
- Keep the shipped JavaScript ES5-compatible after Babel and polyfills.
- Keep `@capacitor/core` aliased to the local TV stub so Capacitor's modern browser bundle is not shipped.
- Use a single HTML5 audio element for playback. Multiple active media elements can conflict on TV runtimes.
- Do not rely on cookies for packaged webOS app persistence. Store server configs and tokens through the app's local storage/database path.
- Handle LG Back key code `461`.

Official references:

- [LG appinfo.json](https://webostv.developer.lge.com/develop/references/appinfo-json)
- [LG web engine versions](https://webostv.developer.lge.com/develop/specifications/web-api-and-web-engine)
- [LG CLI development guide](https://webostv.developer.lge.com/develop/tools/cli-dev-guide)
- [LG Back button behavior](https://webostv.developer.lge.com/develop/guides/back-button)
- [LG Magic Remote](https://webostv.developer.lge.com/develop/guides/magic-remote)
- [LG multi-sound playback](https://webostv.developer.lge.com/develop/guides/multi-sound-playback)

## Tizen Requirements

Tizen packages must contain `config.xml` at the app root. Required project decisions:

- `<content src="index.html"/>`
- `version`: numeric `major.minor.patch` only.
- `<access origin="*" subdomains="true"/>` so users can connect to arbitrary Audiobookshelf servers.
- `http://tizen.org/privilege/internet`
- `http://tizen.org/privilege/tv.inputdevice`
- `required_version="4.0"` to match the project's minimum Tizen target.
- Package with `tizen package -t wgt -- dist` after configuring a Tizen certificate profile. A raw zip is only a layout/debug fallback, not a store-ready signed WGT.

Runtime compatibility:

- Baseline is Tizen 4.0, whose TV web engine is Chromium M56.
- Register optional remote keys through `tizen.tvinputdevice.registerKeyBatch` when available, with `registerKey` fallback.
- Mandatory D-pad, Enter, and Back keys are delivered without registration; media, color, and channel keys must be registered.
- Handle Samsung Back key code `10009`.
- Keep network requests CORS-compatible with user-hosted Audiobookshelf servers.

Official references:

- [Samsung TV app configuration](https://developer.samsung.com/smarttv/develop/guides/fundamentals/configuring-tv-applications.html)
- [Samsung web engine versions](https://developer.samsung.com/smarttv/develop/specifications/web-engine-specifications.html)
- [Samsung CLI](https://developer.samsung.com/smarttv/develop/getting-started/using-sdk/command-line-interface.html)
- [Samsung certificates](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/creating-certificates.html)
- [Samsung remote control](https://developer.samsung.com/smarttv/develop/guides/user-interaction/remote-control.html)

## Runtime Shim Requirements

The TV build uses browser APIs plus local stubs, not native Capacitor runtimes:

- `@capacitor/core` resolves to `plugins/webos/capacitor-stubs/Core.js`.
- `Capacitor.getPlatform()` returns `web` so mobile-only initialization is skipped.
- `Capacitor.convertFileSrc()` is an identity function for TV file and HTTP URLs.
- `CapacitorHttp` uses `XMLHttpRequest`, not modern `fetch` assumptions, and returns Capacitor-like `{ status, data, headers, url }` responses.
- `registerPlugin()` returns the local web implementation directly.
- `WebPlugin` supports `addListener`, `removeAllListeners`, and `notifyListeners`.

## Developer Workflow

Use these commands:

```bash
npm install
npm run build
npm run verify:tv
npm run package:webos
npm run package:tizen
```

Notes:

- `npm run build` is the only generation entrypoint and runs `nuxt generate`.
- `npm run package:webos` runs the build and then `ares-package dist --output ipk`.
- `npm run package:tizen` runs the build and then `tizen package -t wgt -- dist`.
- Tizen packaging requires a local Tizen Studio certificate profile. Configure that in Tizen Studio or with the Tizen CLI before packaging.
- If CI lacks the Tizen CLI or signing profile, any zipped WGT artifact is unsigned and should be treated as a layout artifact only.

## Compatibility Checklist

Before changing package/build/runtime code, verify:

- `npm run verify:tv` passes.
- `dist/appinfo.json` and `dist/config.xml` contain numeric versions without prerelease suffixes.
- No generated HTML references `/_nuxt` or `/favicon.ico`.
- `dist/_nuxt` does not contain Capacitor's modern browser bundle fingerprints such as `CapacitorPlatforms` or `CapacitorException`.
- D-pad, Back, media, color, and channel keys still map through `TVRemoteHandler`.
- The app still creates only one `#audio-player` element for playback.

Nuxt references:

- [Nuxt target](https://v2.nuxt.com/docs/configuration-glossary/configuration-target/)
- [Nuxt generate](https://v2.nuxt.com/docs/configuration-glossary/configuration-generate/)
- [Nuxt static directory](https://v2.nuxt.com/docs/directory-structure/static/)
