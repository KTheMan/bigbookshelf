#!/bin/bash
set -e

echo "Building Bigbookshelf for LG webOS TV..."

npm run build

if command -v ares-package &> /dev/null; then
  echo "Creating webOS IPK package..."
  ares-package dist --output ipk
  echo "IPK created successfully!"
else
  echo "ares-package not found. Please install LG webOS SDK to create IPK."
  echo "The 'dist' folder contains the app ready for packaging."
  echo "Run: ares-package dist --output ipk"
fi

echo "Build complete!"
