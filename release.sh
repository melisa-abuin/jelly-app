#!/bin/bash
yarn build
cd $(dirname "$0")
mkdir -p ./release
tar -czf ./release/dist.tar.gz -C ./dist .
powershell.exe -Command "Compress-Archive -Path './dist/*' -DestinationPath './release/dist.zip'"
echo ""
read -p "Files created successfully. Press enter to exit or wait." -t 4