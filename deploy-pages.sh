#!/bin/sh
# Publishes the RBS Circuit Lab as its own website on GitHub Pages (the gh-pages branch of this repo).
# On its own page the lab can use USB (Upload → USB cable flashes the RBS bit) and the Bluetooth device popup,
# which a page shown inside claude.ai cannot.
#
#   ./deploy-pages.sh
#
# Then, once: GitHub → this repo → Settings → Pages → Source: "Deploy from a branch", branch gh-pages, folder / (root).
# The site: https://roboticschools-website.github.io/rbs-circuits/
set -e
cd "$(dirname "$0")"
origin=$(git remote get-url origin)
tmp=$(mktemp -d)
mkdir -p "$tmp/firmware"
{
  printf '<!doctype html><html lang="en"><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'
  cat index.html
  printf '</body></html>\n'
} > "$tmp/index.html"
cp firmware/microbit-micropython-v2.hex "$tmp/firmware/"
touch "$tmp/.nojekyll"
cd "$tmp"
git init -q -b gh-pages
git add -A
git commit -q -m "RBS Circuit Lab website ($(date '+%Y-%m-%d %H:%M'))"
git push -f "$origin" gh-pages:gh-pages   # the branch only ever holds the built site, so it is replaced each time
echo "Published. In a minute or two: https://roboticschools-website.github.io/rbs-circuits/"
