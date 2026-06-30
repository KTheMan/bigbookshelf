# Bigbookshelf (BBS)

An [Audiobookshelf](https://www.audiobookshelf.org/) client for Smart TVs — LG webOS and Samsung Tizen.

Built on top of the [Audiobookshelf Android app](https://github.com/advplyr/audiobookshelf-app) codebase, adapted for the TV experience with remote control navigation and a 10-foot UI. Originally developed for LG webOS; Tizen support added later.

## Features

- Connect to any self-hosted Audiobookshelf server
- Browse audiobook and podcast libraries
- Full audio playback with progress tracking
- Remote control navigation (D-pad, media keys, color keys)
- Bookshelf grid with keyboard navigation
- Server connection management
- Sleep timer and playback speed controls
- Bookmarks and chapter navigation
- Download management
- Multi-language support (30+ languages)

## Requirements

- LG Smart TV running webOS 3.0 or later, **or** Samsung Smart TV running Tizen 4.0 or later
- An Audiobookshelf server (self-hosted or remote)

## Installation

### Via IPK (Developer Mode)

1. Enable **Developer Mode** on your LG TV:
   - Open the **Developer Mode** app from the LG Content Store
   - Sign in with your LG account
   - Enable Developer Mode and note the TV's IP address

2. Install the IPK:
   ```bash
   # Install the webOS CLI tools
   npm install -g @webos-tools/cli

   # Set up your TV as a device
   ares-setup-device -a tv -a <TV_IP_ADDRESS>

   # Install the IPK
   ares-install -d tv bigbookshelf-webos.ipk

   # Launch the app
   ares-launch -d tv com.bigbookshelf.tv
   ```

### Via SSH (rooted TV)

If your TV is rooted and reachable over SSH, you can pull the latest build
straight from GitHub Releases onto the TV — no local build or `scp` required.
The `releases/latest/download/...` URLs always resolve to the newest release.

**LG webOS:**

```bash
# SSH into the TV
ssh root@<TV_IP_ADDRESS>

# Download to the large user partition (the root fs is a tiny read-only
# overlay — opkg fails there with "Only have 0K bytes available").
curl -L -o /media/internal/bigbookshelf-webos.ipk \
  https://github.com/KTheMan/audiobookshelf-webos/releases/latest/download/bigbookshelf-webos.ipk

# Install via the webOS install service (routes into /media/developer; survives
# reboots). Use -i to watch status through to "installed".
luna-send -i 'luna://com.webos.appInstallService/dev/install' \
  '{"id":"com.bigbookshelf.tv","ipkUrl":"/media/internal/bigbookshelf-webos.ipk","subscribe":true}'

# Launch
luna-send -n 1 'luna://com.webos.service.applicationManager/launch' \
  '{"id":"com.bigbookshelf.tv"}'
```

> `opkg install` also works on some firmwares, but only if the root partition
> has space — the install service above is the reliable route.

To upgrade later, re-run the `curl` + install steps; remove the old copy first
with `luna-send -n 1 'luna://com.webos.appInstallService/remove' '{"id":"com.bigbookshelf.tv"}'`
if an install refuses to overwrite.

**Samsung Tizen:**

```bash
# Download the latest WGT onto the TV (or your dev machine, for sdb install)
curl -L -o /tmp/bigbookshelf-tizen.wgt \
  https://github.com/KTheMan/audiobookshelf-webos/releases/latest/download/bigbookshelf-tizen.wgt

# Install with the Tizen Studio CLI from a connected dev machine
sdb connect <TV_IP_ADDRESS>
tizen install -n /tmp/bigbookshelf-tizen.wgt -t <device-id>
```

> One-liner (download + install on a webOS TV in a single SSH command):
> ```bash
> ssh root@<TV_IP_ADDRESS> 'curl -L -o /media/internal/bbs.ipk https://github.com/KTheMan/audiobookshelf-webos/releases/latest/download/bigbookshelf-webos.ipk && luna-send -n 5 "luna://com.webos.appInstallService/dev/install" "{\"id\":\"com.bigbookshelf.tv\",\"ipkUrl\":\"/media/internal/bbs.ipk\",\"subscribe\":true}"'
> ```

### Via USB

1. Download `bigbookshelf-webos.ipk` (LG) or `bigbookshelf-tizen.wgt` (Samsung) from [the latest release](https://github.com/KTheMan/audiobookshelf-webos/releases/latest)
2. Copy the package to a USB drive
3. On your TV, open the **Developer Mode** (LG) or **Device Manager** (Samsung) app
4. Select **Install from USB** and choose the package file

## Development

### Prerequisites

- Node.js 18+
- Docker (for static builds)
- LG webOS CLI (`ares-package`) for IPK packaging
- Tizen Studio CLI plus a certificate profile for signed WGT packaging

### Local Development

```bash
# Install dependencies
npm install

# Start the dev server (serves the dist/ folder)
npm run dev
```

### Building

The Smart TV platform requirements are documented in [docs/smart-tv-platform-spec.md](docs/smart-tv-platform-spec.md).

**Static build:**

```bash
npm run build
npm run verify:tv
```

`npm run build` runs `nuxt generate`. Nuxt's generate hook writes the webOS and Tizen manifests, copies TV package assets, and rewrites generated HTML so the app loads correctly from packaged `file://` origins.

**Using Docker:**

```bash
docker build --network=host -t audiobookshelf-webos-builder .
```

**Package for LG webOS:**

```bash
npm run package:webos
```

**Package for Samsung Tizen:**

```bash
npm run package:tizen
```

Build outputs:
- `dist/` — Static web files ready for deployment
- `ipk/*.ipk` — Installable package for webOS TVs after `npm run package:webos`
- `*.wgt` — Signed Tizen package after `npm run package:tizen`

### Project Structure

```
audiobookshelf-webos/
├── assets/                  # Static assets (CSS, fonts, images)
├── components/
│   ├── webos/              # TV-specific components
│   │   ├── AudioPlayerTV.vue
│   │   └── BookshelfGrid.vue
│   └── ...                 # Shared components from Android app
├── layouts/
│   └── default.vue         # TV-optimized layout
├── pages/                  # Route pages
├── plugins/
│   └── webos/              # webOS native plugins
│       ├── AbsAudioPlayer.js
│       ├── AbsDatabase.js
│       ├── AbsDownloader.js
│       ├── AbsFileSystem.js
│       ├── AbsLogger.js
│       ├── TVRemoteHandler.js
│       ├── capacitor-stubs/ # Capacitor API stubs for web
│       ├── index.js
│       └── polyfills.js    # ES5 polyfills for webOS 3.0
├── static/                 # Static files served as-is
├── store/                  # Vuex store modules
├── strings/                # i18n translation files
├── docs/
│   └── smart-tv-platform-spec.md # webOS/Tizen compatibility contract
├── scripts/
│   ├── prepare-tv-dist.js  # Nuxt generate hook for package-ready dist/
│   └── verify-tv-dist.js   # Build output checks for TV packages
├── appinfo.json            # webOS app manifest
├── nuxt.config.js          # Nuxt configuration
├── tv.platform.config.js   # Shared webOS/Tizen app identity and manifests
├── tailwind.config.js      # Tailwind CSS configuration
└── Dockerfile              # Docker build environment
```

### WebOS Plugins

The app uses custom webOS plugins that replace Capacitor native APIs:

| Plugin | Purpose |
|---|---|
| `AbsAudioPlayer` | Audio playback via HTML5 Audio |
| `AbsDatabase` | Local storage for server configs and device data |
| `AbsDownloader` | Download management (stub — not supported on TV) |
| `AbsFileSystem` | File system access (stub — not supported on TV) |
| `AbsLogger` | Logging to localStorage |
| `TVRemoteHandler` | Remote control key handling and spatial navigation |
| `polyfills.js` | ES5 polyfills for webOS 3.0 compatibility |

### Building for Older webOS Versions

The app targets webOS 3.0+ via:
- **Browserslist**: `Chrome >= 38`
- **Babel transpilation**: ES6+ → ES5 (arrow functions, async/await, template literals, etc.)
- **Runtime polyfills**: Map, URL, Promise, Array.from, crypto.getRandomValues, btoa
- **Capacitor stubs**: `@capacitor/core` and mobile plugins resolve to TV-safe browser shims

### CI/CD

GitHub Actions automatically builds the IPK on push to `main` and creates releases on tag push.

```bash
# Tag a release
git tag -a v0.14.0 -m "Release v0.14.0"
git push --tags
```

The workflow will:
1. Build the Nuxt static site
2. Package as IPK
3. Create a GitHub Release with the IPK attached

## Troubleshooting

**App won't install:**
- Ensure Developer Mode is enabled on your TV
- Check that your computer and TV are on the same network
- Verify the TV's IP address hasn't changed

**App launches but shows a blank screen:**
- Check your Audiobookshelf server is accessible from the TV
- Verify the server URL in the connection settings
- Check the TV's internet connection

**Remote control not responding:**
- The app uses D-pad navigation — try arrow keys
- Press **Back** to return to previous screens
- Media keys (play/pause/stop) are supported during playback

## Contributing

Contributions are welcome! Please follow the existing code style and test on a real TV or the webOS Simulator when possible.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on the webOS Simulator or a real TV
5. Submit a pull request

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE) — the same license as the [Audiobookshelf Android app](https://github.com/advplyr/audiobookshelf-app).

## Credits

- [Audiobookshelf](https://www.audiobookshelf.org/) by advplyr
- [Audiobookshelf Android app](https://github.com/advplyr/audiobookshelf-app) — the foundation for this project
- [Nuxt.js](https://nuxtjs.org/) — the web framework
- [Tailwind CSS](https://tailwindcss.com/) — the CSS framework

## Disclaimer

This is an unofficial client for Audiobookshelf. It is not affiliated with or endorsed by the Audiobookshelf project.
