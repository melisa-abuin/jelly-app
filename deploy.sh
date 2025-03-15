#!/bin/bash
yarn build
cd $(dirname "$0")
ssh simon@185.92.223.202 "rm -rf /var/www/jelly-app/*"
scp -r dist/* simon@185.92.223.202:/var/www/jelly-app/.
echo ""
read -p "Files transferred successfully. Press enter to exit or wait." -t 4