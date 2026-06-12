# Bigbookshelf (BBS) for LG webOS TV

An [Audiobookshelf](https://www.audiobookshelf.org/) client for LG webOS Smart TVs.

Built on top of the [Audiobookshelf Android app](https://github.com/advplyr/audiobookshelf-app) codebase, adapted for the TV experience with remote control navigation and a 10-foot UI.

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

- LG Smart TV running webOS 3.0 or later
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
   ares-install -d tv audiobookshelf-webos.ipk

   # Launch the app
   ares-launch -d tv com.audiobookshelf.tv
   ```

### Via USB

1. Download `audiobookshelf-webos.ipk` from [Releases](https://github.com/KTheMan/audiobookshelf-webos/releases)
2. Copy the IPK to a USB drive
3. On your LG TV, open the **Developer Mode** app
4. Select **Install from USB** and choose the IPK file

## Development

### Prerequisites

- Node.js 18+
- Docker (for builds) or the webOS TV SDK

### Local Development

```bash
# Install dependencies
npm install

# Start the dev server (serves the dist/ folder)
npm run dev
```

### Building

**Using Docker (recommended):**

```bash
docker build --network=host -t audiobookshelf-webos-builder .
```

**Using the webOS TV SDK:**

```bash
npm run build
```

Both methods produce:
- `dist/` — Static web files ready for deployment
- `audiobookshelf-webos.ipk` — Installable package for webOS TVs

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
├── appinfo.json            # webOS app manifest
├── nuxt.config.js          # Nuxt configuration
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
- **Browserslist**: `Samsung >= 3`, `Chrome >= 38`, `Safari >= 6`
- **Babel transpilation**: ES6+ → ES5 (arrow functions, async/await, template literals, etc.)
- **Runtime polyfills**: Map, URL, Promise, Array.from, crypto.getRandomValues, btoa

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
