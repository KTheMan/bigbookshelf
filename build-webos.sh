#!/bin/bash
set -e

echo "Building Audiobookshelf for LG webOS TV..."

npm run build:web

echo "Creating webOS IPK package..."

mkdir -p ipk

cat > ipk/appinfo.json << EOF
{
  "id": "com.audiobookshelf.tv",
  "version": "$(node -p "require('./package.json').version")",
  "vendor": "advplyr",
  "type": "web",
  "main": "index.html",
  "title": "Audiobookshelf",
  "icon": "assets/icon.png",
  "largeIcon": "assets/largeIcon.png",
  "uiRevision": 2,
  "resolution": "1920x1080",
  "requiredPermissions": [
    "internet",
    "audio"
  ],
  "requiredMemory": 50,
  "handlesRelaunch": true,
  "disableBackHistoryAPI": false,
  "splashBackground": "assets/splash.png",
  "transparent": false,
  "bgColor": "#1a1a1a",
  "supportsAudioGuidance": false,
  "accessible": false,
  "inAppPurchase": false
}
EOF

cp -r dist/* ipk/

if command -v ares-package &> /dev/null; then
  ares-package ipk -o .
  echo "IPK created successfully!"
else
  echo "ares-package not found. Please install LG webOS SDK to create IPK."
  echo "The 'ipk' folder contains the app ready for packaging."
  echo "Run: ares-package ipk -o ."
fi

echo "Build complete!"