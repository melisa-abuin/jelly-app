#!/bin/bash

# Get root directory
ROOT_DIR=$(git rev-parse --show-toplevel)
cd "${ROOT_DIR}"

yarn && yarn build:desktop -v

# Make release dir
mkdir -p ./release

# Copy deb executable
cp "${ROOT_DIR}"/src-tauri/target/release/bundle/deb/*.deb ./release

# Copy rpm executable
cp "${ROOT_DIR}"/src-tauri/target/release/bundle/rpm/*.rpm ./release

# Copy appimage executable
cp "${ROOT_DIR}"/src-tauri/target/release/bundle/appimage/*.AppImage ./release

# Prepend 'desktop-' to all package files in ./release
for file in ./release/*.{deb,rpm,AppImage}; do
  echo "Prepending to $file..."
  [ -e "$file" ] || continue
  dir=$(dirname "$file")
  base=$(basename "$file")
  mv "$file" "$dir/desktop-$base"
done

echo "Done!"