#!/bin/bash

# Get root directory
ROOT_DIR=$(git rev-parse --show-toplevel)
cd $ROOT_DIR

# Clean dist
rm -rf ./dist

# Clean releases
rm -rf ./release

# Clean desktop
rm -rf ./src-tauri/target
