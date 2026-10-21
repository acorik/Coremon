#!/usr/bin/env bash
# Empaqueta la versión web (la que se sube a itch.io como "HTML"):
#   dist/web/                      -> carpeta lista para servir
#   dist/Coremon-<versión>-web.zip -> zip con index.html en la raíz
set -euo pipefail
cd "$(dirname "$0")/.."
VERSION=$(sed -n "s/^const GAME_VERSION = '\(.*\)';/\1/p" js/game.js)
rm -rf dist/web && mkdir -p dist/web
cp -r index.html manifest.webmanifest sw.js css js icons dist/web/
rm -f "dist/Coremon-${VERSION}-web.zip"
(cd dist/web && zip -qr "../Coremon-${VERSION}-web.zip" .)
echo "dist/Coremon-${VERSION}-web.zip"
