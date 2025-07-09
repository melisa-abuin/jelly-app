#!/bin/bash

# Get root directory
ROOT_DIR=$(git rev-parse --show-toplevel)
cd "${ROOT_DIR}"

yarn && yarn build

# Make release dir
mkdir -p ./release

# Pack as .tar.gz
tar -czf ./release/web-static.tar.gz -C ./dist .

# Pack as .zip
cd dist && zip -r ../release/web-static.zip .

echo "Done!"