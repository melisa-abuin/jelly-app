#!/bin/bash

# Get root directory
ROOT_DIR=$(git rev-parse --show-toplevel)
cd "${ROOT_DIR}"

# Install dependencies and build desktop app
yarn && yarn build:desktop --target universal-apple-darwin -v

# Make release dir
mkdir -p ./release

# Copy DMG executable
cp "${ROOT_DIR}"/src-tauri/target/universal-apple-darwin/release/bundle/dmg/*.dmg ./release

# Prepend 'desktop-' to all package files in ./release
for file in ./release/*.dmg; do
  echo "Prepending to $file..."
  [ -e "$file" ] || continue
  dir=$(dirname "$file")
  base=$(basename "$file")
  mv "$file" "$dir/desktop-$base"
done

echo "Done!"
